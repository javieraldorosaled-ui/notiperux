import fetch from 'node-fetch'; // or global fetch in node 22

async function testInternalEndpoint() {
  console.log('Probando endpoint /api/internal/ingest-fuels...');
  // Simular llamada local al servidor o probar script
  const res = await fetch('http://localhost:3000/api/internal/ingest-fuels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  console.log('RESPUESTA DEL ENDPOINT INTERNO:', JSON.stringify(data, null, 2));
}

testInternalEndpoint().catch(console.error);
