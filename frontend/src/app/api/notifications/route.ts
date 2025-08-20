import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/notifications - Iniciando...');

    // Intentar obtener el userId de Clerk (App Router: sync)
    const { userId: clerkUserId } = auth();
    console.log('User ID from Clerk:', clerkUserId);

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const queryUserProfileId = searchParams.get('userProfileId');

    console.log('📋 Parámetros de búsqueda:', { page, limit });

    const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
    const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

    if (!STRAPI_API_TOKEN) {
      console.error('❌ STRAPI_API_TOKEN no está configurado');
      return NextResponse.json({
        error: 'Error de configuración del servidor',
        details: 'STRAPI_API_TOKEN faltante'
      }, { status: 500 });
    }

    // Resolver userProfileId: preferir Clerk; si no hay, usar query param (fallback dev)
    let userProfileId: number | null = null;
    if (clerkUserId) {
      console.log('🔍 Buscando perfil del usuario por Clerk userId...');
      const profileResponse = await fetch(`${STRAPI_URL}/api/user-profiles?filters[clerkUserId][$eq]=${clerkUserId}&populate=*`, {
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!profileResponse.ok) {
        console.error('❌ Error obteniendo perfil del usuario:', profileResponse.status);
        return NextResponse.json({
          error: 'Error al obtener perfil del usuario',
          details: 'No se pudo obtener el perfil para buscar notificaciones'
        }, { status: profileResponse.status });
      }

      const profileData = await profileResponse.json();
      console.log('📊 Datos del perfil:', profileData);

      if (!profileData.data || profileData.data.length === 0) {
        console.log('❌ No se encontró perfil para el usuario');
        return NextResponse.json({
          data: [],
          meta: { pagination: { page: 1, pageSize: limit, pageCount: 1, total: 0 } }
        });
      }

      userProfileId = profileData.data[0].id;
    } else if (queryUserProfileId && !Number.isNaN(Number(queryUserProfileId))) {
      // Fallback: usar userProfileId desde query (solo dev)
      userProfileId = Number(queryUserProfileId);
      console.log('⚠️ Clerk no disponible. Usando userProfileId de query:', userProfileId);
    } else {
      console.log('❌ No autorizado - Clerk userId y userProfileId ausentes');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('🔍 Buscando notificaciones para userId:', userProfileId);

    // Obtener notificaciones del usuario, ordenadas por fecha de creación (más recientes primero)
    // Incluir populate=* para consistencia de estructura
    // Las notificaciones se crean con userId: "user_${userProfileId}", así que buscamos por ese formato
    const searchUrl = `${STRAPI_URL}/api/simple-notifications?filters[userId][$eq]=user_${userProfileId}&sort=createdAt:desc&pagination[page]=${page}&pagination[pageSize]=${limit}&populate=*`;
    console.log('🔍 URL de búsqueda:', searchUrl);

    const notificationsResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Respuesta de notificaciones simples:', notificationsResponse.status, notificationsResponse.statusText);

    if (!notificationsResponse.ok) {
      const errorText = await notificationsResponse.text();
      console.error('❌ Error de Strapi:', notificationsResponse.status, errorText);
      return NextResponse.json({
        error: 'Error al obtener notificaciones',
        details: errorText
      }, { status: notificationsResponse.status });
    }

    const data = await notificationsResponse.json();
    console.log('✅ Notificaciones simples obtenidas exitosamente:', data.data?.length || 0);

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error en notifications endpoint:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/notifications - Iniciando...');

    const { userId } = await auth();
    console.log('User ID from Clerk:', userId);

    if (!userId) {
      console.log('❌ No autorizado - userId no encontrado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 Body recibido:', body);

    const { recipientId, title, message } = body;

    if (!recipientId || !title || !message) {
      console.error('❌ Campos requeridos faltantes:', { recipientId, title, message });
      return NextResponse.json({
        error: 'Campos requeridos faltantes',
        details: 'recipientId, title y message son obligatorios'
      }, { status: 400 });
    }

    const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
    const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

    if (!STRAPI_API_TOKEN) {
      console.error('❌ STRAPI_API_TOKEN no está configurado');
      return NextResponse.json({
        error: 'Error de configuración del servidor',
        details: 'STRAPI_API_TOKEN faltante'
      }, { status: 500 });
    }

    // Crear notificación en Strapi
    const notificationData = {
      data: {
        title,
        message,
        userId: `user_${recipientId}`, // Usar el formato correcto: "user_${recipientId}"
        status: 'unread'
        // Removidos: type y priority (no existen en el schema)
      }
    };

    console.log('🚀 Creando notificación en Strapi:', notificationData);

    const response = await fetch(`${STRAPI_URL}/api/simple-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error creando notificación en Strapi:', response.status, errorText);
      return NextResponse.json({
        error: 'Error al crear notificación',
        details: errorText
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Notificación creada exitosamente:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error en POST notifications endpoint:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 