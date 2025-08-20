import { NextRequest, NextResponse } from 'next/server';

// Estado global del contador (en producción esto debería estar en la base de datos)
const sessionTimers = new Map<string, {
  startTime: string;
  endTime: string;
  status: 'waiting' | 'ready' | 'expired';
  userReady: boolean;
  companionReady: boolean;
  lastUpdated: number;
}>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, userRole, isReady } = await request.json();

    // Intentar obtener información de la sesión desde Strapi, pero no fallar si no está disponible
    let sessionStartTime: string | null = null;
    let sessionEndTime: string | null = null;

    try {
      if (process.env.STRAPI_URL && process.env.STRAPI_API_TOKEN) {
        const sessionResponse = await fetch(`${process.env.STRAPI_URL}/api/sessions/${id}?populate=user,companion`, {
          headers: {
            'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
          },
        });

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          const session = sessionData.data;
          sessionStartTime = session?.attributes?.startTime ?? null;
          sessionEndTime = session?.attributes?.endTime ?? null;
        } else {
          console.warn('Could not fetch session from Strapi, proceeding without it. Status:', sessionResponse.status);
        }
      } else {
        console.warn('STRAPI env not configured; proceeding without Strapi fetch for ready endpoint');
      }
    } catch (err) {
      console.warn('Error fetching session from Strapi; proceeding without it:', err);
    }

    // Crear o actualizar el timer global
    const timerKey = `session_${id}`;
    const now = Date.now();

    if (!sessionTimers.has(timerKey)) {
      // Fallbacks si no pudimos obtener tiempos desde Strapi
      const fallbackStart = sessionStartTime ?? new Date().toISOString();
      const fallbackEnd = sessionEndTime ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +60 min

      sessionTimers.set(timerKey, {
        startTime: fallbackStart,
        endTime: fallbackEnd,
        status: 'waiting',
        userReady: false,
        companionReady: false,
        lastUpdated: now
      });
    }

    const timer = sessionTimers.get(timerKey)!;

    // Actualizar el estado según el rol
    if (userRole === 'user') {
      timer.userReady = isReady;
    } else if (userRole === 'companion') {
      timer.companionReady = isReady;
    }

    timer.lastUpdated = now;

    // Verificar si ambos están listos
    if (timer.userReady && timer.companionReady) {
      timer.status = 'ready';
    }

    // Limpiar timers antiguos (más de 1 hora)
    const oneHourAgo = now - (60 * 60 * 1000);
    for (const [key, timerData] of sessionTimers.entries()) {
      if (timerData.lastUpdated < oneHourAgo) {
        sessionTimers.delete(key);
      }
    }

    // Verificar si la sesión ha expirado y cerrarla automáticamente
    const sessionEnd = new Date(sessionTimers.get(timerKey)!.endTime);
    if (now > sessionEnd.getTime()) {
      timer.status = 'expired';
      console.log(`Session ${id} has expired, marking as expired`);
    }

    console.log(`Usuario ${userId} (${userRole}) marcado como ${isReady ? 'listo' : 'no listo'} para sesión ${id}`);
    console.log('Estado del timer:', timer);

    return NextResponse.json({
      success: true,
      message: `Usuario marcado como ${isReady ? 'listo' : 'no listo'}`,
      timer: timer
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

    const timerKey = `session_${id}`;
    const timer = sessionTimers.get(timerKey);

    if (!timer) {
      return NextResponse.json({
        userReady: false,
        otherPartyReady: false,
        bothReady: false,
        timer: null
      });
    }

    // Verificar si la sesión ha expirado
    const now = new Date();
    const sessionStart = new Date(timer.startTime);
    const sessionEnd = new Date(timer.endTime);

    if (now > sessionEnd) {
      timer.status = 'expired';
      sessionTimers.delete(timerKey);
    }

    // Determinar quién está listo según el rol
    const userReady = userRole === 'user' ? timer.userReady : timer.companionReady;
    const otherPartyReady = userRole === 'user' ? timer.companionReady : timer.userReady;

    console.log(`Consultando estado de listos para sesión ${id}:`, {
      userReady,
      otherPartyReady,
      timer
    });

    return NextResponse.json({
      userReady,
      otherPartyReady,
      bothReady: timer.userReady && timer.companionReady,
      timer: timer,
      sessionExpired: timer.status === 'expired'
    });
  } catch (error) {
    console.error('Error en get ready status endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 