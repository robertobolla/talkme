import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { offerId, professionalId } = await request.json();

    if (!offerId) {
      return NextResponse.json({ error: 'ID de oferta requerido' }, { status: 400 });
    }

    if (!professionalId) {
      return NextResponse.json({ error: 'ID de profesional requerido' }, { status: 400 });
    }

    console.log('=== Accept Professional API: Aceptando profesional ===');
    console.log('Accept Professional API: userId:', userId);
    console.log('Accept Professional API: offerId:', offerId);
    console.log('Accept Professional API: professionalId:', professionalId);

    // Llamar a la API de Strapi para aceptar profesional
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/ofertas/${offerId}/accept-professional`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        clerkUserId: userId,
        professionalId: professionalId
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Accept Professional API: Profesional aceptado exitosamente:', data);
      return NextResponse.json({
        success: true,
        message: 'Profesional aceptado exitosamente',
        data
      });
    } else {
      let errorMessage = 'Error al aceptar al profesional';

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        const textError = await response.text();
        errorMessage = textError || errorMessage;
      }

      console.error('Accept Professional API: Error de Strapi:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

  } catch (error) {
    console.error('Error en accept professional API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 