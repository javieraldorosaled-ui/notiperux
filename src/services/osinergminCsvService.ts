import { FuelStation, PriceTrend } from '../types';

/**
 * Adaptador Oficial para Recursos CSV Públicos de Osinergmin
 *
 * Fuentes oficiales de datos de hidrocarburos:
 * 1. CL-Registro-precios-DMA-V-CCA-CCE.csv: Precios de venta al público en estaciones de servicio y grifos
 * 2. GLP-Registro-precios-PIC-PE-V.csv: Precios de GLP automotor (GLP-G) y cilindros
 * 3. CL-Registro-precios-DMIN.csv: Distribuidores minoristas de combustibles líquidos
 */

export interface RawOsinergminCsvRecord {
  id?: string;
  actividad?: string;
  registroHidrocarburos?: string;
  ruc?: string;
  razonSocial?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
  fechaRegistro?: string;
  producto?: string;
  precioVenta?: number | null;
  precioMin?: number | null;
  precioMax?: number | null;
  unidad?: string;
  rawLine?: string;
}

export interface NormalizedFuelStation {
  stationId: string;
  name: string;
  ruc: string;
  registroHidrocarburos: string;
  department: string;
  province: string;
  district: string;
  address: string;
  prices: {
    gasoholRegular?: number | null;
    gasoholPremium?: number | null;
    diesel?: number | null;
    glp?: number | null;
  };
  lastReportedDate: string;
  source: string;
  verificationStatus: 'REPORTADO' | 'VERIFICADO';
}

export const OSINERGMIN_CSV_RESOURCES = {
  STATIONS_LIQUIDS: {
    id: 'CL-Registro-precios-DMA-V-CCA-CCE',
    name: 'Lista de precios de Distribuidores Mayoristas, Establecimientos de Venta al Público, CCA y CCE',
    url: 'https://www.osinergmin.gob.pe/seccion/centro_documental/hidrocarburos/SCOP/SCOP-DOCS/Reporte-Diario/CL-Registro-precios-DMA-V-CCA-CCE.csv',
    type: 'estaciones_grifos',
    approxSizeMB: 1300,
  },
  GLP_PRICES: {
    id: 'GLP-Registro-precios-PIC-PE-V',
    name: 'Lista de precios de GLP de Productores, Importadores, Comercializadores, Plantas Envasadoras y Establecimientos de Venta al Público',
    url: 'https://www.osinergmin.gob.pe/seccion/centro_documental/hidrocarburos/SCOP/SCOP-DOCS/Reporte-Diario/GLP-Registro-precios-PIC-PE-V.csv',
    type: 'glp',
    approxSizeMB: 720,
  },
  MINORISTAS: {
    id: 'CL-Registro-precios-DMIN',
    name: 'Registro de precios de Distribuidores Minoristas de Combustibles Líquidos',
    url: 'https://www.osinergmin.gob.pe/seccion/centro_documental/hidrocarburos/SCOP/SCOP-DOCS/Reporte-Diario/CL-Registro-precios-DMIN.csv',
    type: 'minoristas',
    approxSizeMB: 20,
  },
  DATOS_ABIERTOS_ANON: {
    id: 'precios_combustibles_anonimizados',
    name: 'Lista de Precios de combustibles diaria (Anonimizada)',
    url: 'https://www.datosabiertos.gob.pe/sites/default/files/precios_combustibles_anonimizados_20260301_part1.csv',
    type: 'datos_abiertos_anonimizado',
    approxSizeMB: 29,
  },
};

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Descarga o realiza lectura por rango del CSV oficial de Osinergmin
 */
export async function downloadOfficialFuelCsv(options?: {
  resource?: keyof typeof OSINERGMIN_CSV_RESOURCES;
  rangeBytes?: number; // Permite traer solo el final del archivo donde están los datos más recientes
  customUrl?: string;
}): Promise<{
  rawText: string;
  httpStatus: number;
  contentLength: number;
  lastModified: string | null;
  sourceUrl: string;
  durationMs: number;
}> {
  const resourceKey = options?.resource || 'STATIONS_LIQUIDS';
  const resourceInfo = OSINERGMIN_CSV_RESOURCES[resourceKey];
  const url = options?.customUrl || resourceInfo.url;

  const headers: Record<string, string> = {
    'User-Agent': BROWSER_USER_AGENT,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  // Si se solicita rango de bytes (por defecto para archivos gigantes como DMA-V de 1.3GB)
  if (options?.rangeBytes && options.rangeBytes > 0) {
    try {
      const headResp = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': BROWSER_USER_AGENT },
      });
      const totalBytes = parseInt(headResp.headers.get('content-length') || '0', 10);
      if (totalBytes > options.rangeBytes) {
        const startByte = Math.max(0, totalBytes - options.rangeBytes);
        headers['Range'] = `bytes=${startByte}-${totalBytes - 1}`;
      }
    } catch (e) {
      console.warn('[OsinergminCsvService] No se pudo obtener HEAD para Range, solicitando directo:', e);
    }
  }

  const startTime = Date.now();
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok && response.status !== 206) {
    throw new Error(
      `Fallo al obtener recurso CSV de Osinergmin (${url}): HTTP ${response.status} ${response.statusText}`
    );
  }

  const arrayBuf = await response.arrayBuffer();
  const rawText = Buffer.from(arrayBuf).toString('utf-8');
  const durationMs = Date.now() - startTime;
  const contentLength = arrayBuf.byteLength;
  const lastModified = response.headers.get('last-modified');

  return {
    rawText,
    httpStatus: response.status,
    contentLength,
    lastModified,
    sourceUrl: url,
    durationMs,
  };
}

/**
 * Parsea el texto CSV de Osinergmin respetando campos con punto y coma y espacios de padding
 */
export function parseFuelCsv(csvContent: string): RawOsinergminCsvRecord[] {
  const lines = csvContent.split('\n');
  if (lines.length === 0) return [];

  const records: RawOsinergminCsvRecord[] = [];
  let headerCols: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Detectar encabezado
    if (rawLine.startsWith('ID') || rawLine.includes('REGISTRO') || rawLine.includes('ACTIVIDAD')) {
      headerCols = rawLine.split(';').map((col) => col.trim().toUpperCase());
      continue;
    }

    const cols = rawLine.split(';').map((col) => col.trim());
    if (cols.length < 5) continue;

    // Estructura de CL-Registro-precios-DMA-V-CCA-CCE.csv:
    // 0: ID3
    // 1: ACTIVIDAD
    // 2: REGISTRO DE HIDROCARBUROS
    // 3: RUC
    // 4: RAZÓN SOCIAL
    // 5: DEPARTAMENTO
    // 6: PROVINCIA
    // 7: DISTRITO
    // 8: DIRECCIÓN
    // 9: FECHA DE REGISTRO
    // 10: PRODUCTO
    // 11: PRECIO DE VENTA (SOLES)
    // 12: UNIDAD
    const actividad = cols[1] || '';
    const registroHidrocarburos = cols[2] || '';
    const ruc = cols[3] || '';
    const razonSocial = cols[4] || '';
    const departamento = cols[5] || '';
    const provincia = cols[6] || '';
    const distrito = cols[7] || '';
    const direccion = cols[8] || '';

    // Manejar variaciones entre archivos (DMA vs DMIN vs GLP)
    let fechaRegistro = '';
    let producto = '';
    let precioVenta: number | null = null;
    let precioMin: number | null = null;
    let precioMax: number | null = null;
    let unidad = '';

    if (cols.length >= 13) {
      fechaRegistro = cols[9] || '';
      producto = cols[10] || '';
      const rawPrice = cols[11]?.replace(',', '.');
      precioVenta = rawPrice ? parseFloat(rawPrice) : null;
      unidad = cols[12] || '';
    } else if (cols.length >= 10) {
      fechaRegistro = cols[9] || '';
      producto = cols[10] || '';
    }

    // Para formato DMIN que tiene PRECIO_MIN y PRECIO_MAX
    if (cols.length >= 16) {
      fechaRegistro = cols[11] || '';
      producto = cols[12] || '';
      precioMin = cols[13]?.replace(',', '.') ? parseFloat(cols[13].replace(',', '.')) : null;
      precioMax = cols[14]?.replace(',', '.') ? parseFloat(cols[14].replace(',', '.')) : null;
      unidad = cols[15] || '';
    }

    records.push({
      id: cols[0],
      actividad,
      registroHidrocarburos,
      ruc,
      razonSocial,
      departamento,
      provincia,
      distrito,
      direccion,
      fechaRegistro,
      producto,
      precioVenta: isNaN(precioVenta as number) ? null : precioVenta,
      precioMin: isNaN(precioMin as number) ? null : precioMin,
      precioMax: isNaN(precioMax as number) ? null : precioMax,
      unidad,
      rawLine,
    });
  }

  return records;
}

/**
 * Filtra registros pertenecientes a Huánuco y distritos de interés (Huánuco, Amarilis, Pillco Marca)
 */
export function filterHuanuco(
  records: RawOsinergminCsvRecord[],
  options?: {
    districts?: string[]; // Ej: ['HUANUCO', 'AMARILIS', 'PILLCO MARCA']
    onlyTargetDistricts?: boolean;
  }
): RawOsinergminCsvRecord[] {
  const targetDistricts = options?.districts || ['HUANUCO', 'AMARILIS', 'PILLCO MARCA'];
  const onlyTarget = options?.onlyTargetDistricts ?? true;

  return records.filter((rec) => {
    const dept = (rec.departamento || '').toUpperCase();
    const isHuanucoDept = dept.includes('HUANUCO') || dept.includes('HUÁNUCO');
    if (!isHuanucoDept) return false;

    if (!onlyTarget) return true;

    const dist = (rec.distrito || '').toUpperCase();
    return targetDistricts.some((td) => dist.includes(td));
  });
}

/**
 * Normaliza los productos de Osinergmin y agrupa por estación
 */
export function normalizeFuelPrices(records: RawOsinergminCsvRecord[]): NormalizedFuelStation[] {
  const stationsMap = new Map<string, NormalizedFuelStation>();

  for (const rec of records) {
    const key = rec.registroHidrocarburos || `${rec.razonSocial}-${rec.direccion}`;
    if (!key) continue;

    let station = stationsMap.get(key);
    if (!station) {
      station = {
        stationId: (rec.registroHidrocarburos || rec.ruc || key).replace(/\s+/g, '_'),
        name: rec.razonSocial || 'Estación de Servicio Osinergmin',
        ruc: rec.ruc || '',
        registroHidrocarburos: rec.registroHidrocarburos || '',
        department: rec.departamento || 'HUANUCO',
        province: rec.provincia || 'HUANUCO',
        district: rec.distrito || 'HUANUCO',
        address: rec.direccion || '',
        prices: {
          gasoholRegular: null,
          gasoholPremium: null,
          diesel: null,
          glp: null,
        },
        lastReportedDate: rec.fechaRegistro || new Date().toISOString(),
        source: 'Osinergmin - Reporte Diario Oficial CSV',
        verificationStatus: 'REPORTADO',
      };
      stationsMap.set(key, station);
    }

    // Actualizar fecha si este registro es más reciente
    if (rec.fechaRegistro && rec.fechaRegistro > station.lastReportedDate) {
      station.lastReportedDate = rec.fechaRegistro;
    }

    // Clasificar producto oficial y precio
    const prodUpper = (rec.producto || '').toUpperCase();
    const price = rec.precioVenta ?? rec.precioMin ?? null;

    if (price !== null && price > 0) {
      if (prodUpper.includes('REGULAR') || prodUpper.includes('GASOHOL 90') || prodUpper.includes('G-REGULAR')) {
        station.prices.gasoholRegular = price;
      } else if (
        prodUpper.includes('PREMIUM') ||
        prodUpper.includes('GASOHOL 95') ||
        prodUpper.includes('GASOHOL 97') ||
        prodUpper.includes('G-PREMIUM')
      ) {
        station.prices.gasoholPremium = price;
      } else if (prodUpper.includes('DIESEL') || prodUpper.includes('D-50') || prodUpper.includes('B5')) {
        station.prices.diesel = price;
      } else if (prodUpper.includes('GLP') && (prodUpper.includes('G') || prodUpper.includes('VEHICULAR'))) {
        station.prices.glp = price;
      }
    }
  }

  return Array.from(stationsMap.values());
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (['de', 'del', 'la', 'los', 'las', 'en', 'y', 'e'].includes(word)) return word;
      if (['e.i.r.l.', 'eirl', 's.a.c.', 'sac', 's.r.l.', 'srl'].includes(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function cleanFriendlyName(rawName: string): string {
  let cleaned = rawName
    .replace(/EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA/gi, 'E.I.R.L.')
    .replace(/SOCIEDAD ANONIMA CERRADA/gi, 'S.A.C.')
    .replace(/SOCIEDAD COMERCIAL DE RESPONSABILIDAD LIMITADA/gi, 'S.R.L.')
    .trim();

  // Si no tiene prefijo empresarial tipo Grifo o Estación, agregarlo de forma amigable
  const hasPrefix = /^(GRIFO|ESTACION|ESTACIÓN|SERVICENTRO|GASOCENTRO)/i.test(cleaned);
  if (!hasPrefix) {
    const isCompany = /E\.?I\.?R\.?L|S\.?A\.?C|S\.?R\.?L/i.test(cleaned);
    if (isCompany) {
      cleaned = `Estación ${cleaned}`;
    } else {
      cleaned = `Estación de Servicios ${toTitleCase(cleaned)}`;
    }
  } else {
    cleaned = toTitleCase(cleaned);
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

function detectFuelBrand(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('PRIMAX')) return 'Primax';
  if (upper.includes('REPSOL')) return 'Repsol';
  if (upper.includes('PETROPERU') || upper.includes('PETROPERÚ')) return 'Petroperú';
  if (upper.includes('PECSA')) return 'Pecsa';
  if (upper.includes('TERPEL')) return 'Terpel';
  return 'Independiente';
}

function normalizeHuanucoDistrict(districtRaw: string): string {
  const upper = districtRaw.toUpperCase();
  if (upper.includes('AMARILIS')) return 'Amarilis';
  if (upper.includes('PILLCO') || upper.includes('MARCA')) return 'Pillco Marca';
  return 'Huánuco Cercado';
}

function calculatePriceTrend(
  newPrice: number | null,
  prevPrice: number | null,
  prevTrend?: PriceTrend
): PriceTrend {
  if (newPrice === null || prevPrice === null) return prevTrend || 'stable';
  const diff = newPrice - prevPrice;
  if (diff > 0.05) return 'up';
  if (diff < -0.05) return 'down';
  return 'stable';
}

/**
 * Convierte una estación normalizada del CSV a la interfaz FuelStation de la aplicación
 */
export function convertToFuelStation(
  norm: NormalizedFuelStation,
  existing?: FuelStation
): FuelStation {
  const brand = detectFuelBrand(norm.name);
  const friendlyName = cleanFriendlyName(norm.name);
  const district = normalizeHuanucoDistrict(norm.district);
  const address = toTitleCase(norm.address || 'Huánuco');

  // Limpieza de ID
  const rawIdSource = norm.registroHidrocarburos || norm.ruc || norm.name;
  const cleanId = `fuel-${rawIdSource.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

  const gas90 = norm.prices.gasoholRegular ?? existing?.gas90 ?? null;
  const gas95 = norm.prices.gasoholPremium ?? existing?.gas95 ?? null;
  const diesel = norm.prices.diesel ?? existing?.diesel ?? null;
  const glp = norm.prices.glp ?? existing?.glp ?? null;

  return {
    id: existing?.id || cleanId,
    name: friendlyName,
    brand,
    address,
    district,
    googleMapsQuery: `${friendlyName} ${address} ${district} Huánuco`,
    gas90,
    gas90Trend: calculatePriceTrend(gas90, existing?.gas90 ?? null, existing?.gas90Trend),
    gas95,
    gas95Trend: calculatePriceTrend(gas95, existing?.gas95 ?? null, existing?.gas95Trend),
    diesel,
    dieselTrend: calculatePriceTrend(diesel, existing?.diesel ?? null, existing?.dieselTrend),
    glp,
    glpTrend: calculatePriceTrend(glp, existing?.glp ?? null, existing?.glpTrend),
    updatedAt: norm.lastReportedDate || new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    trustLevel: 'verified',
    verificationStatus: 'VERIFICADO',
    source: 'Osinergmin SCOP (Reporte Oficial Diario)',
    sourceUrl: OSINERGMIN_CSV_RESOURCES.STATIONS_LIQUIDS.url,
    isAvailable: gas90 !== null || diesel !== null || glp !== null,
    ruc: norm.ruc,
    registroHidrocarburos: norm.registroHidrocarburos,
    rawRazonSocial: norm.name,
    lastReportedDate: norm.lastReportedDate,
  };
}

/**
 * Descarga eficiente por rango HTTP desde Osinergmin SCOP y genera FuelStations para Huánuco
 */
export async function fetchAndNormalizeOsinergminFuels(options?: {
  rangeBytesLiquids?: number;
  rangeBytesGLP?: number;
  existingStations?: FuelStation[];
}): Promise<{
  stations: FuelStation[];
  meta: {
    downloadDurationMs: number;
    bytesLiquids: number;
    bytesGLP: number;
    rawLiquidsCount: number;
    rawHuanucoCount: number;
    stationsCount: number;
  };
}> {
  const startTime = Date.now();
  const rangeLiquids = options?.rangeBytesLiquids || 8 * 1024 * 1024; // 8 MB suficientes para los últimos días
  const rangeGLP = options?.rangeBytesGLP || 2 * 1024 * 1024; // 2 MB para GLP reciente

  // 1. Descargar líquidos por HTTP Range
  const liquidsDownload = await downloadOfficialFuelCsv({
    resource: 'STATIONS_LIQUIDS',
    rangeBytes: rangeLiquids,
  });

  const parsedLiquids = parseFuelCsv(liquidsDownload.rawText);
  const huanucoLiquids = filterHuanuco(parsedLiquids, {
    districts: ['HUANUCO', 'AMARILIS', 'PILLCO MARCA'],
  });

  // 2. Intentar traer GLP en paralelo si es posible
  let huanucoGlp: RawOsinergminCsvRecord[] = [];
  let bytesGLP = 0;
  try {
    const glpDownload = await downloadOfficialFuelCsv({
      resource: 'GLP_PRICES',
      rangeBytes: rangeGLP,
    });
    bytesGLP = glpDownload.contentLength;
    const parsedGLP = parseFuelCsv(glpDownload.rawText);
    huanucoGlp = filterHuanuco(parsedGLP, {
      districts: ['HUANUCO', 'AMARILIS', 'PILLCO MARCA'],
    });
  } catch (glpErr) {
    console.warn('[OsinergminCsvService] Aviso al obtener GLP:', glpErr);
  }

  // Combinar registros líquidos y GLP para Huánuco
  const allHuanucoRecords = [...huanucoLiquids, ...huanucoGlp];
  const normalized = normalizeFuelPrices(allHuanucoRecords);

  // Mapa de existentes para calcular tendencias y mantener IDs estables
  const existingMap = new Map<string, FuelStation>();
  if (options?.existingStations) {
    options.existingStations.forEach((st) => {
      existingMap.set(st.id, st);
      if (st.registroHidrocarburos) {
        existingMap.set(st.registroHidrocarburos, st);
      }
      if (st.ruc) {
        existingMap.set(st.ruc, st);
      }
    });
  }

  const finalStations: FuelStation[] = normalized.map((norm) => {
    const existing =
      existingMap.get(norm.registroHidrocarburos) ||
      existingMap.get(norm.ruc) ||
      existingMap.get(`fuel-${(norm.registroHidrocarburos || norm.ruc || norm.name).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`);
    return convertToFuelStation(norm, existing);
  });

  return {
    stations: finalStations,
    meta: {
      downloadDurationMs: Date.now() - startTime,
      bytesLiquids: liquidsDownload.contentLength,
      bytesGLP,
      rawLiquidsCount: parsedLiquids.length,
      rawHuanucoCount: allHuanucoRecords.length,
      stationsCount: finalStations.length,
    },
  };
}

