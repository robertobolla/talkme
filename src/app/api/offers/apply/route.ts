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

    console.log('=== Apply API: Postulándose a oferta ===');
    console.log('Apply API: userId:', userId);
    console.log('Apply API: offerId:', offerId);

    // Llamar a la API de Strapi para postularse
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/ofertas/${offerId}/apply`, {
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
      console.log('Apply API: Postulación exitosa:', data);
      return NextResponse.json({
        success: true,
        message: 'Postulación enviada exitosamente',
        data
      });
    } else {
      let errorMessage = 'Error al postularse a la oferta';

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        const textError = await response.text();
        errorMessage = textError || errorMessage;
      }

      console.error('Apply API: Error de Strapi:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

  } catch (error) {
    console.error('Error en apply API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 