const fetch = require('node-fetch');

async function checkAvailability() {
  const STRAPI_URL = 'http://localhost:1337';
  const STRAPI_API_TOKEN = '49a44791c218a5fd76a818b3e79fd768a9c25498ecb2ea8aa22ea22888b0eafea9f7caddab6cc62dc840ad8fe2aec3f16d07af98360da687c105bfc9f2f078a70ad78b58e2b4265cb8605dba09e579f469a02a01a6396347980f7be9759659d0768a7a7e4142b7a10d3a02d8b4bf949db2158dec44df66e6a14cb25ebb1f5030';

  try {
    console.log('=== Verificando disponibilidad ===');

    // Obtener todos los slots de disponibilidad
    const availabilityResponse = await fetch(`${STRAPI_URL}/api/availability-slots?populate=*`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const availabilityData = await availabilityResponse.json();
    const availabilitySlots = availabilityData.data || [];

    console.log('Total slots de disponibilidad:', availabilitySlots.length);

    // Mostrar cada slot con su información
    for (const slot of availabilitySlots) {
      console.log(`Slot ID: ${slot.id}`);
      console.log(`  - Companion ID: ${slot.companion?.id || 'NO ASIGNADO'}`);
      console.log(`  - Companion Email: ${slot.companion?.email || 'NO ASIGNADO'}`);
      console.log(`  - Day: ${slot.dayOfWeek}, Time: ${slot.startTime} - ${slot.endTime}`);
      console.log('---');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAvailability(); 