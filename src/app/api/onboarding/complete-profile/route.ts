import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Almacenamiento temporal de perfiles (en producción esto sería en la base de datos)
const userProfiles = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { role, profileData } = body;

    // Guardar el perfil completado
    userProfiles.set(userId, {
      role,
      ...profileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('Perfil completado para usuario:', userId);
    console.log('Datos guardados:', userProfiles.get(userId));

    return NextResponse.json({
      success: true,
      message: 'Perfil completado exitosamente',
      profile: userProfiles.get(userId)
    });

  } catch (error) {
    console.error('Error completing profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 