import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    // Modo debug: si no hay userId, usar uno de prueba
    const clerkUserId = userId || 'test_user_' + Date.now();

    if (!userId) {
      console.log('API Route: Modo debug - usando userId de prueba:', clerkUserId);
    }

    const body = await request.json();
    const { role, fullName, email } = body;

    if (!role || !['client', 'professional'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    console.log('API Route: Enviando solicitud a Strapi:', { role, clerkUserId, fullName, email });

    // Llamar a la API de Strapi directamente
    const strapiResponse = await fetch('http://localhost:1337/api/onboarding/select-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
        clerkUserId,
        fullName,
        email
      }),
    });

    console.log('API Route: Respuesta de Strapi:', strapiResponse.status, strapiResponse.statusText);

    if (!strapiResponse.ok) {
      let errorMessage = 'Error al guardar el rol';

      try {
        const errorData = await strapiResponse.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // Si no se puede parsear como JSON, usar el texto de la respuesta
        const textError = await strapiResponse.text();
        errorMessage = textError || errorMessage;
      }

      console.error('API Route: Error de Strapi:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: strapiResponse.status });
    }

    const data = await strapiResponse.json();
    console.log('API Route: Datos exitosos de Strapi:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in select-role API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 