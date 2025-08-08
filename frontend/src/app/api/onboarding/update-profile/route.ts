import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';



export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { role, profileData } = body;

    console.log('=== ACTUALIZANDO PERFIL EN STRAPI ===');
    console.log('Usuario ID:', userId);
    console.log('Rol:', role);
    console.log('Datos recibidos:', profileData);
    console.log('Tarifa por hora:', profileData.hourlyRate);
    console.log('Tipo de tarifa por hora:', typeof profileData.hourlyRate);

    // Buscar el perfil existente en Strapi
    const searchResponse = await fetch(`http://localhost:1337/api/user-profiles?filters[clerkUserId][$eq]=${userId}`);

    if (!searchResponse.ok) {
      throw new Error('Error al buscar perfil en Strapi');
    }

    const searchData = await searchResponse.json();
    let profileId = null;

    if (searchData.data && searchData.data.length > 0) {
      // Perfil existe, actualizarlo
      profileId = searchData.data[0].id;
      console.log('Perfil encontrado, actualizando ID:', profileId);

      const updateResponse = await fetch(`http://localhost:1337/api/user-profiles/${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            fullName: profileData.fullName,
            email: profileData.email,
            phone: profileData.phone,
            address: profileData.address,
            bio: profileData.bio,
            hourlyRate: profileData.hourlyRate,
            skills: profileData.skills,
            workZones: profileData.workZones,
            emergencyContact: profileData.emergencyContact,
            dateOfBirth: profileData.dateOfBirth,
            timezone: profileData.timezone,
            interests: profileData.interests,
            languages: profileData.languages,
            profilePhoto: profileData.profilePhoto
          }
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Error al actualizar perfil en Strapi');
      }

      const updatedProfile = await updateResponse.json();
      console.log('Perfil actualizado exitosamente en Strapi');

      return NextResponse.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        profile: updatedProfile.data
      });

    } else {
      // Perfil no existe, crearlo
      console.log('Perfil no encontrado, creando nuevo perfil');

      const createResponse = await fetch('http://localhost:1337/api/user-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            clerkUserId: userId,
            role: role,
            fullName: profileData.fullName,
            email: profileData.email,
            phone: profileData.phone,
            address: profileData.address,
            bio: profileData.bio,
            hourlyRate: profileData.hourlyRate,
            skills: profileData.skills,
            workZones: profileData.workZones,
            emergencyContact: profileData.emergencyContact,
            dateOfBirth: profileData.dateOfBirth,
            timezone: profileData.timezone,
            interests: profileData.interests,
            languages: profileData.languages,
            profilePhoto: profileData.profilePhoto,
            status: 'approved'
          }
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Error al crear perfil en Strapi');
      }

      const newProfile = await createResponse.json();
      console.log('Perfil creado exitosamente en Strapi');

      return NextResponse.json({
        success: true,
        message: 'Perfil creado exitosamente',
        profile: newProfile.data
      });
    }

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para obtener el perfil actual desde Strapi
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('=== OBTENIENDO PERFIL DESDE STRAPI ===');
    console.log('Usuario ID:', userId);

    // Buscar perfil en Strapi
    const response = await fetch(`http://localhost:1337/api/user-profiles?filters[clerkUserId][$eq]=${userId}&populate=*`);

    if (!response.ok) {
      throw new Error('Error al buscar perfil en Strapi');
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const profile = data.data[0];
      console.log('Perfil encontrado en Strapi:', profile.id);

      return NextResponse.json({
        success: true,
        profile
      });
    } else {
      console.log('Perfil no encontrado en Strapi');
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

  } catch (error) {
    console.error('Error getting profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 