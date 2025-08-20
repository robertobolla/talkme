import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
    const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

    console.log('🔍 Testing Strapi connection...');
    console.log('STRAPI_URL:', STRAPI_URL);
    console.log('STRAPI_API_TOKEN exists:', !!STRAPI_API_TOKEN);

    if (!STRAPI_API_TOKEN) {
      return NextResponse.json({ 
        error: 'STRAPI_API_TOKEN no configurado',
        status: 'missing_token'
      }, { status: 500 });
    }

    // Test basic connection to Strapi
    const response = await fetch(`${STRAPI_URL}/api/health`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Strapi response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strapi error response:', errorText);
      
      return NextResponse.json({ 
        error: 'Error conectando con Strapi',
        status: 'strapi_error',
        strapiStatus: response.status,
        strapiError: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Strapi health check successful');

    return NextResponse.json({ 
      success: true, 
      message: 'Conexión con Strapi exitosa',
      strapiData: data
    });

  } catch (error) {
    console.error('❌ Error en test-strapi:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      status: 'internal_error',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 