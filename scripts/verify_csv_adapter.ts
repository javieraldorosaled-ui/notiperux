import {
  downloadOfficialFuelCsv,
  parseFuelCsv,
  filterHuanuco,
  normalizeFuelPrices,
  OSINERGMIN_CSV_RESOURCES,
} from '../src/services/osinergminCsvService';

async function main() {
  console.log('=====================================================');
  console.log('PRUEBA DE VERIFICACIÓN: ADAPTADOR CSV OFICIAL OSINERGMIN');
  console.log('=====================================================\n');

  console.log('1. Probando recurso principal: Establecimientos de Venta al Público (Grifos)...');
  console.log('URL:', OSINERGMIN_CSV_RESOURCES.STATIONS_LIQUIDS.url);

  // Traer los últimos 8 MB del archivo donde se encuentran los registros más recientes (septiembre 2026)
  const downloadResult = await downloadOfficialFuelCsv({
    resource: 'STATIONS_LIQUIDS',
    rangeBytes: 8 * 1024 * 1024, // 8 MB
  });

  console.log('-> Descarga completada:');
  console.log('   Status HTTP:', downloadResult.httpStatus);
  console.log('   Tamaño recibido:', (downloadResult.contentLength / 1024 / 1024).toFixed(2), 'MB');
  console.log('   Duración:', downloadResult.durationMs, 'ms');
  console.log('   Last-Modified:', downloadResult.lastModified);

  console.log('\n2. Parseando registros CSV...');
  const allParsed = parseFuelCsv(downloadResult.rawText);
  console.log('-> Total registros parseados en el fragmento:', allParsed.length);

  console.log('\n3. Filtrando para departamento Huánuco y distritos Huánuco, Amarilis y Pillco Marca...');
  const huanucoRecords = filterHuanuco(allParsed, {
    districts: ['HUANUCO', 'AMARILIS', 'PILLCO MARCA'],
  });
  console.log('-> Total registros encontrados para Huánuco (zona metropolitana):', huanucoRecords.length);

  console.log('\n4. Normalizando estaciones de combustible...');
  const normalizedStations = normalizeFuelPrices(huanucoRecords);
  console.log('-> Total estaciones normalizadas:', normalizedStations.length);

  console.log('\n5. Muestra de estaciones reales encontradas:');
  normalizedStations.slice(0, 5).forEach((st, idx) => {
    console.log(`\n--- [Estación ${idx + 1}] ---`);
    console.log(`Razón Social: ${st.name}`);
    console.log(`RUC: ${st.ruc}`);
    console.log(`Registro Hidrocarburos: ${st.registroHidrocarburos}`);
    console.log(`Distrito: ${st.district}`);
    console.log(`Dirección: ${st.address}`);
    console.log(`Fecha de reporte: ${st.lastReportedDate}`);
    console.log(`Precios reportados:`, st.prices);
  });

  console.log('\n=====================================================');
  console.log('PRUEBA FINALIZADA EXITOSAMENTE');
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('Error en prueba del adaptador:', err);
  process.exit(1);
});
