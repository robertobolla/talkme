import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    console.log('=== GET REAL AVAILABILITY ===');
    console.log('Companion ID:', id);
    console.log('Date:', date);

    if (!date) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 });
    }

    const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
    const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

    if (!STRAPI_API_TOKEN) {
      console.error('STRAPI_API_TOKEN no está configurada');
      return NextResponse.json({ error: 'Error de configuración' }, { status: 500 });
    }

    // Obtener los slots de disponibilidad del acompañante
    const availabilityResponse = await fetch(`${STRAPI_URL}/api/availability-slots?filters[companion][id][$eq]=${id}&sort=dayOfWeek:asc,startTime:asc`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!availabilityResponse.ok) {
      console.error('Error obteniendo slots de disponibilidad:', availabilityResponse.status);
      // Devolver éxito con listas vacías para evitar 404/errores en el cliente
      return NextResponse.json({ availability: [], confirmedSessions: [] }, { status: 200 });
    }

    const availabilityData = await availabilityResponse.json();
    const availabilitySlots = Array.isArray(availabilityData?.data)
      ? availabilityData.data.map((item: any) => ({
          id: item.id,
          dayOfWeek: item.attributes?.dayOfWeek,
          startTime: item.attributes?.startTime,
          endTime: item.attributes?.endTime,
          startDate: item.attributes?.startDate ?? undefined,
          endDate: item.attributes?.endDate ?? undefined,
          isActive: item.attributes?.isActive ?? true,
        }))
      : [];

    console.log('Slots de disponibilidad (normalizados):', availabilitySlots);

    // Obtener sesiones confirmadas para la fecha
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sessionsResponse = await fetch(`${STRAPI_URL}/api/sessions?filters[companion][id][$eq]=${id}&filters[status][$in][0]=confirmed&filters[status][$in][1]=in_progress&filters[startTime][$gte]=${startOfDay.toISOString()}&filters[endTime][$lte]=${endOfDay.toISOString()}`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!sessionsResponse.ok) {
      console.error('Error obteniendo sesiones:', sessionsResponse.status);
      // Devolver éxito con listas vacías para evitar 404/errores en el cliente
      return NextResponse.json({ availability: [], confirmedSessions: [] }, { status: 200 });
    }

    const sessionsData = await sessionsResponse.json();
    const confirmedSessions = Array.isArray(sessionsData?.data)
      ? sessionsData.data.map((item: any) => ({
          id: item.id,
          startTime: item.attributes?.startTime,
          endTime: item.attributes?.endTime,
          status: item.attributes?.status,
        }))
      : [];

    console.log('Sesiones confirmadas (normalizadas):', confirmedSessions);

    // Filtrar slots disponibles excluyendo sesiones confirmadas
    const dayOfWeek = new Date(date).getDay();
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    const availableSlots = availabilitySlots.filter((slot: any) => {
      console.log('Analizando slot:', slot);

      // Verificar si el slot está activo
      if (!slot.isActive) {
        console.log('Slot no está activo');
        return false;
      }

      let isSlotAvailable = false;

      if (slot.startDate && slot.endDate) {
        // Si tiene fechas específicas
        const slotStart = new Date(slot.startDate);
        const slotEnd = new Date(slot.endDate);

        // Normalizar las fechas para comparar solo la fecha (sin hora)
        const slotStartDate = new Date(slotStart.getFullYear(), slotStart.getMonth(), slotStart.getDate());
        const slotEndDate = new Date(slotEnd.getFullYear(), slotEnd.getMonth(), slotEnd.getDate());

        isSlotAvailable = searchDate >= slotStartDate && searchDate <= slotEndDate;
        console.log('Fechas específicas - Inicio:', slot.startDate, 'Fin:', slot.endDate, 'Disponible:', isSlotAvailable);
      } else {
        // Si usa día de la semana
        isSlotAvailable = slot.dayOfWeek === dayOfWeek;
        console.log('Día de semana - Día del slot:', slot.dayOfWeek, 'Día buscado:', dayOfWeek, 'Disponible:', isSlotAvailable);
      }

      if (!isSlotAvailable) {
        return false;
      }

      // Verificar si hay sesiones confirmadas que se superponen con este slot
      const slotStart = new Date(`2000-01-01T${slot.startTime}`);
      const slotEnd = new Date(`2000-01-01T${slot.endTime}`);

      const hasConflict = confirmedSessions.some((session: any) => {
        const sessionStart = new Date(session.startTime);
        const sessionEnd = new Date(session.endTime);

        // Convertir a tiempo del día para comparar
        const sessionStartTime = new Date(`2000-01-01T${sessionStart.toTimeString().slice(0, 8)}`);
        const sessionEndTime = new Date(`2000-01-01T${sessionEnd.toTimeString().slice(0, 8)}`);

        // Verificar si hay superposición
        return sessionStartTime < slotEnd && sessionEndTime > slotStart;
      });

      console.log('Slot tiene conflicto:', hasConflict);
      return !hasConflict;
    });

    console.log('Slots disponibles filtrados:', availableSlots);

    return NextResponse.json({
      availability: availableSlots,
      confirmedSessions: confirmedSessions
    });
  } catch (err) {
    console.error('Fallo en real-availability:', err);
    // Devolver éxito con listas vacías para evitar romper el cliente
    return NextResponse.json({ availability: [], confirmedSessions: [] }, { status: 200 });
  }
} 