import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const sessionId = params.id;

        if (!STRAPI_API_TOKEN) {
            return NextResponse.json(
                { error: 'Token de API no configurado' },
                { status: 500 }
            );
        }

        // Llamar al endpoint de rechazo del backend
        const rejectResponse = await fetch(`${STRAPI_URL}/api/sessions/${sessionId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            },
        });

        if (!rejectResponse.ok) {
            const errorData = await rejectResponse.json();
            throw new Error(errorData.error || `HTTP error! status: ${rejectResponse.status}`);
        }

        return NextResponse.json({ message: 'Sesión rechazada exitosamente' });
    } catch (error) {
        console.error('Error rejecting session:', error);
        return NextResponse.json(
            { error: 'Error al rechazar la sesión' },
            { status: 500 }
        );
    }
} 