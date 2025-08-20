import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('=== ACCEPT SESSION ENDPOINT CALLED ===');

    try {
        const { id } = await params;
        console.log('Session ID:', id);

        if (!process.env.STRAPI_URL) {
            console.error('STRAPI_URL not configured');
            return NextResponse.json(
                { error: 'Configuración del servidor incompleta' },
                { status: 500 }
            );
        }

        if (!process.env.STRAPI_API_TOKEN) {
            console.error('STRAPI_API_TOKEN not configured');
            return NextResponse.json(
                { error: 'Token de API no configurado' },
                { status: 500 }
            );
        }

        const url = `${process.env.STRAPI_URL}/api/sessions/${id}/confirm`;
        console.log('Calling Strapi URL:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
            },
        });

        console.log('Strapi response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Strapi error response:', errorText);
            return NextResponse.json(
                { error: 'Error al aceptar la sesión en el servidor' },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('Strapi success response:', data);

        // Crear notificación para el usuario cuando se confirma la sesión
        try {
            // Obtener detalles de la sesión para crear la notificación
            const sessionResponse = await fetch(`${process.env.STRAPI_URL}/api/sessions/${id}?populate=*`, {
                headers: {
                    'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
                },
            });

            if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                const session = sessionData.data;

                if (session && session.attributes) {
                    // Corregir el acceso a los campos user y companion basándome en la estructura real
                    const userId = session.attributes.user?.id;
                    const companionName = session.attributes.companion?.fullName || 'el acompañante';
                    const sessionTitle = session.attributes.title || `Sesión con ${companionName}`;

                    console.log('🔍 Datos de notificación:', {
                        userId,
                        companionName,
                        sessionTitle,
                        sessionAttributes: Object.keys(session.attributes),
                        userObject: session.attributes.user,
                        companionObject: session.attributes.companion
                    });

                    console.log('🔍 Estructura completa de la sesión:', JSON.stringify(session, null, 2));

                    if (userId) {
                        // Crear notificación usando el servicio de notificaciones
                        const notificationPayload = {
                            data: {
                                title: 'Sesión confirmada',
                                message: `${companionName} ha confirmado tu sesión: "${sessionTitle}"`,
                                                                    userId: `user_${userId}`, // Usar el formato correcto: "user_${userId}"
                                status: 'unread'
                            }
                        };

                        console.log('🔍 Payload de notificación a enviar:', JSON.stringify(notificationPayload, null, 2));
                        console.log('🔍 URL de Strapi para notificación:', `${process.env.STRAPI_URL}/api/simple-notifications`);

                        const notificationResponse = await fetch(`${process.env.STRAPI_URL}/api/simple-notifications`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
                            },
                            body: JSON.stringify(notificationPayload)
                        });

                        if (notificationResponse.ok) {
                            const notificationData = await notificationResponse.json();
                            console.log('✅ Notificación creada exitosamente para el usuario:', notificationData);
                        } else {
                            const errorText = await notificationResponse.text();
                            console.error('❌ Error al crear notificación:', notificationResponse.status, errorText);
                            console.error('❌ Headers de respuesta:', Object.fromEntries(notificationResponse.headers.entries()));
                        }
                    } else {
                        console.error('❌ No se pudo obtener el userId de la sesión');
                        console.error('❌ Estructura de user:', session.attributes.user);
                    }
                }
            }
        } catch (notificationError) {
            console.error('❌ Error al crear notificación:', notificationError);
            // No fallar la operación principal si la notificación falla
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in accept session endpoint:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
} 