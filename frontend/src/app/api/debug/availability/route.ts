import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Verificando disponibilidad de acompañantes ===');
    
    if (!process.env.STRAPI_URL || !process.env.STRAPI_API_TOKEN) {
      return NextResponse.json({ error: 'Variables de Strapi no configuradas' }, { status: 500 });
    }

    // Obtener todos los acompañantes
    const companionsResponse = await fetch(`${process.env.STRAPI_URL}/api/user-profiles?filters[role][$eq]=companion&populate=*`, {
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!companionsResponse.ok) {
      const errorText = await companionsResponse.text();
      console.error('Error al obtener acompañantes:', errorText);
      return NextResponse.json({ error: 'Error al obtener acompañantes' }, { status: companionsResponse.status });
    }

    const companionsData = await companionsResponse.json();
    const companions = companionsData.data || [];

    console.log('Acompañantes encontrados:', companions.length);

    // Para cada acompañante, obtener su disponibilidad
    const companionsWithAvailability = [];

    for (const companion of companions) {
      console.log(`Verificando disponibilidad para: ${companion.email} (ID: ${companion.id})`);
      
      const availabilityResponse = await fetch(`${process.env.STRAPI_URL}/api/availability-slots?filters[companion][$eq]=${companion.id}&populate=*`, {
        headers: {
          'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      let availability = [];
      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json();
        availability = availabilityData.data || [];
      }

      companionsWithAvailability.push({
        id: companion.id,
        email: companion.email,
        fullName: companion.fullName,
        availabilityCount: availability.length,
        availability: availability.map((slot: any) => ({
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          startDate: slot.startDate,
          endDate: slot.endDate,
          isActive: slot.isActive
        }))
      });
    }

    return NextResponse.json({
      totalCompanions: companions.length,
      companions: companionsWithAvailability
    });

  } catch (error) {
    console.error('Error en debug availability:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 