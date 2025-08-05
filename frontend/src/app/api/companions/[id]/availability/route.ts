import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const companionId = params.id;

        const response = await fetch(`${STRAPI_URL}/api/availability-slots?filters[companion][$eq]=${companionId}&sort=dayOfWeek:asc,startTime:asc`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data.data || []);
    } catch (error) {
        console.error('Error fetching availability:', error);
        return NextResponse.json(
            { error: 'Error al obtener disponibilidad' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const companionId = params.id;
        const body = await request.json();

        console.log('Creating availability slot with data:', {
            ...body,
            companion: companionId
        });

        const response = await fetch(`${STRAPI_URL}/api/availability-slots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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