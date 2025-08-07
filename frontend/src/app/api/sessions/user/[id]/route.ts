import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log('=== FETCHING USER SESSIONS ===');
        console.log('User ID:', params.id);

        // Usar la ruta estándar de Strapi con filtros
        const response = await fetch(
            `${STRAPI_URL}/api/sessions?filters%5Buser%5D%5Bid%5D=${params.id}&populate=companion`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Strapi error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Sessions from Strapi:', data);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching user sessions:', error);
        return NextResponse.json(
            { error: 'Error al obtener sesiones del usuario' },
            { status: 500 }
        );
    }
} 