import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: profileId } = await params;

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: profileId } = await params;
    const body = await request.json();

    console.log('=== ACTUALIZANDO PERFIL ===');
    console.log('Usuario autenticado:', userId);
    console.log('ID del perfil a actualizar:', profileId);
    console.log('Datos a actualizar:', body);

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

    // Actualizar perfil en Strapi
    const response = await fetch(`${process.env.STRAPI_URL}/api/user-profiles/${profileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        data: body
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al actualizar perfil en Strapi:', response.status, errorText);
      return NextResponse.json(
        { error: 'Error al actualizar perfil en el servidor' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Perfil actualizado exitosamente:', data);

    return NextResponse.json({
      success: true,
      data: data.data,
      message: 'Perfil actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 