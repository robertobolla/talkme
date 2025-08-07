import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    console.log('=== FETCHING USER PROFILES ===');
    console.log('Search params:', searchParams.toString());

    // Construir la URL de Strapi directamente
    const strapiUrl = `${STRAPI_URL}/api/user-profiles?${searchParams.toString()}`;

    console.log('Fetching from Strapi:', strapiUrl);

    const response = await fetch(strapiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Strapi response error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Strapi response success:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return NextResponse.json(
      { error: 'Error al obtener perfiles de usuario', details: error.message },
      { status: 500 }
    );
  }
} 