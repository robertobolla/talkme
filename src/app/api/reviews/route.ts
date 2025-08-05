import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { offerId, rating, review, professionalName } = await request.json();

    if (!offerId || !rating || !review || !professionalName) {
      return NextResponse.json({
        error: 'Todos los campos son requeridos'
      }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({
        error: 'La calificación debe estar entre 1 y 5'
      }, { status: 400 });
    }

    if (review.trim().length < 10) {
      return NextResponse.json({
        error: 'La review debe tener al menos 10 caracteres'
      }, { status: 400 });
    }

    // Verificar que el usuario es el cliente que creó la oferta
    const userProfileResponse = await fetch(`${process.env.STRAPI_URL}/api/user-profiles?filters[clerkUserId][$eq]=${userId}&populate=*`);
    const userProfileData = await userProfileResponse.json();

    if (!userProfileData.data || userProfileData.data.length === 0) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    const userProfile = userProfileData.data[0];
    if (userProfile.role !== 'client') {
      return NextResponse.json({ error: 'Solo clientes pueden calificar profesionales' }, { status: 403 });
    }

    // Obtener la oferta para verificar que está completada
    const offerResponse = await fetch(`${process.env.STRAPI_URL}/api/ofertas/${offerId}?populate=client,professional`);
    const offerData = await offerResponse.json();

    if (!offerData.data) {
      return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 });
    }

    const offer = offerData.data;

    // Verificar que el cliente es el propietario de la oferta
    if (offer.client?.id !== userProfile.id) {
      return NextResponse.json({ error: 'Solo puedes calificar tus propias ofertas' }, { status: 403 });
    }

    // Verificar que la oferta está completada
    if (offer.status !== 'completed') {
      return NextResponse.json({ error: 'Solo se pueden calificar ofertas completadas' }, { status: 400 });
    }

    // Verificar que no se haya calificado antes
    const existingReviewResponse = await fetch(`${process.env.STRAPI_URL}/api/reviews?filters[offer][$eq]=${offerId}&filters[client][$eq]=${userProfile.id}`);
    const existingReviewData = await existingReviewResponse.json();

    if (existingReviewData.data && existingReviewData.data.length > 0) {
      return NextResponse.json({ error: 'Ya has calificado esta oferta' }, { status: 400 });
    }

    // Crear la review
    const reviewData = {
      data: {
        rating,
        comment: review.trim(),
        offer: offerId,
        client: userProfile.id,
        professional: offer.professional?.id,
        date: new Date().toISOString(),
        isAnonymous: false
      }
    };

    const createReviewResponse = await fetch(`${process.env.STRAPI_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`
      },
      body: JSON.stringify(reviewData)
    });

    if (!createReviewResponse.ok) {
      console.error('Error creating review:', await createReviewResponse.text());
      return NextResponse.json({ error: 'Error al crear la review' }, { status: 500 });
    }

    const createdReview = await createReviewResponse.json();

    // Actualizar la calificación promedio del profesional
    const professionalId = offer.professional?.id;
    if (professionalId) {
      const professionalReviewsResponse = await fetch(`${process.env.STRAPI_URL}/api/reviews?filters[professional][$eq]=${professionalId}&populate=*`);
      const professionalReviewsData = await professionalReviewsResponse.json();

      if (professionalReviewsData.data && professionalReviewsData.data.length > 0) {
        const totalRating = professionalReviewsData.data.reduce((sum: number, review: any) => sum + review.rating, 0);
        const averageRating = totalRating / professionalReviewsData.data.length;

        // Actualizar el perfil del profesional
        await fetch(`${process.env.STRAPI_URL}/api/user-profiles/${professionalId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`
          },
          body: JSON.stringify({
            data: {
              averageRating: Math.round(averageRating * 10) / 10 // Redondear a 1 decimal
            }
          })
        });
      }
    }

    return NextResponse.json({
      message: 'Review creada exitosamente',
      review: createdReview.data
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 