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
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in accept session endpoint:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
} 