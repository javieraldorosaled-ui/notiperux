import { FuelStation } from '../types';
import {
  fetchAndNormalizeOsinergminFuels,
  OSINERGMIN_CSV_RESOURCES,
} from './osinergminCsvService';
import { updateBaselineFuels, BASELINE_FUELS } from './baselineData';
import { persistFuelsToFirestore, getFuelsFromServer } from './fuelPersistServer';

export interface IngestionResult {
  timestamp: string;
  source: string;
  sourceUrl: string;
  status: 'SUCCESS' | 'WAF_BLOCKED' | 'ERROR' | 'FALLBACK_SYNC';
  httpStatus?: number;
  message: string;
  recordsTotalScanned: number;
  recordsHuanucoFiltered: number;
  stationsUpdated: number;
  priceVariationsDetected: number;
  diagnostics: {
    endpointQueried: string;
    authMethod: string;
    blockReason?: string;
    executionDurationMs: number;
    bytesLiquidsReceived?: number;
    bytesGLPReceived?: number;
  };
  sampleDocumentWritten?: Partial<FuelStation>;
  stations?: FuelStation[];
}

/**
 * Pipeline de Ingesta Oficial de Combustibles Osinergmin SCOP:
 * 1. Descarga eficiente por HTTP Range del CSV oficial CL-Registro-precios-DMA-V-CCA-CCE.csv
 * 2. Procesamiento a través de osinergminCsvService
 * 3. Filtrado para Huánuco, Amarilis y Pillco Marca
 * 4. Normalización estandarizada a la estructura FuelStation
 * 5. Persistencia mediante MERGE por id en colección 'fuelStations' de Firestore y en data/fuels-huanuco.json
 */
export async function runFuelIngestionPipeline(): Promise<IngestionResult> {
  const startTime = Date.now();
  const now = new Date().toISOString();
  const sourceUrl = OSINERGMIN_CSV_RESOURCES.STATIONS_LIQUIDS.url;

  // 1. Obtener estaciones existentes desde Firestore / data/fuels-huanuco.json (sin usar Web SDK del navegador)
  const existingMap = new Map<string, FuelStation>();
  try {
    const currentServerData = await getFuelsFromServer();
    currentServerData.stations.forEach((st) => {
      if (st && st.id) existingMap.set(st.id, st);
    });
  } catch (err) {
    console.warn('[FuelIngestion] Aviso al obtener estaciones previas:', err);
    BASELINE_FUELS.forEach((st) => existingMap.set(st.id, st));
  }

  // 2. Ejecutar descarga eficiente por HTTP Range y normalización de Osinergmin SCOP
  try {
    console.log('[FuelIngestion] Descargando bloque oficial de Osinergmin SCOP mediante HTTP Range...');
    const result = await fetchAndNormalizeOsinergminFuels({
      rangeBytesLiquids: 8 * 1024 * 1024, // 8 MB de los últimos días
      rangeBytesGLP: 2 * 1024 * 1024, // 2 MB de GLP
      existingStations: Array.from(existingMap.values()),
    });

    const stationsFromCsv = result.stations;

    // 3. Persistir en Firestore y actualizar data/fuels-huanuco.json mediante MERGE por id
    const persistResult = await persistFuelsToFirestore(stationsFromCsv);
    const allSyncedStations = persistResult.stations || stationsFromCsv;
    const priceVariationsDetected = persistResult.priceVariations;

    // 4. Actualizar memoria baseline para soporte inmediato
    updateBaselineFuels(allSyncedStations);

    const durationMs = Date.now() - startTime;
    console.log(
      `[FuelIngestion] Ingesta exitosa: ${allSyncedStations.length} estaciones totales sincronizadas (${stationsFromCsv.length} en bloque CSV actual) en ${durationMs}ms`
    );

    return {
      timestamp: now,
      source: 'Osinergmin SCOP (Centro Documental Oficial)',
      sourceUrl,
      status: 'SUCCESS',
      httpStatus: 206,
      message: `Ingesta oficial completada: ${allSyncedStations.length} estaciones sincronizadas en Huánuco, Amarilis y Pillco Marca.`,
      recordsTotalScanned: result.meta.rawLiquidsCount,
      recordsHuanucoFiltered: result.meta.rawHuanucoCount,
      stationsUpdated: allSyncedStations.length,
      priceVariationsDetected,
      diagnostics: {
        endpointQueried: sourceUrl,
        authMethod: 'HTTP Range Request / Public SCOP Repository',
        executionDurationMs: durationMs,
        bytesLiquidsReceived: result.meta.bytesLiquids,
        bytesGLPReceived: result.meta.bytesGLP,
      },
      sampleDocumentWritten: allSyncedStations[0],
      stations: allSyncedStations,
    };
  } catch (err: any) {
    console.error('[FuelIngestion] Error en pipeline de Osinergmin SCOP:', err);

    const fallbackStations = existingMap.size > 0 ? Array.from(existingMap.values()) : BASELINE_FUELS;

    return {
      timestamp: now,
      source: 'Osinergmin SCOP (Fallback)',
      sourceUrl,
      status: 'FALLBACK_SYNC',
      httpStatus: 500,
      message: `Error al conectar con Osinergmin (${err?.message || 'Error de red'}). Se conservaron las estaciones verificadas.`,
      recordsTotalScanned: 0,
      recordsHuanucoFiltered: fallbackStations.length,
      stationsUpdated: fallbackStations.length,
      priceVariationsDetected: 0,
      diagnostics: {
        endpointQueried: sourceUrl,
        authMethod: 'HTTP Range Request',
        blockReason: err?.message,
        executionDurationMs: Date.now() - startTime,
      },
      sampleDocumentWritten: fallbackStations[0],
      stations: fallbackStations,
    };
  }
}
