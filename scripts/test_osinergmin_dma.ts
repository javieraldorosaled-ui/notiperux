import fs from 'fs';
import readline from 'readline';

const DMA_URL = 'https://www.osinergmin.gob.pe/seccion/centro_documental/hidrocarburos/SCOP/SCOP-DOCS/Reporte-Diario/CL-Registro-precios-DMA-V-CCA-CCE.csv';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testDmaStream() {
  console.log('--- Conectando a stream de CL-Registro-precios-DMA-V-CCA-CCE.csv ---');
  const startTime = Date.now();
  
  const resp = await fetch(DMA_URL, {
    headers: { 'User-Agent': USER_AGENT }
  });

  console.log('HTTP Status:', resp.status);
  console.log('Content-Type:', resp.headers.get('content-type'));
  console.log('Content-Length:', resp.headers.get('content-length'));
  console.log('Last-Modified:', resp.headers.get('last-modified'));

  if (!resp.ok || !resp.body) {
    console.error('Error al abrir stream:', resp.statusText);
    return;
  }

  // @ts-ignore
  const nodeStream = (await import('stream')).Readable.fromWeb(resp.body);
  const rl = readline.createInterface({
    input: nodeStream,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  let header: string[] = [];
  const huanucoRecords: any[] = [];
  const districtsFound = new Map<string, number>();
  const stationsFound = new Map<string, string>();
  const productsFound = new Set<string>();
  let maxDate = '';
  let minDate = '9999';

  const outJsonPath = '/tmp/huanuco_dma_stations.json';
  const outCsvPath = '/tmp/huanuco_dma_stations.csv';
  const csvOutStream = fs.createWriteStream(outCsvPath);

  // Leer primeras 100,000 líneas o hasta que pasemos 2 minutos de streaming
  const MAX_LINES = 150000;

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) {
      header = line.split(';').map(s => s.trim());
      csvOutStream.write(line + '\n');
      continue;
    }
    if (!line.trim()) continue;

    // ID3;ACTIVIDAD;REGISTRO DE HIDROCARBUROS;RUC;RAZÓN SOCIAL;DEPARTAMENTO;PROVINCIA;DISTRITO;DIRECCIÓN;FECHA DE REGISTRO;PRODUCTO;PRECIO DE VENTA (SOLES);UNIDAD
    const cols = line.split(';').map(s => s.trim());
    const actividad = cols[1];
    const regHidro = cols[2];
    const ruc = cols[3];
    const razonSocial = cols[4];
    const depto = cols[5];
    const prov = cols[6];
    const dist = cols[7];
    const direccion = cols[8];
    const fechaReg = cols[9];
    const producto = cols[10];
    const precioVenta = cols[11];
    const unidad = cols[12];

    if (depto && (depto.toUpperCase().includes('HUANUCO') || depto.toUpperCase().includes('HUÁNUCO'))) {
      csvOutStream.write(line + '\n');
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
        precioVenta,
        unidad
      });

      districtsFound.set(dist, (districtsFound.get(dist) || 0) + 1);
      stationsFound.set(regHidro || razonSocial, `${razonSocial} (${dist}) - ${direccion}`);
      if (producto) productsFound.add(producto);

      if (fechaReg) {
        if (fechaReg > maxDate) maxDate = fechaReg;
        if (fechaReg < minDate) minDate = fechaReg;
      }
    }

    if (lineCount % 20000 === 0) {
      console.log(`Progreso: ${lineCount} líneas leídas... Huánuco encontrados: ${huanucoRecords.length}`);
    }

    if (lineCount >= MAX_LINES) {
      console.log(`Límite de muestra de ${MAX_LINES} líneas alcanzado.`);
      nodeStream.destroy();
      break;
    }
  }

  csvOutStream.end();
  fs.writeFileSync(outJsonPath, JSON.stringify(huanucoRecords, null, 2));

  console.log('\n--- RESULTADOS ESTABLECIMIENTOS (GRIFOS) HUÁNUCO ---');
  console.log('Líneas leídas:', lineCount);
  console.log('Columnas encontradas (', header.length, '):', header);
  console.log('Total registros de Huánuco:', huanucoRecords.length);
  console.log('Estaciones/Grifos únicos encontrados:', stationsFound.size);
  console.log('Distritos encontrados:', Object.fromEntries(districtsFound));
  console.log('Productos encontrados:', Array.from(productsFound));
  console.log('Rango de fechas de registro:', { minDate, maxDate });
  console.log('\nMuestra de estaciones en Huánuco:');
  const sampleStations = Array.from(stationsFound.entries()).slice(0, 8);
  console.log(sampleStations);
  console.log('\nMuestra de primeros 3 registros con precios:');
  console.log(huanucoRecords.slice(0, 3));
}

testDmaStream().catch(console.error);
