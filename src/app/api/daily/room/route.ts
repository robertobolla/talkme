import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom } from '@/lib/daily';

export async function POST(request: NextRequest) {
  try {
    console.log('Daily room endpoint called');
    const { sessionId, sessionName } = await request.json();
    console.log('Request data:', { sessionId, sessionName });

    if (!sessionId || !sessionName) {
      return NextResponse.json(
        { error: 'sessionId y sessionName son requeridos' },
        { status: 400 }
      );
    }

    console.log('Creating Daily room...');
    // Crear o obtener la sala de Daily
    const roomUrl = await getOrCreateRoom(sessionId, sessionName);
    console.log('Room URL:', roomUrl);

    return NextResponse.json({
      roomUrl,
      sessionId,
      sessionName,
    });
  } catch (error) {
    console.error('Error creating Daily room:', error);
    return NextResponse.json(
      { error: 'Error al crear la sala de video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 