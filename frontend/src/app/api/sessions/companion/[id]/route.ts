import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        console.log('=== GET COMPANION SESSIONS ===');
        console.log('Companion ID:', id);

        const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

        const response = await fetch(`${STRAPI_URL}/api/sessions?filters[companion][$eq]=${id}&populate=user&sort=createdAt:desc`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Error obteniendo sesiones del acompañante:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response body:', errorText);
            return NextResponse.json({ error: 'Error al obtener las sesiones del acompañante' }, { status: response.status });
        }

        const data = await response.json();
        console.log('Sesiones del acompañante obtenidas:', data);
        // Devolver en el formato que espera el dashboard
        return NextResponse.json({ data: data.data || [] });
    } catch (error) {
        console.error('Error fetching companion sessions:', error);
        return NextResponse.json(
            { error: 'Error al obtener las sesiones del acompañante' },
            { status: 500 }
        );
    }
} 