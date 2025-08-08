import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: sessionId } = await params;
        console.log('=== REJECT SESSION ENDPOINT CALLED ===');
        console.log('Session ID:', sessionId);

        console.log('STRAPI_API_TOKEN exists:', !!STRAPI_API_TOKEN);
        console.log('STRAPI_API_TOKEN length:', STRAPI_API_TOKEN?.length);
        console.log('STRAPI_API_TOKEN first 20 chars:', STRAPI_API_TOKEN?.substring(0, 20));

        if (!STRAPI_API_TOKEN) {
            console.error('STRAPI_API_TOKEN not configured');
            return NextResponse.json(
                { error: 'Token de API no configurado' },
                { status: 500 }
            );
        }

        console.log('STRAPI_URL:', STRAPI_URL);
        console.log('Calling Strapi reject endpoint...');

        // Llamar al endpoint de rechazo del backend
        const rejectResponse = await fetch(`${STRAPI_URL}/api/sessions/${sessionId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            },
        });

        console.log('Strapi response status:', rejectResponse.status);

        if (!rejectResponse.ok) {
            const errorData = await rejectResponse.json();
            console.error('Strapi error response:', errorData);
            throw new Error(errorData.error || `HTTP error! status: ${rejectResponse.status}`);
        }

        const successData = await rejectResponse.json();
        console.log('Strapi success response:', successData);

        return NextResponse.json({ message: 'Sesión rechazada exitosamente' });
    } catch (error) {
        console.error('Error rejecting session:', error);
        return NextResponse.json(
            { error: 'Error al rechazar la sesión' },
            { status: 500 }
        );
    }
} 