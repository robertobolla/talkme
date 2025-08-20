import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== MARK NOTIFICATIONS AS READ ENDPOINT CALLED ===');

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds } = body; // Array de IDs de notificaciones a marcar como leídas

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'IDs de notificaciones requeridos' }, { status: 400 });
    }

    if (!process.env.STRAPI_URL || !process.env.STRAPI_API_TOKEN) {
      return NextResponse.json({ error: 'Configuración del servidor incompleta' }, { status: 500 });
    }

    const STRAPI_URL = process.env.STRAPI_URL;
    const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

    // Marcar cada notificación como leída
    const results = [];
    for (const notificationId of notificationIds) {
      try {
        const response = await fetch(`${STRAPI_URL}/api/simple-notifications/${notificationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
          },
          body: JSON.stringify({
            data: {
              status: 'read'
            }
          }),
        });

        if (response.ok) {
          results.push({ id: notificationId, status: 'success' });
          console.log(`✅ Notificación ${notificationId} marcada como leída`);
        } else {
          const errorText = await response.text();
          results.push({ id: notificationId, status: 'error', error: errorText });
          console.error(`❌ Error marcando notificación ${notificationId}:`, errorText);
        }
      } catch (error) {
        results.push({ id: notificationId, status: 'error', error: error.message });
        console.error(`❌ Exception marcando notificación ${notificationId}:`, error);
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`📊 Resultado: ${successCount} exitosas, ${errorCount} con error`);

    return NextResponse.json({
      message: 'Proceso completado',
      results,
      summary: {
        total: notificationIds.length,
        success: successCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('❌ Error en mark-read endpoint:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 