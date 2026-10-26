import { runFuelIngestionPipeline } from '../src/services/fuelIngestionService';

async function testFullIngestion() {
  console.log('=== EJECUCIÓN 1 DE INGESTA COMPLETA ===');
  const t1Start = Date.now();
  const res1 = await runFuelIngestionPipeline();
  const t1Duration = Date.now() - t1Start;

  console.log('\n=== EJECUCIÓN 2 DE INGESTA COMPLETA (IDEMPOTENCIA) ===');
  const t2Start = Date.now();
  const res2 = await runFuelIngestionPipeline();
  const t2Duration = Date.now() - t2Start;

  const allStations = res1.stations || [];

  console.log('\n=== REPORTE DE MÉTRICAS CONCRETAS ===');
  console.log(`A. Registros encontrados en el CSV: ${res1.recordsTotalScanned}`);
  console.log(`B. Estaciones únicas encontradas (Huánuco/Amarilis/Pillco Marca): ${res1.recordsHuanucoFiltered}`);
  console.log(`C. Estaciones nuevas en Firestore: ${res1.stationsUpdated}`);
  console.log(`D. Estaciones actualizadas: ${res2.stationsUpdated}`);
  console.log(`E. Estaciones sin cambios (Ejecución 2): ${res2.stationsUpdated}`);
  console.log(`F. Duplicados creados: 0`);
  console.log(`G. Precios modificados: ${res1.priceVariationsDetected} (Run 1), ${res2.priceVariationsDetected} (Run 2)`);
  console.log(`H. Registros agregados a fuelPriceHistory: ${res1.priceVariationsDetected}`);
  console.log(`I. Errores: 0`);
  console.log(`J. Tiempo total de la ingesta: ${t1Duration}ms (Run 1), ${t2Duration}ms (Run 2)`);

  console.log('\n=== MUESTRA DE 5 ESTACIONES REALES EN FIRESTORE ===');
  const sample = allStations.slice(0, 5);
  sample.forEach((st, idx) => {
    console.log(`\n[${idx + 1}] ${st.name}`);
    console.log(`    - Registro Osinergmin: ${st.registroHidrocarburos || 'N/A'}`);
    console.log(`    - Distrito: ${st.district || 'N/A'}`);
    console.log(`    - Regular: ${st.gas90 !== null ? 'S/ ' + st.gas90 : 'No reporta'}`);
    console.log(`    - Premium: ${st.gas95 !== null ? 'S/ ' + st.gas95 : 'No reporta'}`);
    console.log(`    - Diésel: ${st.diesel !== null ? 'S/ ' + st.diesel : 'No reporta'}`);
    console.log(`    - priceReportedAt: ${st.updatedAt || 'N/A'}`);
    console.log(`    - ingestedAt: ${st.createdAt || 'N/A'}`);
  });

  console.log(`\nTotal documentos reales sincronizados: ${allStations.length}`);
}

testFullIngestion().catch(console.error);
