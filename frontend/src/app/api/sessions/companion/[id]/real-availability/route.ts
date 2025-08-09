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

    // Helper: parsear YYYY-MM-DD como fecha local (evita desfasajes por UTC)
    const parseLocalDate = (dateString: string) => {
      const [y, m, d] = dateString.split('-').map(Number);
      return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
    };

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
      ? availabilityData.data.map((item: any) => {
        const attrs = item.attributes || {};
        let startDate = attrs.startDate ?? attrs.start_date ?? attrs.start ?? item.startDate ?? item.start_date ?? item.start ?? undefined;
        let endDate = attrs.endDate ?? attrs.end_date ?? attrs.end ?? item.endDate ?? item.end_date ?? item.end ?? undefined;
        // Si hay una sola fecha, úsala como inicio y fin
        if (startDate && !endDate) endDate = startDate;
        if (!startDate && endDate) startDate = endDate;
        return {
          id: item.id,
          dayOfWeek: attrs.dayOfWeek ?? attrs.day_of_week ?? attrs.dow ?? item.dayOfWeek ?? item.day_of_week ?? item.dow ?? 0,
          startTime: attrs.startTime ?? attrs.start_time ?? attrs.start ?? item.startTime ?? item.start_time ?? item.start ?? undefined,
          endTime: attrs.endTime ?? attrs.end_time ?? attrs.end ?? item.endTime ?? item.end_time ?? item.end ?? undefined,
          startDate,
          endDate,
          isActive: attrs.isActive ?? attrs.is_active ?? attrs.active ?? item.isActive ?? item.is_active ?? true,
        };
      })
      : [];

    console.log('Slots de disponibilidad (normalizados):', availabilitySlots);

    // Obtener sesiones confirmadas para la fecha
    const searchLocalDate = parseLocalDate(date);
    const startOfDay = new Date(searchLocalDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchLocalDate);
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
    console.log('Sesiones confirmadas (raw):', JSON.stringify(sessionsData));
    const confirmedSessions = Array.isArray(sessionsData?.data)
      ? sessionsData.data.map((item: any) => {
        const attrs = item.attributes || {};
        return {
          id: item.id,
          startTime: attrs.startTime ?? attrs.start_time ?? attrs.start ?? item.startTime ?? item.start_time ?? item.start ?? undefined,
          endTime: attrs.endTime ?? attrs.end_time ?? attrs.end ?? item.endTime ?? item.end_time ?? item.end ?? undefined,
          status: attrs.status ?? item.status,
        };
      })
      : [];

    console.log('Sesiones confirmadas (normalizadas):', confirmedSessions);

    // Helpers para trabajar con minutos del día
    const toMinutes = (timeStr: string): number => {
      // Soporta HH:mm, HH:mm:ss, HH:mm:ss.SSS
      const parts = timeStr.split(':');
      const hh = parseInt(parts[0] || '0', 10);
      const mm = parseInt(parts[1] || '0', 10);
      return hh * 60 + mm;
    };

    const minutesToTime = (mins: number): string => {
      const clamped = Math.max(0, Math.min(24 * 60, Math.round(mins)));
      const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
      const mm = String(clamped % 60).padStart(2, '0');
      return `${hh}:${mm}:00.000`;
    };

    // Convertir sesiones confirmadas a intervalos [startMin, endMin]
    const busyIntervals: Array<{ start: number; end: number }> = confirmedSessions
      .map((s: any) => {
        if (!s?.startTime || !s?.endTime) return null;
        const sStart = new Date(s.startTime);
        const sEnd = new Date(s.endTime);
        const start = sStart.getHours() * 60 + sStart.getMinutes();
        const end = sEnd.getHours() * 60 + sEnd.getMinutes();
        return { start, end };
      })
      .filter(Boolean) as Array<{ start: number; end: number }>;

    // Normalizar y ordenar intervalos ocupados
    busyIntervals.sort((a, b) => a.start - b.start);

    const dayOfWeek = searchLocalDate.getDay();
    const searchDate = new Date(searchLocalDate);
    searchDate.setHours(0, 0, 0, 0);

    // Para cada slot aplicable, devolver segmentos libres después de restar sesiones ocupadas
    const freeSegments: Array<{ startTime: string; endTime: string; isActive: boolean; slotId: number }> = [];

    for (const slot of availabilitySlots) {
      if (!slot?.isActive) continue;

      let applies = false;
      if (slot.startDate && slot.endDate) {
        const slotStartDate = parseLocalDate(slot.startDate);
        const slotEndDate = parseLocalDate(slot.endDate);
        applies = searchDate >= slotStartDate && searchDate <= slotEndDate;
      } else {
        applies = slot.dayOfWeek === dayOfWeek;
      }
      if (!applies) continue;

      if (!slot.startTime || !slot.endTime) continue;

      let segments: Array<{ start: number; end: number }> = [{
        start: toMinutes(slot.startTime),
        end: toMinutes(slot.endTime)
      }];

      // Restar cada intervalo ocupado de las sesiones confirmadas
      for (const busy of busyIntervals) {
        const nextSegments: Array<{ start: number; end: number }> = [];
        for (const seg of segments) {
          const overlapStart = Math.max(seg.start, busy.start);
          const overlapEnd = Math.min(seg.end, busy.end);
          const overlaps = overlapStart < overlapEnd;
          if (!overlaps) {
            nextSegments.push(seg);
          } else {
            // Parte izquierda libre
            if (seg.start < overlapStart) {
              nextSegments.push({ start: seg.start, end: overlapStart });
            }
            // Parte derecha libre
            if (overlapEnd < seg.end) {
              nextSegments.push({ start: overlapEnd, end: seg.end });
            }
          }
        }
        segments = nextSegments;
        if (segments.length === 0) break;
      }

      // Convertir segmentos a objetos con horas
      for (const seg of segments) {
        if (seg.end - seg.start >= 5) { // al menos 5 minutos
          freeSegments.push({
            startTime: minutesToTime(seg.start),
            endTime: minutesToTime(seg.end),
            isActive: true,
            slotId: slot.id,
          });
        }
      }
    }

    return NextResponse.json({
      availability: freeSegments,
      confirmedSessions: confirmedSessions,
    });
  } catch (err) {
    console.error('Fallo en real-availability:', err);
    // Devolver éxito con listas vacías para evitar romper el cliente
    return NextResponse.json({ availability: [], confirmedSessions: [] }, { status: 200 });
  }
} 