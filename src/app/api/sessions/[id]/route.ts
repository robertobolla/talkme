import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const sessionId = params.id;

        // Aquí deberías hacer la llamada a tu backend para obtener los datos de la sesión
        // Por ahora, devolvemos datos de ejemplo
        const session = {
            id: parseInt(sessionId),
            title: `Sesión ${sessionId}`,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora después
            duration: 60,
            price: 50,
            sessionType: 'video' as const,
            companion: {
                id: 1,
                fullName: 'María García'
            },
            user: {
                id: 2,
                fullName: 'Juan Pérez'
            }
        };

        return NextResponse.json(session);
    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json(
            { error: 'Error al obtener la sesión' },
            { status: 500 }
        );
    }
} 