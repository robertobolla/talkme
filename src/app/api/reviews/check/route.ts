import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offerId');

    if (!offerId) {
      return NextResponse.json({ error: 'ID de oferta requerido' }, { status: 400 });
    }

    // Obtener el perfil del usuario
    const userProfileResponse = await fetch(`${process.env.STRAPI_URL}/api/user-profiles?filters[clerkUserId][$eq]=${userId}&populate=*`);
    const userProfileData = await userProfileResponse.json();

    if (!userProfileData.data || userProfileData.data.length === 0) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    const userProfile = userProfileData.data[0];

    // Verificar si ya existe una review para esta oferta y este cliente
    const reviewResponse = await fetch(`${process.env.STRAPI_URL}/api/reviews?filters[offer][$eq]=${offerId}&filters[client][$eq]=${userProfile.id}&populate=*`);
    const reviewData = await reviewResponse.json();

    const hasRated = reviewData.data && reviewData.data.length > 0;

    return NextResponse.json({
      hasRated,
      review: hasRated ? reviewData.data[0] : null
    });

  } catch (error) {
    console.error('Error checking review:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 