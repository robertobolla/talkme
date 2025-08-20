import { NextRequest, NextResponse } from 'next/server';

// Endpoint para limpiar sesiones expiradas
export async function POST(request: NextRequest) {
    try {
        if (!process.env.STRAPI_URL || !process.env.STRAPI_API_TOKEN) {
            return NextResponse.json(
                { error: 'Configuración del servidor incompleta' },
                { status: 500 }
            );
        }

        const now = new Date();
        const oneHourAgo = now.getTime() - (60 * 60 * 1000);

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
        let expiredCount = 0;

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
                        console.log(`Session ${session.id} marked as expired`);
                    }
                } catch (error) {
                    console.error(`Error updating session ${session.id}:`, error);
                }
            }
        }

        console.log(`Cleanup completed: ${expiredCount} sessions marked as expired`);

        return NextResponse.json({
            success: true,
            expiredCount,
            message: `${expiredCount} sesiones marcadas como expiradas`
        });

    } catch (error) {
        console.error('Error in cleanup endpoint:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// Endpoint GET para verificar el estado de limpieza
export async function GET() {
    try {
        if (!process.env.STRAPI_URL || !process.env.STRAPI_API_TOKEN) {
            return NextResponse.json(
                { error: 'Configuración del servidor incompleta' },
                { status: 500 }
            );
        }

        const now = new Date();

        // Obtener sesiones que están por expirar (en los próximos 5 minutos)
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        const response = await fetch(`${process.env.STRAPI_URL}/api/sessions?filters[endTime][$lte]=${fiveMinutesFromNow.toISOString()}&filters[status][$in][0]=confirmed&filters[status][$in][1]=pending&populate=*`, {
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

        return NextResponse.json({
            success: true,
            sessionsExpiringSoon: sessions.length,
            sessions: sessions.map((session: any) => ({
                id: session.id,
                title: session.attributes.title,
                endTime: session.attributes.endTime,
                status: session.attributes.status,
                timeUntilExpiry: new Date(session.attributes.endTime).getTime() - now.getTime()
            }))
        });

    } catch (error) {
        console.error('Error in cleanup status endpoint:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
} 