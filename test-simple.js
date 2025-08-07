const https = require('https');
const http = require('http');

const STRAPI_URL = 'http://localhost:1337';
const FRONTEND_URL = 'http://localhost:3003';

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

async function testBasicFunctionality() {
  console.log('🧪 Pruebas básicas de funcionalidad...\n');
  
  try {
    // 1. Verificar que el frontend responde
    console.log('1️⃣ Verificando frontend...');
    const frontendResponse = await makeRequest(`${FRONTEND_URL}/api/health`);
    console.log(`   Status: ${frontendResponse.status}`);
    console.log(`   Response: ${JSON.stringify(frontendResponse.data)}\n`);
    
    // 2. Verificar que el backend responde
    console.log('2️⃣ Verificando backend...');
    const backendResponse = await makeRequest(`${STRAPI_URL}/api/health`);
    console.log(`   Status: ${backendResponse.status}`);
    console.log(`   Response: ${JSON.stringify(backendResponse.data)}\n`);
    
    // 3. Probar endpoint de compañeros disponibles
    console.log('3️⃣ Probando endpoint de compañeros...');
    const companionsResponse = await makeRequest(`${FRONTEND_URL}/api/sessions/companions/available`);
    console.log(`   Status: ${companionsResponse.status}`);
    if (companionsResponse.status === 200) {
      console.log(`   Compañeros encontrados: ${companionsResponse.data.length}`);
    } else {
      console.log(`   Error: ${JSON.stringify(companionsResponse.data)}`);
    }
    console.log('');
    
    console.log('✅ Pruebas básicas completadas.');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

// Ejecutar las pruebas
testBasicFunctionality(); 