import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, userRole, isReady } = await request.json();

    if (!process.env.STRAPI_URL) {
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    if (!process.env.STRAPI_API_TOKEN) {
      return NextResponse.json(
        { error: 'Token de API no configurado' },
        { status: 500 }
      );
    }

    // En producción, aquí actualizarías el estado en la base de datos
    // Por ahora, solo simulamos la respuesta
    console.log(`Usuario ${userId} (${userRole}) marcado como ${isReady ? 'listo' : 'no listo'} para sesión ${id}`);

    return NextResponse.json({
      success: true,
      message: `Usuario marcado como ${isReady ? 'listo' : 'no listo'}`
    });
  } catch (error) {
    console.error('Error en ready session endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');

    if (!process.env.STRAPI_URL) {
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    if (!process.env.STRAPI_API_TOKEN) {
      return NextResponse.json(
        { error: 'Token de API no configurado' },
        { status: 500 }
      );
    }

    // En producción, aquí consultarías el estado en la base de datos
    // Por ahora, simulamos que ambos están listos después de un delay
    console.log(`Consultando estado de listos para sesión ${id}`);

    return NextResponse.json({
      userReady: true,
      otherPartyReady: true,
      bothReady: true
    });
  } catch (error) {
    console.error('Error en get ready status endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 