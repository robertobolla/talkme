import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        console.log('=== GET COMPANION AVAILABILITY ===');
        console.log('Companion ID:', id);

        const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

        if (!STRAPI_API_TOKEN) {
            console.error('STRAPI_API_TOKEN no está configurada');
            return NextResponse.json({ error: 'Error de configuración' }, { status: 500 });
        }

        // Obtener los slots de disponibilidad del acompañante
        // Filtrar por relación usando el id del acompañante
        const response = await fetch(`${STRAPI_URL}/api/availability-slots?filters[companion][id][$eq]=${id}&sort=dayOfWeek:asc,startTime:asc`, {
            headers: {
                'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Error obteniendo disponibilidad:', response.status, response.statusText);
            return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: response.status });
        }

        const data = await response.json();
        console.log('Disponibilidad obtenida:', data);

        // Normalizar la respuesta para devolver un arreglo plano con los atributos esperados por el cliente
        const normalized = Array.isArray(data?.data)
            ? data.data.map((item: any) => ({
                id: item.id,
                dayOfWeek: item.attributes?.dayOfWeek,
                startTime: item.attributes?.startTime,
                endTime: item.attributes?.endTime,
                startDate: item.attributes?.startDate ?? undefined,
                endDate: item.attributes?.endDate ?? undefined,
                isActive: item.attributes?.isActive ?? true,
            }))
            : [];

        return NextResponse.json(normalized);
    } catch (error) {
        console.error('Error en availability API:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: companionId } = await params;
        const body = await request.json();

        console.log('Creating availability slot with data:', {
            ...body,
            companion: companionId
        });

        const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

        const response = await fetch(`${STRAPI_URL}/api/availability-slots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(STRAPI_API_TOKEN ? { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` } : {}),
            },
            body: JSON.stringify({
                data: {
                    ...body,
                    companion: companionId
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Strapi error:', errorData);
            throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('Availability slot created successfully:', data);
        return NextResponse.json(data.data);
    } catch (error) {
        console.error('Error creating availability slot:', error);
        return NextResponse.json(
            {
                error: 'Error al crear horario de disponibilidad',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 