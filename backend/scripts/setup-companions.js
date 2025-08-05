const fetch = require('node-fetch');

async function setupCompanions() {
  try {
    console.log('🔧 Configurando acompañantes...');

    // Buscar todos los acompañantes
    const response = await fetch('http://localhost:1337/api/user-profiles?filters[role][$eq]=companion&populate=*', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const companions = data.data || [];

    console.log(`Encontrados ${companions.length} acompañantes`);

    // Actualizar cada acompañante
    for (const companion of companions) {
      console.log(`Actualizando acompañante: ${companion.attributes.fullName} (ID: ${companion.id})`);
      
      const updateResponse = await fetch(`http://localhost:1337/api/user-profiles/${companion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            status: 'approved',
            hourlyRate: 25, // 25 USDT por hora
            specialties: ['Escucha activa', 'Acompañamiento emocional', 'Conversación'],
            languages: ['Español', 'Inglés'],
            isOnline: true,
            bio: 'Acompañante profesional disponible para sesiones de escucha y acompañamiento emocional.',
            phone: '+1234567890',
            address: 'Ciudad, País'
          }
        })
      });

      if (!updateResponse.ok) {
        console.error(`Error actualizando acompañante ${companion.id}:`, await updateResponse.text());
      }
    }

    console.log('✅ Acompañantes configurados correctamente');
    
    // Mostrar acompañantes actualizados
    const updatedResponse = await fetch('http://localhost:1337/api/user-profiles?filters[role][$eq]=companion&filters[status][$eq]=approved&populate=*', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (updatedResponse.ok) {
      const updatedData = await updatedResponse.json();
      const updatedCompanions = updatedData.data || [];

      console.log('\n📋 Acompañantes disponibles:');
      updatedCompanions.forEach(companion => {
        const attrs = companion.attributes;
        console.log(`- ${attrs.fullName} (${attrs.email}) - $${attrs.hourlyRate}/hora`);
      });
    }

  } catch (error) {
    console.error('❌ Error configurando acompañantes:', error);
  }
}

setupCompanions(); 