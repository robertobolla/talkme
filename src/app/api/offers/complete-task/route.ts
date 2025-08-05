import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { canCompleteTask } from '@/lib/dateUtils';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { offerId } = await request.json();

    if (!offerId) {
      return NextResponse.json({ error: 'ID de oferta requerido' }, { status: 400 });
    }

    // Verificar que el usuario es el cliente que creó la oferta
    const userProfileResponse = await fetch(`${process.env.STRAPI_URL}/api/user-profiles?filters[clerkUserId][$eq]=${userId}&populate=*`);
    const userProfileData = await userProfileResponse.json();

    if (!userProfileData.data || userProfileData.data.length === 0) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    const userProfile = userProfileData.data[0];
    if (userProfile.role !== 'client') {
      return NextResponse.json({ error: 'Solo clientes pueden completar tareas' }, { status: 403 });
    }

    // Obtener la oferta
    const offerResponse = await fetch(`${process.env.STRAPI_URL}/api/ofertas/${offerId}?populate=client,professional`);
    const offerData = await offerResponse.json();

    if (!offerData.data) {
      return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 });
    }

    const offer = offerData.data;

    // Verificar que el cliente es el propietario de la oferta
    if (offer.client?.id !== userProfile.id) {
      return NextResponse.json({ error: 'Solo puedes completar tus propias tareas' }, { status: 403 });
    }

    // Verificar que la oferta está aceptada
    if (offer.status !== 'accepted') {
      return NextResponse.json({ error: 'Solo se pueden completar tareas aceptadas' }, { status: 400 });
    }

    // Verificar que ha pasado el tiempo de la tarea
    if (!canCompleteTask(offer.dateTime, offer.duration)) {
      return NextResponse.json({
        error: 'La tarea aún no puede ser completada. Debe esperar hasta que termine el tiempo programado.'
      }, { status: 400 });
    }

    // Calcular el monto a acreditar
    const professional = offer.professional;
    if (!professional) {
      return NextResponse.json({ error: 'No hay profesional asignado' }, { status: 400 });
    }

    const totalAmount = professional.hourlyRate * offer.duration;

    // Marcar la oferta como completada
    const updateResponse = await fetch(`${process.env.STRAPI_URL}/api/ofertas/${offerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`
      },
      body: JSON.stringify({
        data: {
          status: 'completed',
          paymentCompleted: true
        }
      })
    });

    if (!updateResponse.ok) {
      return NextResponse.json({ error: 'Error al actualizar la oferta' }, { status: 500 });
    }

    // Actualizar las estadísticas del profesional
    const professionalResponse = await fetch(`${process.env.STRAPI_URL}/api/user-profiles/${professional.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`
      },
      body: JSON.stringify({
        data: {
          totalHoursWorked: (professional.totalHoursWorked || 0) + offer.duration,
          // Aquí podrías agregar lógica para actualizar ingresos totales
        }
      })
    });

    return NextResponse.json({
      message: 'Tarea completada exitosamente',
      amount: totalAmount,
      professional: {
        id: professional.id,
        name: professional.fullName,
        hourlyRate: professional.hourlyRate
      }
    });

  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 