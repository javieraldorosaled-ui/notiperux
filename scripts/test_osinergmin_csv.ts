import fs from 'fs';
import readline from 'readline';

const DMIN_URL = 'https://www.osinergmin.gob.pe/seccion/centro_documental/hidrocarburos/SCOP/SCOP-DOCS/Reporte-Diario/CL-Registro-precios-DMIN.csv';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testDownload() {
  console.log('--- Iniciando prueba de descarga de DMIN.csv ---');
  const startTime = Date.now();
  const resp = await fetch(DMIN_URL, {
    headers: { 'User-Agent': USER_AGENT }
  });

  console.log('HTTP Status:', resp.status);
  console.log('Content-Type:', resp.headers.get('content-type'));
  console.log('Content-Length:', resp.headers.get('content-length'));
  console.log('Last-Modified:', resp.headers.get('last-modified'));

  if (!resp.ok || !resp.body) {
    console.error('Error al descargar archivo:', resp.statusText);
    return;
  }

  const tmpPath = '/tmp/osinergmin_dmin_test.csv';
  const fileStream = fs.createWriteStream(tmpPath);
  
  // @ts-ignore
  const nodeStream = (await import('stream')).Readable.fromWeb(resp.body);
  
  await new Promise<void>((resolve, reject) => {
    nodeStream.pipe(fileStream);
    fileStream.on('finish', () => resolve());
    fileStream.on('error', (err) => reject(err));
  });

  const durationMs = Date.now() - startTime;
  const stats = fs.statSync(tmpPath);
  console.log(`Descarga completa en ${durationMs}ms. Tamaño en disco: ${stats.size} bytes`);

  // Analizar archivo línea por línea
  const rl = readline.createInterface({
    input: fs.createReadStream(tmpPath),
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  let header: string[] = [];
  const huanucoRecords: any[] = [];
  let maxDate = '';
  let minDate = '9999';
  const productsFound = new Set<string>();
  const districtsFound = new Set<string>();
  const establishmentsFound = new Set<string>();

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) {
      header = line.split(';').map(s => s.trim());
      continue;
    }
    if (!line.trim()) continue;

    const cols = line.split(';').map(s => s.trim());
    // ID1;ACTIVIDAD;REGISTRO_DE_HIDROCARBUROS;RUC;RAZÓN_SOCIAL;DEPARTAMENTO;PROVINCIA;DISTRITO;DIRECCIÓN;DEPARTAMENTO_REPARTO;PROVINCIA_REPARTO;FECHA_DE_REGISTRO;PRODUCTO;PRECIO_MIN_SOLES;PRECIO_MAX_SOLES;UNIDAD
    const actividad = cols[1];
    const regHidro = cols[2];
    const ruc = cols[3];
    const razonSocial = cols[4];
    const depto = cols[5];
    const prov = cols[6];
    const dist = cols[7];
    const direccion = cols[8];
    const fechaReg = cols[11];
    const producto = cols[12];
    const precioMin = cols[13];
    const precioMax = cols[14];
    const unidad = cols[15];

    if (depto && (depto.toUpperCase().includes('HUANUCO') || depto.toUpperCase().includes('HUÁNUCO'))) {
      huanucoRecords.push({
        actividad,
        regHidro,
        ruc,
        razonSocial,
        depto,
        prov,
        dist,
        direccion,
        fechaReg,
        producto,
        precioMin,
        precioMax,
        unidad
      });

      if (fechaReg) {
        if (fechaReg > maxDate) maxDate = fechaReg;
        if (fechaReg < minDate) minDate = fechaReg;
      }
      if (producto) productsFound.add(producto);
      if (dist) districtsFound.add(dist);
      if (razonSocial) establishmentsFound.add(razonSocial);
    }
  }

  console.log('\n--- RESULTADOS DEL ANÁLISIS ---');
  console.log('Total registros escaneados:', lineCount - 1);
  console.log('Columnas encontradas (', header.length, '):', header);
  console.log('Total registros de HUÁNUCO:', huanucoRecords.length);
  console.log('Distritos encontrados en Huánuco:', Array.from(districtsFound));
  console.log('Establecimientos en Huánuco:', Array.from(establishmentsFound).slice(0, 10));
  console.log('Productos encontrados:', Array.from(productsFound));
  console.log('Rango de fechas:', { minDate, maxDate });
  console.log('\nMuestra de los primeros 3 registros de Huánuco:');
  console.log(JSON.stringify(huanucoRecords.slice(0, 3), null, 2));
}

testDownload().catch(console.error);
