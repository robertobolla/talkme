const fetch = require('node-fetch');

async function fixAvailability() {
  const STRAPI_URL = 'http://localhost:1337';
  const STRAPI_API_TOKEN = '49a44791c218a5fd76a818b3e79fd768a9c25498ecb2ea8aa22ea22888b0eafea9f7caddab6cc62dc840ad8fe2aec3f16d07af98360da687c105bfc9f2f078a70ad78b58e2b4265cb8605dba09e579f469a02a01a6396347980f7be9759659d0768a7a7e4142b7a10d3a02d8b4bf949db2158dec44df66e6a14cb25ebb1f5030';

  try {
    console.log('=== Arreglando asignación de disponibilidad ===');

    // 1. Obtener todos los acompañantes
    const companionsResponse = await fetch(`${STRAPI_URL}/api/user-profiles?filters[role][$eq]=companion`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const companionsData = await companionsResponse.json();
    const companions = companionsData.data || [];

    console.log('Acompañantes encontrados:', companions.length);

    // 2. Obtener todos los slots de disponibilidad
    const availabilityResponse = await fetch(`${STRAPI_URL}/api/availability-slots?populate=*`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const availabilityData = await availabilityResponse.json();
    const availabilitySlots = availabilityData.data || [];

    console.log('Slots de disponibilidad encontrados:', availabilitySlots.length);

    // 3. Eliminar todos los slots existentes
    console.log('Eliminando slots existentes...');
    for (const slot of availabilitySlots) {
      await fetch(`${STRAPI_URL}/api/availability-slots/${slot.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('Slots eliminados correctamente');

    // 4. Crear nuevos slots para cada acompañante
    for (const companion of companions) {
      console.log(`Creando disponibilidad para: ${companion.email} (ID: ${companion.id})`);

      // Crear algunos slots de ejemplo para cada acompañante
      const sampleSlots = [
        {
          dayOfWeek: 1, // Lunes
          startTime: '09:00:00.000',
          endTime: '10:00:00.000',
          isActive: true,
          companion: companion.id
        },
        {
          dayOfWeek: 2, // Martes
          startTime: '14:00:00.000',
          endTime: '16:00:00.000',
          isActive: true,
          companion: companion.id
        },
        {
          dayOfWeek: 3, // Miércoles
          startTime: '10:00:00.000',
          endTime: '12:00:00.000',
          isActive: true,
          companion: companion.id
        }
      ];

      for (const slotData of sampleSlots) {
        await fetch(`${STRAPI_URL}/api/availability-slots`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ data: slotData })
        });
      }
    }

    console.log('Disponibilidad creada correctamente para todos los acompañantes');

  } catch (error) {
    console.error('Error:', error);
  }
}

fixAvailability(); 