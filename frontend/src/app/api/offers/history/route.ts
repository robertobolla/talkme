import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('=== OBTENIENDO HISTORIAL DE OFERTAS ===');
    console.log('Usuario autenticado:', userId);

    // Obtener perfil del usuario
    const profileResponse = await fetch(`http://localhost:1337/api/user-profiles?filters[clerkUserId][$eq]=${userId}&populate=*`);

    if (!profileResponse.ok) {
      return NextResponse.json(
        { error: 'Error al obtener perfil del usuario' },
        { status: 500 }
      );
    }

    const profileData = await profileResponse.json();
    const userProfile = profileData.data?.[0];

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado' },
        { status: 404 }
      );
    }

    console.log('Perfil del usuario:', userProfile);

    let offers = [];

    if (userProfile.role === 'client') {
      // Para clientes: obtener todas las ofertas que han creado
      const offersResponse = await fetch(
        `http://localhost:1337/api/ofertas?populate=client,professional,applicants&filters[client][id][$eq]=${userProfile.id}&sort[0]=createdAt:desc&pagination[pageSize]=100`
      );

      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        console.log('Respuesta completa de Strapi:', JSON.stringify(offersData, null, 2));
        
        // Manejar diferentes formatos de respuesta
        if (offersData.data) {
          offers = offersData.data;
        } else if (offersData.results) {
          offers = offersData.results;
        }
        
        console.log('Ofertas del cliente obtenidas:', offers.length);
        console.log('Datos de ofertas:', JSON.stringify(offers, null, 2));
      }
    } else if (userProfile.role === 'professional') {
      // Para profesionales: obtener todas las ofertas donde se han postulado
      const offersResponse = await fetch(
        `http://localhost:1337/api/ofertas?populate=client,professional,applicants&filters[applicants][id][$eq]=${userProfile.id}&sort[0]=createdAt:desc`
      );

      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        offers = offersData.data || [];
        console.log('Ofertas del profesional obtenidas:', offers.length);
      }
    }

    // Transformar los datos para el frontend
    const transformedOffers = offers.map((offer: any) => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      location: offer.location,
      dateTime: offer.dateTime,
      duration: offer.duration,
      status: offer.status,
      createdAt: offer.createdAt,
      client: offer.client,
      professional: offer.professional,
      applicants: offer.applicants || []
    }));

    console.log('Historial de ofertas procesado:', transformedOffers.length);

    return NextResponse.json({
      success: true,
      offers: transformedOffers
    });

  } catch (error) {
    console.error('Error obteniendo historial de ofertas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 