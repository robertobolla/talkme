const https = require('https');
const http = require('http');

const STRAPI_URL = 'http://localhost:1337';
const FRONTEND_URL = 'http://localhost:3000';

// Función para hacer peticiones HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testSessionBooking() {
  console.log('🧪 Iniciando pruebas de reserva de sesiones...\n');
  
  try {
    // 1. Verificar que el backend está funcionando
    console.log('1️⃣ Verificando backend...');
    const healthResponse = await makeRequest(`${STRAPI_URL}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${JSON.stringify(healthResponse.data)}\n`);
    
    // 2. Obtener compañeros disponibles
    console.log('2️⃣ Obteniendo compañeros disponibles...');
    const companionsResponse = await makeRequest(`${FRONTEND_URL}/api/sessions/companions/available`);
    console.log(`   Status: ${companionsResponse.status}`);
    if (companionsResponse.status === 200) {
      console.log(`   Compañeros encontrados: ${companionsResponse.data.length}`);
      if (companionsResponse.data.length > 0) {
        console.log(`   Primer compañero: ${companionsResponse.data[0].fullName}`);
      }
    } else {
      console.log(`   Error: ${JSON.stringify(companionsResponse.data)}`);
    }
    console.log('');
    
    // 3. Obtener disponibilidad de un compañero específico
    if (companionsResponse.status === 200 && companionsResponse.data.length > 0) {
      const companionId = companionsResponse.data[0].id;
      const today = new Date().toISOString().split('T')[0];
      
      console.log(`3️⃣ Obteniendo disponibilidad del compañero ${companionId} para ${today}...`);
      const availabilityResponse = await makeRequest(
        `${FRONTEND_URL}/api/sessions/companion/${companionId}/real-availability?date=${today}`
      );
      console.log(`   Status: ${availabilityResponse.status}`);
      if (availabilityResponse.status === 200) {
        console.log(`   Slots disponibles: ${availabilityResponse.data.availability?.length || 0}`);
        console.log(`   Sesiones confirmadas: ${availabilityResponse.data.confirmedSessions?.length || 0}`);
      } else {
        console.log(`   Error: ${JSON.stringify(availabilityResponse.data)}`);
      }
      console.log('');
    }
    
    // 4. Probar creación de sesión (simulado)
    console.log('4️⃣ Probando creación de sesión...');
    console.log('   (Esta prueba requiere autenticación, se omite por ahora)');
    console.log('');
    
    // 5. Verificar endpoints de gestión de conflictos
    console.log('5️⃣ Verificando endpoints de gestión de conflictos...');
    const sessionId = 1; // ID de prueba
    
    // Probar endpoint de rechazo
    const rejectResponse = await makeRequest(
      `${FRONTEND_URL}/api/sessions/${sessionId}/reject`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log(`   Reject endpoint status: ${rejectResponse.status}`);
    console.log(`   Reject response: ${JSON.stringify(rejectResponse.data)}`);
    console.log('');
    
    console.log('✅ Pruebas completadas. Revisa los resultados arriba.');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

// Ejecutar las pruebas
testSessionBooking(); 