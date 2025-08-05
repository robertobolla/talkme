import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('=== Accepted Tasks API: Obteniendo tareas aceptadas ===');
    console.log('Accepted Tasks API: userId:', userId);

    // Obtener el perfil del usuario
    const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/user-profiles?filters[clerkUserId][$eq]=${userId}&populate=*`, {
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('Accepted Tasks API: Error obteniendo perfil del usuario');
      return NextResponse.json({ error: 'Error obteniendo perfil del usuario' }, { status: 500 });
    }

    const profileData = await profileResponse.json();
    const userProfile = profileData.data[0];

    if (!userProfile) {
      console.log('Accepted Tasks API: No se encontró perfil para el usuario');
      return NextResponse.json({ tasks: [] });
    }

    console.log('Accepted Tasks API: Perfil del usuario:', {
      id: userProfile.id,
      role: userProfile.role,
      fullName: userProfile.fullName
    });

    // Solo profesionales pueden ver tareas aceptadas
    if (userProfile.role !== 'professional') {
      console.log('Accepted Tasks API: Usuario no es profesional');
      return NextResponse.json({ tasks: [] });
    }

    // Obtener ofertas donde el profesional ha sido aceptado
    const offersResponse = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/ofertas?filters[professional][id][$eq]=${userProfile.id}&populate=client,professional`, {
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
      },
    });

    if (!offersResponse.ok) {
      console.error('Accepted Tasks API: Error obteniendo ofertas aceptadas');
      return NextResponse.json({ error: 'Error obteniendo tareas aceptadas' }, { status: 500 });
    }

    const offersData = await offersResponse.json();
    const acceptedOffers = offersData.results || offersData.data || [];

    console.log('Accepted Tasks API: Ofertas aceptadas encontradas:', acceptedOffers.length);

    // Procesar las ofertas para obtener información completa
    const tasksWithDetails = await Promise.all(
      acceptedOffers.map(async (offer: any) => {
        try {
          // Obtener información detallada del cliente
          const clientResponse = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/user-profiles/${offer.client.id}?populate=*`, {
            headers: {
              'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
            },
          });

          let clientDetails = offer.client;
          if (clientResponse.ok) {
            const clientData = await clientResponse.json();
            clientDetails = {
              ...offer.client,
              ...clientData.data,
            };
          }

          return {
            id: offer.id,
            title: offer.title,
            description: offer.description,
            location: offer.location,
            dateTime: offer.dateTime,
            duration: offer.duration,
            hourlyRate: offer.hourlyRate,
            specialRequirements: offer.specialRequirements,
            urgency: offer.urgency,
            status: offer.status,
            client: {
              id: clientDetails.id,
              fullName: clientDetails.fullName || 'Sin nombre',
              email: clientDetails.email || 'Sin email',
              phone: clientDetails.phone || '',
              emergencyContact: clientDetails.emergencyContact || null,
            },
          };
        } catch (error) {
          console.error(`Error procesando oferta ${offer.id}:`, error);
          return null;
        }
      })
    );

    const validTasks = tasksWithDetails.filter(task => task !== null);

    console.log('Accepted Tasks API: Tareas procesadas:', validTasks.length);

    return NextResponse.json({
      success: true,
      tasks: validTasks
    });

  } catch (error) {
    console.error('Error en accepted tasks API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 