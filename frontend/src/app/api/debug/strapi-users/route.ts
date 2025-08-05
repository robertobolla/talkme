import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Verificando usuarios en Strapi ===');
    
    if (!process.env.STRAPI_URL || !process.env.STRAPI_API_TOKEN) {
      return NextResponse.json({ error: 'Variables de Strapi no configuradas' }, { status: 500 });
    }

    // Obtener todos los perfiles de usuario de Strapi
    const response = await fetch(`${process.env.STRAPI_URL}/api/user-profiles?populate=*`, {
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al obtener usuarios de Strapi:', errorText);
      return NextResponse.json({ error: 'Error al obtener usuarios de Strapi' }, { status: response.status });
    }

    const data = await response.json();
    console.log('Usuarios encontrados en Strapi:', data.data?.length || 0);
    
    // Mostrar información de los usuarios
    const users = data.data?.map((user: any) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    })) || [];

    return NextResponse.json({
      totalUsers: data.data?.length || 0,
      users: users
    });

  } catch (error) {
    console.error('Error en debug strapi-users:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 