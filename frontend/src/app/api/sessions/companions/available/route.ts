import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(request: NextRequest) {
    try {
        if (!STRAPI_API_TOKEN) {
            console.error('STRAPI_API_TOKEN not configured');
            return NextResponse.json(
                { error: 'Token de API no configurado' },
                { status: 500 }
            );
        }

        const response = await fetch(`${STRAPI_URL}/api/sessions/companions/available`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Strapi error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Available companions from Strapi:', data);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching available companions:', error);
        return NextResponse.json(
            { error: 'Error al obtener acompañantes disponibles' },
            { status: 500 }
        );
    }
} 