import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script de ingestión directa ejecutado por GitHub Actions.
 * Conecta con Osinergmin SCOP oficial, descarga el reporte diario,
 * filtra Huánuco, Amarilis y Pillco Marca, y persiste en Firestore
 * usando Firebase Admin SDK autenticado con FIREBASE_SERVICE_ACCOUNT.
 */
async function runIngestion(): Promise<void> {
  console.log('===========================================================');
  console.log('  HUÁNUCO PRECIOS HOY - INGESTIÓN DIRECTA GITHUB ACTIONS    ');
  console.log('  Conexión directa: Osinergmin SCOP -> Firestore          ');
  console.log('===========================================================');

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountRaw || serviceAccountRaw.trim() === '') {
    console.error('ERROR CRÍTICO: El secreto FIREBASE_SERVICE_ACCOUNT no está configurado en GitHub Secrets.');
    console.error('Para escribir directamente en Firestore desde GitHub Actions se requiere la clave de Service Account.');
    process.exit(1);
  }

  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountRaw.trim());
  } catch (err: any) {
    console.error('ERROR CRÍTICO: FIREBASE_SERVICE_ACCOUNT no contiene un JSON válido:', err.message);
    process.exit(1);
  }

  // 1. Inicializar Firebase Admin SDK
  console.log('Inicializando Firebase Admin SDK con Service Account...');
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });

  const db = getFirestore();
  console.log('Firebase Admin SDK conectado al proyecto:', serviceAccount.projectId);

  // 2. Descargar reporte oficial diario de Osinergmin SCOP
  const csvUrl = 'https://www.osinergmin.gob.pe/seccion/centro_documental/hidrocarburos/SCOP/SCOP-DOCS/Reporte-Diario/CL-Registro-precios-DMA-V-CCA-CCE.csv';
  console.log('Descargando reporte oficial diario de Osinergmin SCOP (bloque de 8 MB)...');

  const response = await fetch(csvUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Range': 'bytes=-8388608',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  console.log('Osinergmin HTTP Status:', response.status);
  if (response.status !== 200 && response.status !== 206) {
    throw new Error(`Error al conectar con Osinergmin SCOP. Código HTTP: ${response.status}`);
  }

  const rawText = await response.text();
  console.log('Bytes recibidos de Osinergmin:', rawText.length);

  const lines = rawText.split('\n');
  console.log('Total registros escaneados en bloque:', lines.length);

  // 3. Filtrar estrictamente Huánuco, Amarilis y Pillco Marca
  const huanucoLines = lines.filter((line) => {
    const upper = line.toUpperCase();
    const isHuanuco = upper.includes('HUANUCO') || upper.includes('HUÁNUCO');
    const isTargetDistrict =
      upper.includes('AMARILIS') ||
      upper.includes('PILLCO') ||
      upper.includes('MARCA') ||
      upper.includes(';HUANUCO;') ||
      upper.includes(';HUÁNUCO;');
    return isHuanuco && isTargetDistrict;
  });

  console.log('Registros de precios encontrados para Huánuco:', huanucoLines.length);

  if (huanucoLines.length === 0) {
    console.warn('Advertencia: No se encontraron líneas para Huánuco en el bloque. Se conservan los datos previos sin alterar.');
    return;
  }

  // 4. Normalizar estaciones agrupando por Registro de Hidrocarburos oficial
  const stationsMap = new Map<string, any>();

  for (const line of huanucoLines) {
    const cols = line.split(';').map((c) => c.trim());
    if (cols.length < 10) continue;

    const registroHidrocarburos = cols[2] || cols[3];
    if (!registroHidrocarburos) continue;

    const ruc = cols[3] || '';
    const razonSocial = cols[4] || '';
    const distritoRaw = cols[7] || '';
    const direccion = cols[8] || '';
    const fechaRegistro = cols[9] || '';
    const producto = (cols[10] || '').toUpperCase();
    const precioRaw = cols[11]?.replace(',', '.');
    const precioNum = precioRaw ? parseFloat(precioRaw) : null;

    // ID determinista e idempotente para evitar duplicados en Firestore
    const id = `fuel-${registroHidrocarburos.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

    // Normalizar distrito
    let district = 'Huánuco Cercado';
    const distUpper = distritoRaw.toUpperCase();
    if (distUpper.includes('AMARILIS')) district = 'Amarilis';
    else if (distUpper.includes('PILLCO') || distUpper.includes('MARCA')) district = 'Pillco Marca';

    // Normalizar marca
    let brand = 'Independiente';
    const nameUpper = razonSocial.toUpperCase();
    if (nameUpper.includes('PRIMAX')) brand = 'Primax';
    else if (nameUpper.includes('REPSOL')) brand = 'Repsol';
    else if (nameUpper.includes('PETROPERU') || nameUpper.includes('PETROPERÚ')) brand = 'Petroperú';
    else if (nameUpper.includes('PECSA')) brand = 'Pecsa';
    else if (nameUpper.includes('TERPEL')) brand = 'Terpel';

    if (!stationsMap.has(id)) {
      stationsMap.set(id, {
        id,
        name: razonSocial,
        brand,
        address: direccion,
        district,
        googleMapsQuery: `${razonSocial} ${direccion} ${district} Huánuco`,
        gas90: null,
        gas90Trend: 'stable',
        gas95: null,
        gas95Trend: 'stable',
        diesel: null,
        dieselTrend: 'stable',
        glp: null,
        glpTrend: 'stable',
        verificationStatus: 'VERIFICADO',
        trustLevel: 'verified',
        source: 'Osinergmin SCOP (Reporte Oficial Diario)',
        sourceUrl: csvUrl,
        ruc,
        registroHidrocarburos,
        updatedAt: fechaRegistro, // Conservar la fecha y hora oficial reportada por Osinergmin
        lastReportedDate: fechaRegistro,
        createdAt: fechaRegistro,
        isAvailable: true,
      });
    }

    const station = stationsMap.get(id);

    // Asignar precio al combustible
    if (precioNum !== null && !isNaN(precioNum)) {
      if (producto.includes('DIESEL') || producto.includes('DB5') || producto.includes('D-5')) {
        station.diesel = precioNum;
      } else if (producto.includes('GASOHOL REGULAR') || producto.includes('GAS 90') || producto.includes('G-90') || producto.includes('GASOHOL 90')) {
        station.gas90 = precioNum;
      } else if (producto.includes('GASOHOL PREMIUM') || producto.includes('GAS 95') || producto.includes('GAS 97') || producto.includes('GASOHOL 95')) {
        station.gas95 = precioNum;
      } else if (producto.includes('GLP') || producto.includes('GAS LICUADO')) {
        station.glp = precioNum;
      }
    }

    if (fechaRegistro && (!station.updatedAt || fechaRegistro > station.updatedAt)) {
      station.updatedAt = fechaRegistro;
      station.lastReportedDate = fechaRegistro;
    }
  }

  const csvStations = Array.from(stationsMap.values());
  console.log(`Estaciones físicas identificadas en bloque CSV: ${csvStations.length}`);

  // 5. MERGE por id con data/fuels-huanuco.json y Firestore (fuelStations) para no perder estaciones ni precios previos
  const outputDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputFile = path.join(outputDir, 'fuels-huanuco.json');

  const mergedMap = new Map<string, any>();

  // 5a. Cargar estaciones existentes en data/fuels-huanuco.json
  if (fs.existsSync(outputFile)) {
    try {
      const existingFile = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      if (Array.isArray(existingFile?.stations)) {
        for (const st of existingFile.stations) {
          if (st && st.id) {
            mergedMap.set(st.id, {
              ...st,
              lastReportedDate: st.lastReportedDate || st.updatedAt,
              updatedAt: st.updatedAt || st.lastReportedDate,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Aviso al leer data/fuels-huanuco.json existente:', e);
    }
  }

  // 5b. Cargar estaciones existentes en Firestore (fuelStations)
  try {
    const existingSnap = await db.collection('fuelStations').get();
    existingSnap.forEach((docSnap) => {
      const d = docSnap.data();
      const id = docSnap.id || d.id;
      if (!id) return;
      const prev = mergedMap.get(id);
      const reportDate = d.lastReportedDate || d.updatedAt || prev?.lastReportedDate || prev?.updatedAt;
      mergedMap.set(id, {
        ...prev,
        ...d,
        id,
        gas90: d.gas90 !== null && d.gas90 !== undefined ? d.gas90 : (prev?.gas90 ?? null),
        gas95: d.gas95 !== null && d.gas95 !== undefined ? d.gas95 : (prev?.gas95 ?? null),
        diesel: d.diesel !== null && d.diesel !== undefined ? d.diesel : (prev?.diesel ?? null),
        glp: d.glp !== null && d.glp !== undefined ? d.glp : (prev?.glp ?? null),
        updatedAt: reportDate,
        lastReportedDate: reportDate,
        createdAt: prev?.createdAt || d.createdAt || reportDate,
        verificationStatus: d.verificationStatus || prev?.verificationStatus || 'VERIFICADO',
        trustLevel: d.trustLevel || prev?.trustLevel || 'verified',
        source: d.source || prev?.source || 'Osinergmin SCOP (Reporte Oficial Diario)',
        sourceUrl: d.sourceUrl || prev?.sourceUrl || csvUrl,
      });
    });
  } catch (e) {
    console.warn('Aviso al leer colección fuelStations de Firestore previo al merge:', e);
  }

  // 5c. Fusionar las nuevas estaciones del CSV preservando precios válidos y fechas reales
  for (const incoming of csvStations) {
    const prev = mergedMap.get(incoming.id);
    if (!prev) {
      mergedMap.set(incoming.id, incoming);
    } else {
      const gas90 = incoming.gas90 !== null && incoming.gas90 !== undefined ? incoming.gas90 : (prev.gas90 ?? null);
      const gas95 = incoming.gas95 !== null && incoming.gas95 !== undefined ? incoming.gas95 : (prev.gas95 ?? null);
      const diesel = incoming.diesel !== null && incoming.diesel !== undefined ? incoming.diesel : (prev.diesel ?? null);
      const glp = incoming.glp !== null && incoming.glp !== undefined ? incoming.glp : (prev.glp ?? null);
      const newerDate =
        incoming.lastReportedDate && (!prev.lastReportedDate || incoming.lastReportedDate >= prev.lastReportedDate)
          ? incoming.lastReportedDate
          : (prev.lastReportedDate || prev.updatedAt);

      mergedMap.set(incoming.id, {
        ...prev,
        ...incoming,
        id: prev.id,
        name: prev.name || incoming.name,
        brand: incoming.brand || prev.brand,
        address: prev.address || incoming.address,
        district: incoming.district || prev.district,
        gas90,
        gas95,
        diesel,
        glp,
        updatedAt: newerDate,
        lastReportedDate: newerDate,
        createdAt: prev.createdAt || incoming.createdAt || newerDate,
        verificationStatus: incoming.verificationStatus || prev.verificationStatus || 'VERIFICADO',
        trustLevel: incoming.trustLevel || prev.trustLevel || 'verified',
        source: incoming.source || prev.source || 'Osinergmin SCOP (Reporte Oficial Diario)',
        sourceUrl: incoming.sourceUrl || prev.sourceUrl || csvUrl,
        isAvailable: gas90 !== null || gas95 !== null || diesel !== null || glp !== null,
      });
    }
  }

  const realStations = Array.from(mergedMap.values());
  console.log(`Total estaciones sincronizadas tras MERGE por id: ${realStations.length}`);

  const payload = {
    status: 'SUCCESS',
    source: 'Osinergmin SCOP Oficial',
    lastSync: new Date().toISOString(),
    totalStations: realStations.length,
    districts: ['Huánuco Cercado', 'Amarilis', 'Pillco Marca'],
    stations: realStations,
  };
  fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2), 'utf8');
  console.log('Archivo de respaldo data/fuels-huanuco.json generado con éxito.');

  // 6. Escribir directamente en Firestore (fuelStations) usando batch
  console.log(`Escribiendo ${realStations.length} estaciones en Firestore (colección fuelStations)...`);
  const batch = db.batch();
  const colRef = db.collection('fuelStations');

  for (const st of realStations) {
    const docRef = colRef.doc(st.id);
    batch.set(docRef, st, { merge: true });
  }

  // Auditoría en la colección updates
  const auditRef = db.collection('updates').doc();
  batch.set(auditRef, {
    timestamp: new Date().toISOString(),
    service: 'GitHub Actions Direct Ingestion (Firebase Admin SDK)',
    source: 'Osinergmin SCOP Oficial',
    stationsUpdated: realStations.length,
    status: 'SUCCESS',
  });

  await batch.commit();
  console.log(`¡ÉXITO TOTAL! ${realStations.length} documentos actualizados en Firestore sin duplicados.`);
}

runIngestion().catch((err) => {
  console.error('Fallo en el pipeline de ingestión:', err.message || err);
  process.exit(1);
});
