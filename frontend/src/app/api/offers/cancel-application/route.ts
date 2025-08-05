import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { offerId } = await request.json();

    if (!offerId) {
      return NextResponse.json({ error: 'ID de oferta requerido' }, { status: 400 });
    }

    console.log('=== Cancel Application API: Cancelando postulación ===');
    console.log('Cancel Application API: userId:', userId);
    console.log('Cancel Application API: offerId:', offerId);

    // Llamar a la API de Strapi para cancelar postulación
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/ofertas/${offerId}/cancel-application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        clerkUserId: userId
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Cancel Application API: Postulación cancelada exitosamente:', data);
      return NextResponse.json({
        success: true,
        message: 'Postulación cancelada exitosamente',
        data
      });
    } else {
      let errorMessage = 'Error al cancelar la postulación';

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        const textError = await response.text();
        errorMessage = textError || errorMessage;
      }

      console.error('Cancel Application API: Error de Strapi:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

  } catch (error) {
    console.error('Error en cancel application API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 