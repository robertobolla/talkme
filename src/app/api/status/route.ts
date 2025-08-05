import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

    // Verificar conexión con Strapi
    const strapiResponse = await fetch(`${strapiUrl}/admin`);
    const strapiStatus = strapiResponse.ok ? 'connected' : 'disconnected';

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        strapi: strapiStatus,
        clerk: 'configured'
      },
      environment: {
        strapiUrl,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Error checking services',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 