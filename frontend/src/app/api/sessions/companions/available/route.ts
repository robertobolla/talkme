import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function GET(request: NextRequest) {
    try {
        console.log('=== FETCHING AVAILABLE COMPANIONS ===');

        // Obtener todos los user-profiles que son companions
        const response = await fetch(`${STRAPI_URL}/api/user-profiles?filters[role][$eq]=companion&populate=*`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Strapi error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Companions from user-profiles:', data);

        // Transformar los datos para que coincidan con el formato esperado
        const companions = data.data?.map((profile: any) => ({
            id: profile.id,
            fullName: profile.fullName,
            hourlyRate: profile.hourlyRate || 0,
            specialties: profile.specialties || [],
            languages: profile.languages || [],
            bio: profile.bio || '',
            averageRating: profile.averageRating || 0,
            isOnline: profile.isOnline || false
        })) || [];

        console.log('Transformed companions:', companions);
        return NextResponse.json(companions);
    } catch (error) {
        console.error('Error fetching available companions:', error);
        return NextResponse.json(
            { error: 'Error al obtener acompañantes disponibles' },
            { status: 500 }
        );
    }
} 