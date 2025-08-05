import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('=== Debug Clerk User ===');
    console.log('Current userId:', userId);

    // Verificar si el usuario existe en Strapi
    const strapiResponse = await fetch(`http://localhost:1337/api/user-profiles?filters[clerkUserId][$eq]=${userId}&populate=*`);

    if (strapiResponse.ok) {
      const strapiData = await strapiResponse.json();
      console.log('Strapi data:', strapiData);

      if (strapiData.data && strapiData.data.length > 0) {
        const userProfile = strapiData.data[0];
        return NextResponse.json({
          success: true,
          message: 'Usuario encontrado en Strapi',
          userId,
          userProfile
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Usuario no encontrado en Strapi',
          userId
        });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Error al consultar Strapi',
      userId
    });

  } catch (error) {
    console.error('Error en debug-clerk-user API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 