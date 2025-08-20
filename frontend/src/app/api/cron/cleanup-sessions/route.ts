import { NextRequest, NextResponse } from 'next/server';

// Endpoint para limpieza automática de sesiones (llamado por cron job)
export async function GET(request: NextRequest) {
    try {
        // Verificar token de autorización para cron jobs
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.CRON_SECRET_TOKEN;

        if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        if (!process.env.STRAPI_URL || !process.env.STRAPI_API_TOKEN) {
            return NextResponse.json(
                { error: 'Configuración del servidor incompleta' },
                { status: 500 }
            );
        }

        const now = new Date();
        let expiredCount = 0;
        let updatedSessions = [];

        // Obtener todas las sesiones activas
        const response = await fetch(`${process.env.STRAPI_URL}/api/sessions?filters[status][$in][0]=confirmed&filters[status][$in][1]=pending&populate=*`, {
            headers: {
                'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Error al obtener sesiones' },
                { status: 500 }
            );
        }

        const data = await response.json();
        const sessions = data.data || [];

        // Verificar cada sesión
        for (const session of sessions) {
            const sessionEnd = new Date(session.attributes.endTime);

            if (now > sessionEnd) {
                // Marcar sesión como expirada
                try {
                    const updateResponse = await fetch(`${process.env.STRAPI_URL}/api/sessions/${session.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
                        },
                        body: JSON.stringify({
                            data: {
                                status: 'expired'
                            }
                        }),
                    });

                    if (updateResponse.ok) {
                        expiredCount++;
                        updatedSessions.push({
                            id: session.id,
                            title: session.attributes.title,
                            endTime: session.attributes.endTime
                        });
                        console.log(`Session ${session.id} marked as expired via cron job`);
                    }
                } catch (error) {
                    console.error(`Error updating session ${session.id}:`, error);
                }
            }
        }

        console.log(`Cron cleanup completed: ${expiredCount} sessions marked as expired`);

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            expiredCount,
            updatedSessions,
            message: `${expiredCount} sesiones marcadas como expiradas`
        });

    } catch (error) {
        console.error('Error in cron cleanup endpoint:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// Endpoint POST para limpieza manual (con autenticación)
export async function POST(request: NextRequest) {
    try {
        if (!process.env.STRAPI_URL || !process.env.STRAPI_API_TOKEN) {
            return NextResponse.json(
                { error: 'Configuración del servidor incompleta' },
                { status: 500 }
            );
        }

        const now = new Date();
        let expiredCount = 0;
        let updatedSessions = [];

        // Obtener todas las sesiones activas
        const response = await fetch(`${process.env.STRAPI_URL}/api/sessions?filters[status][$in][0]=confirmed&filters[status][$in][1]=pending&populate=*`, {
            headers: {
                'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Error al obtener sesiones' },
                { status: 500 }
            );
        }

        const data = await response.json();
        const sessions = data.data || [];

        // Verificar cada sesión
        for (const session of sessions) {
            const sessionEnd = new Date(session.attributes.endTime);

            if (now > sessionEnd) {
                // Marcar sesión como expirada
                try {
                    const updateResponse = await fetch(`${process.env.STRAPI_URL}/api/sessions/${session.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
                        },
                        body: JSON.stringify({
                            data: {
                                status: 'expired'
                            }
                        }),
                    });

                    if (updateResponse.ok) {
                        expiredCount++;
                        updatedSessions.push({
                            id: session.id,
                            title: session.attributes.title,
                            endTime: session.attributes.endTime
                        });
                        console.log(`Session ${session.id} marked as expired manually`);
                    }
                } catch (error) {
                    console.error(`Error updating session ${session.id}:`, error);
                }
            }
        }

        console.log(`Manual cleanup completed: ${expiredCount} sessions marked as expired`);

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            expiredCount,
            updatedSessions,
            message: `${expiredCount} sesiones marcadas como expiradas`
        });

    } catch (error) {
        console.error('Error in manual cleanup endpoint:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
} 