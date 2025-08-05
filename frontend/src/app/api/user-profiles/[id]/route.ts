import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const profileId = params.id;

    console.log('=== OBTENIENDO PERFIL POR ID ===');
    console.log('Usuario autenticado:', userId);
    console.log('ID del perfil solicitado:', profileId);

    // Obtener perfil desde Strapi
    const response = await fetch(`http://localhost:1337/api/user-profiles/${profileId}?populate=*`);

    if (!response.ok) {
      console.error('Error al obtener perfil de Strapi:', response.status);
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    const data = await response.json();
    console.log('Perfil obtenido de Strapi:', data);

    if (data.data) {
      return NextResponse.json({
        success: true,
        data: data.data
      });
    } else {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error obteniendo perfil por ID:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 