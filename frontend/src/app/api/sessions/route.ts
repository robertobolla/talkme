import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetch(`${STRAPI_URL}/api/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating session:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al crear la sesión' },
            { status: 500 }
        );
    }
} 