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

        // Obtener los slots de disponibilidad del acompañante
        // Filtrar por relación usando el id del acompañante
        const response = await fetch(`${STRAPI_URL}/api/availability-slots?filters[companion][id][$eq]=${id}&fields[0]=dayOfWeek&fields[1]=startTime&fields[2]=endTime&fields[3]=startDate&fields[4]=endDate&fields[5]=isActive&sort=dayOfWeek:asc,startTime:asc&pagination[pageSize]=200`, {
            headers: {
                'Content-Type': 'application/json',
                ...(STRAPI_API_TOKEN ? { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` } : {}),
            },
        });

        if (!response.ok) {
            console.error('Error obteniendo disponibilidad:', response.status, response.statusText);
            return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: response.status });
        }

        const data = await response.json();
        console.log('Disponibilidad obtenida (raw de Strapi):', JSON.stringify(data));

        // Normalizar la respuesta para devolver un arreglo plano con los atributos esperados por el cliente
        const normalized = Array.isArray(data?.data)
            ? data.data.map((item: any) => {
                const attrs = item.attributes || {};
                return {
                    id: item.id,
                    dayOfWeek: attrs.dayOfWeek ?? attrs.day_of_week ?? attrs.dow ?? item.dayOfWeek ?? item.day_of_week ?? item.dow ?? 0,
                    startTime: attrs.startTime ?? attrs.start_time ?? attrs.start ?? item.startTime ?? item.start_time ?? item.start ?? undefined,
                    endTime: attrs.endTime ?? attrs.end_time ?? attrs.end ?? item.endTime ?? item.end_time ?? item.end ?? undefined,
                    startDate: attrs.startDate ?? attrs.start_date ?? item.startDate ?? item.start_date ?? undefined,
                    endDate: attrs.endDate ?? attrs.end_date ?? item.endDate ?? item.end_date ?? undefined,
                    isActive: attrs.isActive ?? attrs.is_active ?? item.isActive ?? item.is_active ?? true,
                };
            })
            : [];

        console.log('Disponibilidad normalizada (count):', normalized.length);
        if (normalized.length > 0) {
            console.log('Primer slot normalizado:', normalized[0]);
        }

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