import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Simular creación de oferta por ahora
    const newOffer = {
      id: Date.now(),
      attributes: {
        title: body.title,
        description: body.description,
        location: body.location,
        dateTime: body.dateTime,
        duration: body.duration,
        hourlyRate: body.hourlyRate,
        specialRequirements: body.specialRequirements || '',
        urgency: body.urgency,
        status: 'published',
        createdAt: new Date().toISOString()
      }
    };
    
    return NextResponse.json({
      success: true,
      data: newOffer
    });

  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 