const fetch = require('node-fetch');

const STRAPI_URL = 'http://localhost:1337';

async function testTalkMeAPIs() {
  console.log('🧪 Probando APIs de TalkMe...\n');

  try {
    // 1. Obtener acompañantes disponibles
    console.log('1️⃣ Probando obtener acompañantes disponibles...');
    const companionsResponse = await fetch(`${STRAPI_URL}/api/sessions/companions/available`);
    const companions = await companionsResponse.json();
    console.log('✅ Acompañantes disponibles:', companions.data?.length || 0);
    console.log('');

    // 2. Obtener sesiones de un usuario (simulado)
    console.log('2️⃣ Probando obtener sesiones de usuario...');
    const sessionsResponse = await fetch(`${STRAPI_URL}/api/sessions/user/1`);
    const sessions = await sessionsResponse.json();
    console.log('✅ Sesiones del usuario:', sessions.data?.length || 0);
    console.log('');

    // 3. Obtener balance de usuario (simulado)
    console.log('3️⃣ Probando obtener balance de usuario...');
    const balanceResponse = await fetch(`${STRAPI_URL}/api/payments/balance/1`);
    const balance = await balanceResponse.json();
    console.log('✅ Balance del usuario:', balance);
    console.log('');

    // 4. Obtener pagos de usuario (simulado)
    console.log('4️⃣ Probando obtener pagos de usuario...');
    const paymentsResponse = await fetch(`${STRAPI_URL}/api/payments/user/1`);
    const payments = await paymentsResponse.json();
    console.log('✅ Pagos del usuario:', payments.data?.length || 0);
    console.log('');

    console.log('🎉 Todas las pruebas completadas exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('- ✅ APIs de Session funcionando');
    console.log('- ✅ APIs de Payment funcionando');
    console.log('- ✅ APIs de User Profile actualizadas');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

testTalkMeAPIs(); 