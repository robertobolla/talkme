import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/test-simple-notifications - Iniciando...');
    
    const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
    const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

    console.log('🔗 Configuración Strapi:', { 
      STRAPI_URL, 
      hasToken: !!STRAPI_API_TOKEN 
    });

    if (!STRAPI_API_TOKEN) {
      console.error('❌ STRAPI_API_TOKEN no está configurado');
      return NextResponse.json({ 
        error: 'Error de configuración del servidor',
        details: 'STRAPI_API_TOKEN faltante'
      }, { status: 500 });
    }

    // Test 1: Verificar que Strapi responda
    console.log('🔍 Test 1: Verificando respuesta de Strapi...');
    
    try {
      const healthResponse = await fetch(`${STRAPI_URL}/api/health`, {
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📊 Health response:', healthResponse.status, healthResponse.statusText);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Health check exitoso:', healthData);
      } else {
        console.log('⚠️ Health check falló, pero continuamos...');
      }
    } catch (healthError) {
      console.log('⚠️ Error en health check, pero continuamos:', healthError);
    }

    // Test 2: Verificar si el nuevo modelo simple-notifications existe
    console.log('🔍 Test 2: Verificando modelo simple-notifications...');
    
    try {
      const simpleNotificationsResponse = await fetch(`${STRAPI_URL}/api/simple-notifications`, {
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📊 Simple-notifications response:', simpleNotificationsResponse.status, simpleNotificationsResponse.statusText);
      
      if (simpleNotificationsResponse.ok) {
        const simpleNotificationsData = await simpleNotificationsResponse.json();
        console.log('✅ Modelo simple-notifications disponible:', simpleNotificationsData);
      } else {
        const errorText = await simpleNotificationsResponse.text();
        console.error('❌ Error en modelo simple-notifications:', errorText);
        
        return NextResponse.json({ 
          error: 'Modelo simple-notifications no disponible',
          details: errorText,
          status: 'model_not_found'
        }, { status: 404 });
      }
    } catch (simpleNotificationsError) {
      console.error('❌ Error accediendo a simple-notifications:', simpleNotificationsError);
      
      return NextResponse.json({ 
        error: 'Error accediendo a simple-notifications',
        details: simpleNotificationsError instanceof Error ? simpleNotificationsError.message : 'Error desconocido',
        status: 'access_error'
      }, { status: 500 });
    }

    // Test 3: Verificar user-profiles
    console.log('🔍 Test 3: Verificando modelo de user-profiles...');
    
    try {
      const profilesResponse = await fetch(`${STRAPI_URL}/api/user-profiles?pagination[pageSize]=1`, {
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📊 User-profiles response:', profilesResponse.status, profilesResponse.statusText);
      
      if (profilesResponse.ok) {
        const profilesData = await profilesResponse.json();
        console.log('✅ Modelo de user-profiles disponible:', profilesData);
      } else {
        const errorText = await profilesResponse.text();
        console.error('❌ Error en modelo de user-profiles:', errorText);
      }
    } catch (profilesError) {
      console.error('❌ Error accediendo a user-profiles:', profilesError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tests completados',
      status: 'all_tests_passed'
    });

  } catch (error) {
    console.error('❌ Error en test-simple-notifications:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      status: 'internal_error'
    }, { status: 500 });
  }
} 