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

    console.log('=== COMPLETANDO OFERTA ===');
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
        { error: 'No tienes permisos para completar esta oferta' },
        { status: 403 }
      );
    }

    // Verificar que la oferta está en estado 'accepted'
    if (offer.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Solo se pueden completar ofertas que han sido aceptadas' },
        { status: 400 }
      );
    }

    // Completar la oferta en Strapi
    const completeResponse = await fetch(`http://localhost:1337/api/ofertas/${offerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          status: 'completed'
        }
      }),
    });

    if (!completeResponse.ok) {
      console.error('Error al completar oferta en Strapi:', completeResponse.status);
      return NextResponse.json(
        { error: 'Error al completar la oferta' },
        { status: 500 }
      );
    }

    const completedOffer = await completeResponse.json();
    console.log('Oferta completada exitosamente:', completedOffer);

    return NextResponse.json({
      success: true,
      message: 'Oferta completada exitosamente',
      offer: completedOffer.data
    });

  } catch (error) {
    console.error('Error completando oferta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 