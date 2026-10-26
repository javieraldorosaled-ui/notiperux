import { Firestore } from '@google-cloud/firestore';
import fs from 'fs';
import path from 'path';
import { FuelStation, PriceTrend } from '../types';
import { updateBaselineFuels, BASELINE_FUELS } from './baselineData';
import {
  isQuotaExceededError,
  isServerFirestoreReady,
  markServerFirestoreQuotaExceeded,
} from './firestoreQuotaGuard';
import firebaseConfig from '../../firebase-applet-config.json';

let adminFirestore: Firestore | null = null;

try {
  adminFirestore = new Firestore({
    projectId: firebaseConfig.projectId,
    databaseId: (firebaseConfig as Record<string, unknown>)?.firestoreDatabaseId as string || '(default)',
  });
  console.log('[Firestore Server] @google-cloud/firestore cliente inicializado para proyecto:', firebaseConfig.projectId);
} catch (err) {
  console.warn('[Firestore Server] Advertencia al inicializar @google-cloud/firestore:', err);
}

export interface PersistenceResult {
  success: boolean;
  stationsCount: number;
  priceVariations: number;
  method: 'google-cloud-firestore' | 'memory-only';
  stations?: FuelStation[];
  error?: string;
}

const FUELS_JSON_PATH = path.join(process.cwd(), 'data', 'fuels-huanuco.json');

function calculateTrend(
  newPrice: number | null | undefined,
  prevPrice: number | null | undefined,
  prevTrend?: PriceTrend
): PriceTrend {
  if (newPrice === null || newPrice === undefined || prevPrice === null || prevPrice === undefined) {
    return prevTrend || 'stable';
  }
  const diff = newPrice - prevPrice;
  if (diff > 0.05) return 'up';
  if (diff < -0.05) return 'down';
  return prevTrend || 'stable';
}

function pickNewerReportDate(dateA?: string, dateB?: string): string {
  if (!dateA && !dateB) return '';
  if (!dateA) return dateB!;
  if (!dateB) return dateA;
  const timeA = new Date(dateA).getTime();
  const timeB = new Date(dateB).getTime();
  if (!isNaN(timeA) && !isNaN(timeB)) {
    return timeA >= timeB ? dateA : dateB;
  }
  return dateA >= dateB ? dateA : dateB;
}

/**
 * Fusiona una estación existente con nuevos datos de Osinergmin sin sobrescribir
 * precios válidos existentes con null y conservando las fechas reales de reporte.
 */
export function mergeFuelStation(
  existing: FuelStation | undefined,
  incoming: FuelStation
): { merged: FuelStation; priceChanged: boolean } {
  if (!existing) {
    const reportDate = incoming.lastReportedDate || incoming.updatedAt;
    const normalized: FuelStation = {
      ...incoming,
      gas90: incoming.gas90 ?? null,
      gas90Trend: incoming.gas90Trend || 'stable',
      gas95: incoming.gas95 ?? null,
      gas95Trend: incoming.gas95Trend || 'stable',
      diesel: incoming.diesel ?? null,
      dieselTrend: incoming.dieselTrend || 'stable',
      glp: incoming.glp ?? null,
      glpTrend: incoming.glpTrend || 'stable',
      updatedAt: reportDate,
      lastReportedDate: reportDate,
      createdAt: incoming.createdAt || reportDate,
      trustLevel: incoming.trustLevel || 'verified',
      verificationStatus: incoming.verificationStatus || 'VERIFICADO',
      source: incoming.source || 'Osinergmin SCOP (Reporte Oficial Diario)',
      isAvailable:
        (incoming.gas90 !== null && incoming.gas90 !== undefined) ||
        (incoming.gas95 !== null && incoming.gas95 !== undefined) ||
        (incoming.diesel !== null && incoming.diesel !== undefined) ||
        (incoming.glp !== null && incoming.glp !== undefined),
    };
    return { merged: normalized, priceChanged: false };
  }

  const gas90 = incoming.gas90 !== null && incoming.gas90 !== undefined ? incoming.gas90 : (existing.gas90 ?? null);
  const gas95 = incoming.gas95 !== null && incoming.gas95 !== undefined ? incoming.gas95 : (existing.gas95 ?? null);
  const diesel = incoming.diesel !== null && incoming.diesel !== undefined ? incoming.diesel : (existing.diesel ?? null);
  const glp = incoming.glp !== null && incoming.glp !== undefined ? incoming.glp : (existing.glp ?? null);

  const priceChanged =
    (incoming.gas90 !== null && incoming.gas90 !== undefined && existing.gas90 !== null && incoming.gas90 !== existing.gas90) ||
    (incoming.gas95 !== null && incoming.gas95 !== undefined && existing.gas95 !== null && incoming.gas95 !== existing.gas95) ||
    (incoming.diesel !== null && incoming.diesel !== undefined && existing.diesel !== null && incoming.diesel !== existing.diesel) ||
    (incoming.glp !== null && incoming.glp !== undefined && existing.glp !== null && incoming.glp !== existing.glp);

  const bestReportedDate = pickNewerReportDate(
    incoming.lastReportedDate || incoming.updatedAt,
    existing.lastReportedDate || existing.updatedAt
  );

  const merged: FuelStation = {
    ...existing,
    ...incoming,
    id: existing.id || incoming.id,
    name: incoming.name || existing.name,
    brand: incoming.brand || existing.brand,
    address: incoming.address || existing.address,
    district: incoming.district || existing.district,
    googleMapsQuery: incoming.googleMapsQuery || existing.googleMapsQuery,
    gas90,
    gas90Trend: calculateTrend(incoming.gas90, existing.gas90, existing.gas90Trend),
    gas95,
    gas95Trend: calculateTrend(incoming.gas95, existing.gas95, existing.gas95Trend),
    diesel,
    dieselTrend: calculateTrend(incoming.diesel, existing.diesel, existing.dieselTrend),
    glp,
    glpTrend: calculateTrend(incoming.glp, existing.glp, existing.glpTrend),
    updatedAt: bestReportedDate,
    lastReportedDate: bestReportedDate,
    createdAt: existing.createdAt || incoming.createdAt || bestReportedDate,
    trustLevel: incoming.trustLevel || existing.trustLevel || 'verified',
    verificationStatus: incoming.verificationStatus || existing.verificationStatus || 'VERIFICADO',
    source: incoming.source || existing.source || 'Osinergmin SCOP (Reporte Oficial Diario)',
    sourceUrl: incoming.sourceUrl || existing.sourceUrl,
    ruc: incoming.ruc || existing.ruc,
    registroHidrocarburos: incoming.registroHidrocarburos || existing.registroHidrocarburos,
    rawRazonSocial: incoming.rawRazonSocial || existing.rawRazonSocial,
    isAvailable: gas90 !== null || gas95 !== null || diesel !== null || glp !== null,
  };

  return { merged, priceChanged };
}

export function readFuelsJsonFile(): { stations: FuelStation[]; lastSync?: string } | null {
  try {
    if (fs.existsSync(FUELS_JSON_PATH)) {
      const raw = fs.readFileSync(FUELS_JSON_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.stations) && parsed.stations.length > 0) {
        return {
          stations: parsed.stations as FuelStation[],
          lastSync: parsed.lastSync,
        };
      }
    }
  } catch (err) {
    console.warn('[Fuels Persist] Aviso al leer data/fuels-huanuco.json:', err);
  }
  return null;
}

export function writeFuelsJsonFile(stations: FuelStation[], lastSync?: string): void {
  try {
    const dir = path.dirname(FUELS_JSON_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const payload = {
      status: 'SUCCESS',
      source: 'Osinergmin SCOP Oficial',
      lastSync: lastSync || new Date().toISOString(),
      totalStations: stations.length,
      districts: ['Huánuco Cercado', 'Amarilis', 'Pillco Marca'],
      stations,
    };
    fs.writeFileSync(FUELS_JSON_PATH, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Fuels Persist] Aviso al escribir data/fuels-huanuco.json:', err);
  }
}

/**
 * Consulta las estaciones con la prioridad oficial:
 * 1. Firestore (colección fuelStations) mediante credenciales de servidor
 * 2. data/fuels-huanuco.json como respaldo persistente
 * 3. BASELINE_FUELS como último fallback de emergencia
 */
export async function getFuelsFromServer(): Promise<{
  status: 'SUCCESS' | 'FALLBACK';
  timestamp: string;
  count: number;
  stations: FuelStation[];
}> {
  const fileData = readFuelsJsonFile();

  if (isServerFirestoreReady(adminFirestore) && adminFirestore) {
    try {
      const snap = await adminFirestore.collection('fuelStations').get();
      if (!snap.empty) {
        const mergedMap = new Map<string, FuelStation>();

        // Cargar primero las estaciones del archivo local si existen para asegurar cero pérdida
        if (fileData?.stations) {
          for (const st of fileData.stations) {
            if (st && st.id) {
              const { merged } = mergeFuelStation(undefined, st);
              mergedMap.set(st.id, merged);
            }
          }
        }

        // Fusionar documentos de Firestore (prioridad 1)
        snap.forEach((docSnap) => {
          const d = docSnap.data() as FuelStation;
          const id = docSnap.id || d.id;
          if (!id) return;
          const stationObj: FuelStation = {
            ...d,
            id,
            lastReportedDate: d.lastReportedDate || d.updatedAt || '',
            updatedAt: d.updatedAt || d.lastReportedDate || '',
          };
          const { merged } = mergeFuelStation(mergedMap.get(id), stationObj);
          mergedMap.set(id, merged);
        });

        const stations = Array.from(mergedMap.values());

        // Si el archivo local tenía menos estaciones o estaba desactualizado, sincronizarlo
        if (!fileData || fileData.stations.length !== stations.length) {
          writeFuelsJsonFile(stations, new Date().toISOString());
        }

        updateBaselineFuels(stations);

        const latestReport = stations
          .map((s) => s.updatedAt)
          .filter(Boolean)
          .sort()
          .reverse()[0];

        return {
          status: 'SUCCESS',
          timestamp: fileData?.lastSync || latestReport || new Date().toISOString(),
          count: stations.length,
          stations,
        };
      }
    } catch (err) {
      if (isQuotaExceededError(err)) {
        markServerFirestoreQuotaExceeded(err);
      } else {
        console.log('[Firestore Server] Usando respaldo local data/fuels-huanuco.json.');
      }
    }
  }

  // Prioridad 2: Respaldo persistente en disco (data/fuels-huanuco.json)
  if (fileData && fileData.stations.length > 0) {
    return {
      status: 'SUCCESS',
      timestamp: fileData.lastSync || fileData.stations[0]?.updatedAt || '',
      count: fileData.stations.length,
      stations: fileData.stations,
    };
  }

  // Prioridad 3: Último fallback de emergencia (BASELINE_FUELS)
  return {
    status: 'FALLBACK',
    timestamp: BASELINE_FUELS[0]?.updatedAt || '2026/09/19 23:22:16',
    count: BASELINE_FUELS.length,
    stations: BASELINE_FUELS,
  };
}

/**
 * Guarda o actualiza estaciones de combustible en la colección 'fuelStations' de Firestore
 * y sincroniza data/fuels-huanuco.json mediante MERGE por id sin perder estaciones ni precios.
 */
export async function persistFuelsToFirestore(stations: FuelStation[]): Promise<PersistenceResult> {
  if (!stations || !Array.isArray(stations) || stations.length === 0) {
    return {
      success: false,
      stationsCount: 0,
      priceVariations: 0,
      method: 'memory-only',
      error: 'Lista de estaciones vacía o inválida',
    };
  }

  const mergedMap = new Map<string, FuelStation>();

  // 1. Cargar estaciones existentes desde data/fuels-huanuco.json
  const fileData = readFuelsJsonFile();
  if (fileData?.stations) {
    for (const st of fileData.stations) {
      if (st && st.id) {
        const { merged } = mergeFuelStation(undefined, st);
        mergedMap.set(st.id, merged);
      }
    }
  }

  // 2. Cargar estaciones existentes desde Firestore (fuelStations) para hacer MERGE completo
  if (isServerFirestoreReady(adminFirestore) && adminFirestore) {
    try {
      const existingSnap = await adminFirestore.collection('fuelStations').get();
      existingSnap.forEach((docSnap) => {
        const d = docSnap.data() as FuelStation;
        const id = docSnap.id || d.id;
        if (!id) return;
        const { merged } = mergeFuelStation(mergedMap.get(id), { ...d, id });
        mergedMap.set(id, merged);
      });
    } catch (readErr) {
      if (isQuotaExceededError(readErr)) {
        markServerFirestoreQuotaExceeded(readErr);
      }
    }
  }

  // 3. Hacer MERGE por id con las estaciones entrantes del pipeline de Osinergmin
  let priceVariations = 0;
  for (const incoming of stations) {
    if (!incoming || !incoming.id) continue;
    const prev = mergedMap.get(incoming.id);
    const { merged, priceChanged } = mergeFuelStation(prev, incoming);
    if (priceChanged) {
      priceVariations++;
    }
    mergedMap.set(incoming.id, merged);
  }

  const allMergedStations = Array.from(mergedMap.values());
  const now = new Date().toISOString();

  // 4. Actualizar data/fuels-huanuco.json con el conjunto completo sincronizado
  writeFuelsJsonFile(allMergedStations, now);

  // 5. Actualizar memoria del proceso
  updateBaselineFuels(allMergedStations);

  // 6. Persistir en Firestore usando el cliente de servidor (@google-cloud/firestore)
  if (isServerFirestoreReady(adminFirestore) && adminFirestore) {
    try {
      const batch = adminFirestore.batch();
      const colRef = adminFirestore.collection('fuelStations');

      for (const st of allMergedStations) {
        const docRef = colRef.doc(st.id);
        const cleanData = JSON.parse(JSON.stringify(st));
        batch.set(docRef, cleanData, { merge: true });
      }

      // Registro de auditoría
      const auditRef = adminFirestore.collection('updates').doc();
      batch.set(auditRef, {
        timestamp: now,
        service: 'Osinergmin SCOP -> Firestore & Local JSON Sync',
        source: 'Osinergmin SCOP Oficial',
        stationsUpdated: allMergedStations.length,
        priceVariationsDetected: priceVariations,
        districts: ['Huánuco Cercado', 'Amarilis', 'Pillco Marca'],
        status: 'SUCCESS',
      });

      await batch.commit();
      console.log(
        `[Firestore Server] ¡Sincronizadas ${allMergedStations.length} estaciones en Firestore (fuelStations) y data/fuels-huanuco.json exitosamente!`
      );

      return {
        success: true,
        stationsCount: allMergedStations.length,
        priceVariations,
        method: 'google-cloud-firestore',
        stations: allMergedStations,
      };
    } catch (dbError: any) {
      if (isQuotaExceededError(dbError)) {
        markServerFirestoreQuotaExceeded(dbError);
      }
      return {
        success: true,
        stationsCount: allMergedStations.length,
        priceVariations,
        method: 'memory-only',
        stations: allMergedStations,
      };
    }
  }

  return {
    success: true,
    stationsCount: allMergedStations.length,
    priceVariations,
    method: 'memory-only',
    stations: allMergedStations,
  };
}
