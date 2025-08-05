import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Intentar conectar con el backend
        let backendStatus = 'unknown';
        try {
            const response = await fetch('http://localhost:1337/api/onboarding/public-status');
            backendStatus = response.ok ? 'connected' : `error_${response.status}`;
        } catch (error) {
            backendStatus = 'connection_failed';
        }

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                frontend: 'running',
                backend: backendStatus,
                environment: process.env.NODE_ENV,
                strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337'
            }
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
} 