import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { strapiApi } from '@/lib/strapi';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('=== Offers API: Obteniendo ofertas desde Strapi ===');
    console.log('Offers API: userId:', userId);

    // Obtener el perfil del usuario
    const userProfile = await strapiApi.getUserProfile(userId);
    console.log('Offers API: Perfil completo del usuario:', userProfile);

    if (!userProfile) {
      console.log('Offers API: No se encontró perfil para el usuario');
      return NextResponse.json({ offers: [] });
    }

    // Determinar el rol del usuario - puede estar en attributes o directamente
    const userRole = userProfile.attributes?.role || (userProfile as any).role;
    console.log('Offers API: Rol del usuario:', userRole || 'sin rol');
    console.log('Offers API: Estructura del perfil:', {
      id: userProfile.id,
      hasAttributes: !!userProfile.attributes,
      attributesKeys: userProfile.attributes ? Object.keys(userProfile.attributes) : 'no attributes',
      directRole: (userProfile as any).role
    });

    // Obtener ofertas según el rol del usuario
    const offers = await strapiApi.getOffers(userRole, userId);

    // Si es profesional, verificar si ya se postuló a cada oferta
    if (userRole === 'professional') {
      // Obtener el perfil del usuario actual para comparar por ID
      const currentUserProfile = await strapiApi.getUserProfile(userId);
      console.log('Offers API: Perfil del usuario actual:', currentUserProfile);

      const offersWithApplicationStatus = await Promise.all(
        offers.map(async (offer) => {
          try {
            // Verificar si el usuario ya se postuló a esta oferta
            const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/ofertas/${offer.id}?populate=applicants`, {
              headers: {
                'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
              },
            });

            if (response.ok) {
              const offerData = await response.json();
              const applicants = offerData.data?.applicants || [];
              console.log(`Offers API: Oferta ${offer.id} - Postulantes:`, applicants.map((a: any) => ({ id: a.id, fullName: a.fullName })));

              // Comparar por ID del perfil del usuario actual
              const hasApplied = currentUserProfile && applicants.some((applicant: any) => {
                // currentUserProfile tiene estructura { id: number, attributes: {...} }
                const currentUserId = currentUserProfile.id;
                const applicantId = applicant.id;
                console.log(`Offers API: Comparando usuario ${currentUserId} con postulante ${applicantId}`);
                return currentUserId === applicantId;
              });
              console.log(`Offers API: Oferta ${offer.id} - Usuario ya se postuló:`, hasApplied);

              return {
                ...offer,
                hasApplied
              };
            }
          } catch (error) {
            console.error(`Error checking application status for offer ${offer.id}:`, error);
          }

          return {
            ...offer,
            hasApplied: false
          };
        })
      );

      console.log('Offers API: Ofertas con estado de postulación:', offersWithApplicationStatus.length);
      return NextResponse.json({ offers: offersWithApplicationStatus });
    }

    console.log('Offers API: Ofertas encontradas:', offers.length);
    return NextResponse.json({ offers });

  } catch (error) {
    console.error('Error en offers API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const offerData = await request.json();

    console.log('=== Offers API: Creando oferta en Strapi ===');
    console.log('Offers API: userId:', userId);
    console.log('Offers API: Datos de la oferta:', offerData);

    const createdOffer = await strapiApi.createOffer(offerData, userId);

    if (!createdOffer) {
      console.error('Offers API: Error al crear oferta en Strapi');
      return NextResponse.json(
        { error: 'Error al crear la oferta' },
        { status: 500 }
      );
    }

    console.log('Offers API: Oferta creada en Strapi:', createdOffer.id);

    return NextResponse.json({
      success: true,
      message: 'Oferta creada exitosamente',
      offer: createdOffer
    });

  } catch (error) {
    console.error('Error en offers API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para limpiar todas las ofertas (solo para desarrollo)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('=== LIMPIANDO TODAS LAS OFERTAS EN STRAPI ===');

    // Nota: En producción, esto debería estar protegido por permisos de admin
    // Por ahora, solo para desarrollo
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/ofertas`, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log('Todas las ofertas han sido eliminadas de Strapi');
      return NextResponse.json({
        success: true,
        message: 'Todas las ofertas han sido eliminadas'
      });
    } else {
      throw new Error('Error al eliminar ofertas de Strapi');
    }

  } catch (error) {
    console.error('Error clearing offers:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 