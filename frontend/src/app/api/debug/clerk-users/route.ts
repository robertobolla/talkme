import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Verificando cuentas de Clerk ===');
    
    if (!process.env.CLERK_SECRET_KEY) {
      return NextResponse.json({ error: 'CLERK_SECRET_KEY no configurada' }, { status: 500 });
    }

    // Obtener lista de usuarios de Clerk
    const response = await fetch('https://api.clerk.com/v1/users', {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al obtener usuarios de Clerk:', errorText);
      return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: response.status });
    }

    const users = await response.json();
    console.log('Usuarios encontrados:', users.data?.length || 0);
    
    // Mostrar solo emails para privacidad
    const userEmails = users.data?.map((user: any) => ({
      id: user.id,
      email: user.email_addresses?.[0]?.email_address,
      createdAt: user.created_at
    })) || [];

    return NextResponse.json({
      totalUsers: users.data?.length || 0,
      users: userEmails
    });

  } catch (error) {
    console.error('Error en debug clerk-users:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 