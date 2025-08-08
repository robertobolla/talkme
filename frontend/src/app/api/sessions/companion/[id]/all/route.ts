import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companionId } = await params;

    const response = await fetch(`${STRAPI_URL}/api/sessions?filters[companion][$eq]=${companionId}&populate=user&sort=createdAt:desc`, {
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
    console.error('Error fetching companion sessions:', error);
    return NextResponse.json(
      { error: 'Error al obtener sesiones del acompañante' },
      { status: 500 }
    );
  }
} 