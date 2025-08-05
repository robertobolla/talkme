const STRAPI_URL = 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function testAcceptedTasks() {
  console.log('=== Probando funcionalidad de tareas aceptadas ===\n');

  try {
    // 1. Crear cliente con contacto de emergencia
    console.log('1. Creando cliente con contacto de emergencia...');
    const clientResponse = await fetch(`${STRAPI_URL}/api/user-profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          fullName: 'María García',
          email: 'maria@example.com',
          phone: '+34 600 123 456',
          address: 'Calle Mayor 123, Madrid',
          role: 'client',
          clerkUserId: 'maria_test_user',
          status: 'approved',
          emergencyContact: {
            name: 'Juan García',
            phone: '+34 600 789 012',
            relationship: 'Hijo'
          }
        }
      })
    });

    if (!clientResponse.ok) {
      throw new Error(`Error creando cliente: ${clientResponse.status}`);
    }

    const clientData = await clientResponse.json();
    const clientId = clientData.data.id;
    console.log(`✅ Cliente creado con ID: ${clientId}`);

    // 2. Crear oferta del cliente
    console.log('\n2. Creando oferta del cliente...');
    const offerResponse = await fetch(`${STRAPI_URL}/api/ofertas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          title: 'Cuidado de adulto mayor - Urgente',
          description: 'Necesito ayuda para cuidar a mi madre de 85 años. Requiere asistencia con medicamentos y movilidad.',
          location: 'Calle Mayor 123, Madrid',
          dateTime: '2024-01-15T10:00:00.000Z',
          duration: 4,
          hourlyRate: 25,
          specialRequirements: 'Experiencia con adultos mayores y manejo de medicamentos',
          urgency: 'urgent',
          status: 'published',
          client: clientId,
          clerkUserId: 'maria_test_user'
        }
      })
    });

    if (!offerResponse.ok) {
      throw new Error(`Error creando oferta: ${offerResponse.status}`);
    }

    const offerData = await offerResponse.json();
    const offerId = offerData.data.id;
    console.log(`✅ Oferta creada con ID: ${offerId}`);

    // 3. Aplicar profesional a la oferta
    console.log('\n3. Aplicando profesional a la oferta...');
    const applyResponse = await fetch(`${STRAPI_URL}/api/ofertas/${offerId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        clerkUserId: 'roberto_test_user'
      })
    });

    if (!applyResponse.ok) {
      throw new Error(`Error aplicando profesional: ${applyResponse.status}`);
    }

    console.log('✅ Profesional aplicado a la oferta');

    // 4. Aceptar al profesional
    console.log('\n4. Aceptando al profesional...');
    const acceptResponse = await fetch(`${STRAPI_URL}/api/ofertas/${offerId}/accept-professional`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        clerkUserId: 'maria_test_user',
        professionalId: 10 // Roberto Angel
      })
    });

    if (!acceptResponse.ok) {
      throw new Error(`Error aceptando profesional: ${acceptResponse.status}`);
    }

    console.log('✅ Profesional aceptado para la oferta');

    // 5. Verificar que la oferta tiene profesional asignado
    console.log('\n5. Verificando oferta con profesional asignado...');
    const verifyResponse = await fetch(`${STRAPI_URL}/api/ofertas/${offerId}?populate=client,professional`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      }
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Oferta verificada:', {
        id: verifyData.data.id,
        title: verifyData.data.title,
        professional: verifyData.data.professional?.fullName || 'Sin profesional',
        client: verifyData.data.client?.fullName || 'Sin cliente'
      });
    }

    console.log('\n🎉 ¡Prueba completada exitosamente!');
    console.log('\n📋 Para probar en el frontend:');
    console.log('1. Ve a http://localhost:3001/dashboard');
    console.log('2. Haz clic en "Mis Tareas Aceptadas" (si eres profesional)');
    console.log('3. Deberías ver la tarea con información del cliente y contacto de emergencia');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Verificar si Strapi está disponible antes de ejecutar
async function checkStrapi() {
  try {
    const response = await fetch(STRAPI_URL);
    if (response.ok) {
      console.log('✅ Strapi está disponible');
      await testAcceptedTasks();
    } else {
      console.log('❌ Strapi no está disponible');
    }
  } catch (error) {
    console.log('❌ Strapi no está disponible:', error.message);
  }
}

checkStrapi(); 