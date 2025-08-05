import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('=== ProfileForm API: Verificando perfil en Strapi ===');
    console.log('ProfileForm API: userId:', userId);

    // Obtener el email del usuario desde Clerk
    const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!clerkResponse.ok) {
      console.log('ProfileForm API: No se pudo obtener información de Clerk');
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    const clerkUser = await clerkResponse.json();
    const userEmail = clerkUser.email_addresses?.[0]?.email_address;

    if (!userEmail) {
      console.log('ProfileForm API: No se encontró email en Clerk');
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    console.log('ProfileForm API: Email del usuario:', userEmail);

    // Buscar perfil por email en lugar de clerkUserId
    const response = await fetch(`http://localhost:1337/api/user-profiles?filters[email][$eq]=${userEmail}&populate=*`);

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const userProfile = data.data[0];
        console.log('ProfileForm API: Perfil encontrado en Strapi:', userProfile.id);
        console.log('ProfileForm API: Rol del perfil:', userProfile.role);
        console.log('ProfileForm API: Nombre del perfil:', userProfile.fullName);

        return NextResponse.json({
          success: true,
          data: userProfile
        });
      }
    }

    console.log('ProfileForm API: No se encontró perfil en Strapi');
    return NextResponse.json({
      success: true,
      data: null
    });

  } catch (error) {
    console.error('Error en profile-form API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const profileData = await request.json();

    console.log('=== ProfileForm API: Guardando perfil en Strapi ===');
    console.log('ProfileForm API: userId:', userId);
    console.log('ProfileForm API: Datos del perfil:', profileData);

    // Asegurar que el clerkUserId esté incluido
    const dataToSave = {
      ...profileData,
      clerkUserId: userId,
    };

    // Guardar perfil directamente en Strapi
    const response = await fetch('http://localhost:1337/api/user-profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: dataToSave }),
    });

    if (response.ok) {
      const savedProfile = await response.json();
      console.log('ProfileForm API: Perfil guardado en Strapi:', savedProfile.data.id);

      return NextResponse.json({
        success: true,
        message: 'Perfil guardado exitosamente',
        data: savedProfile.data
      });
    } else {
      console.error('ProfileForm API: Error al guardar perfil en Strapi');
      return NextResponse.json(
        { error: 'Error al guardar el perfil' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error en profile-form API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 