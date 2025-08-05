import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { offerId } = body;

    console.log('=== CANCELANDO OFERTA ===');
    console.log('Usuario autenticado:', userId);
    console.log('ID de la oferta:', offerId);

    // Verificar que la oferta existe y pertenece al usuario
    const offerResponse = await fetch(`http://localhost:1337/api/ofertas/${offerId}?populate=client`);

    if (!offerResponse.ok) {
      return NextResponse.json(
        { error: 'Oferta no encontrada' },
        { status: 404 }
      );
    }

    const offerData = await offerResponse.json();
    const offer = offerData.data;

    // Verificar que el usuario es el cliente que creó la oferta
    if (!offer.client || offer.client.clerkUserId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para cancelar esta oferta' },
        { status: 403 }
      );
    }

    // Verificar que la oferta está en estado 'published'
    if (offer.status !== 'published') {
      return NextResponse.json(
        { error: 'Solo se pueden cancelar ofertas en estado publicado' },
        { status: 400 }
      );
    }

    // Cancelar la oferta en Strapi usando la ruta específica
    const cancelResponse = await fetch(`http://localhost:1337/api/ofertas/${offerId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkUserId: userId
      }),
    });

    if (!cancelResponse.ok) {
      console.error('Error al cancelar oferta en Strapi:', cancelResponse.status);
      return NextResponse.json(
        { error: 'Error al cancelar la oferta' },
        { status: 500 }
      );
    }

    const cancelledOffer = await cancelResponse.json();
    console.log('Oferta cancelada exitosamente:', cancelledOffer);

    return NextResponse.json({
      success: true,
      message: 'Oferta cancelada exitosamente',
      offer: cancelledOffer.data
    });

  } catch (error) {
    console.error('Error cancelando oferta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 