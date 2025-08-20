'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, DollarSign, Heart, MessageCircle, Video } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface Companion {
  id: number;
  fullName: string;
  hourlyRate: number;
  specialties: string[];
  languages: string[];
  bio: string;
  averageRating: number;
}

interface SessionBookingProps {
  companions: Companion[];
  userProfile: any;
  onSessionCreated: () => void;
}

interface BookingStep {
  step: 'search' | 'schedule' | 'confirm' | 'payment' | 'success';
  selectedCompanion?: Companion;
  selectedDate?: Date;
  selectedTime?: string;
  selectedDuration?: number;
  selectedType?: 'video' | 'chat';
}

export default function SessionBooking({ companions, userProfile, onSessionCreated }: SessionBookingProps) {
  const { showSuccess, showError, showLoading, dismissLoading } = useToast();
  const [currentStep, setCurrentStep] = useState<BookingStep>({ step: 'search' });
  const [filters, setFilters] = useState({
    gender: '',
    language: '',
    specialty: '',
    duration: 15,
    date: new Date(),
    time: ''
  });

  const [availableCompanions, setAvailableCompanions] = useState<Companion[]>(companions);
  const [loading, setLoading] = useState(false);

  // Hooks para el paso de schedule
  const [availability, setAvailability] = useState<any[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    // Crear la fecha usando el constructor que maneja mejor las zonas horarias
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  });
  const [loadingDateChange, setLoadingDateChange] = useState(false);

  // Estado para el modal de selección de duración
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [showDurationDropdown, setShowDurationDropdown] = useState<number | null>(null);

  // Nuevos estados para selección manual
  const [customDuration, setCustomDuration] = useState(15);
  const [customStartTime, setCustomStartTime] = useState('');
  const [showCustomForm, setShowCustomForm] = useState<number | null>(null);

  // Filtrar acompañantes según criterios
  useEffect(() => {
    let filtered = companions;

    if (filters.gender) {
      // Aquí podrías agregar filtro por género si lo tienes en el modelo
    }

    if (filters.language) {
      filtered = filtered.filter(c => c.languages.includes(filters.language));
    }

    if (filters.specialty) {
      filtered = filtered.filter(c => c.specialties.includes(filters.specialty));
    }

    setAvailableCompanions(filtered);
  }, [filters, companions]);

  // Obtener disponibilidad del acompañante cuando se selecciona
  useEffect(() => {
    if (currentStep.step === 'schedule' && currentStep.selectedCompanion) {
      const fetchAvailability = async () => {
        try {
          setLoadingAvailability(true);
          const response = await fetch(`/api/companions/${currentStep.selectedCompanion!.id}/availability`, { cache: 'no-store' as any });
          if (response.ok) {
            const data = await response.json();
            console.log('=== DATOS DE DISPONIBILIDAD ===');
            console.log('Companion ID:', currentStep.selectedCompanion!.id);
            console.log('Datos recibidos:', data);
            setAvailability(data);
          } else {
            console.error('Error en la respuesta:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error fetching availability:', error);
        } finally {
          setLoadingAvailability(false);
        }
      };

      fetchAvailability();
    }
  }, [currentStep.step, currentStep.selectedCompanion?.id]);

  // Función para obtener disponibilidad real (excluyendo sesiones confirmadas)
  const fetchRealAvailability = async (companionId: number, date: Date) => {
    try {
      // Crear la fecha en la zona horaria local para evitar problemas de UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      console.log('=== DEBUG fetchRealAvailability ===');
      console.log('Fecha original:', date);
      console.log('Fecha formateada:', dateString);

      const response = await fetch(`/api/sessions/companion/${companionId}/real-availability?date=${dateString}`, { cache: 'no-store' as any });

      if (response.ok) {
        const data = await response.json();
        console.log('=== DISPONIBILIDAD REAL ===');
        console.log('Datos de disponibilidad real:', data);
        return data.availability || [];
      } else {
        // Tratar 400/404 como “sin disponibilidad” sin ruido en consola
        if (response.status === 400 || response.status === 404) {
          return [];
        }
        // Para otros códigos, registrar advertencia y continuar
        console.warn('Advertencia obteniendo disponibilidad real. status=', response.status);
        return [];
      }
    } catch (error) {
      console.warn('Error fetching real availability (silenciado):', error);
      return [];
    }
  };

  // Helper: parsear YYYY-MM-DD como fecha local (evita desfasajes por UTC)
  const parseLocalDate = (dateString: string) => {
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  };

  // Actualizar horarios cuando cambia la fecha seleccionada
  useEffect(() => {
    if (currentStep.step === 'schedule' && availability.length > 0) {
      console.log('=== ACTUALIZACIÓN DE FECHA ===');
      console.log('Nueva fecha seleccionada:', selectedDate.toDateString());
      console.log('Disponibilidad disponible:', availability.length);

      // Mostrar loading temporal al cambiar fecha
      setLoadingDateChange(true);
      setTimeout(() => {
        setLoadingDateChange(false);
      }, 300); // Pequeña pausa para feedback visual
    }
  }, [selectedDate, availability, currentStep.step]);

  // Generar horarios disponibles para la fecha seleccionada
  const getAvailableSlots = async (date: Date): Promise<any[]> => {
    if (!currentStep.selectedCompanion) return [];

    try {
      // Obtener disponibilidad real (excluyendo sesiones confirmadas)
      const realAvailability = await fetchRealAvailability(currentStep.selectedCompanion.id, date);

      console.log('=== DEBUG getAvailableSlots ===');
      // Crear la fecha en la zona horaria local para evitar problemas de UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      console.log('Fecha a buscar:', dateString);
      console.log('Día de la semana:', date.getDay());
      console.log('Disponibilidad real recibida:', realAvailability);

      // La API ya debería haber filtrado los slots correctos
      // Solo verificamos que los slots tengan los datos necesarios
      const validSlots = realAvailability.filter((slot: any) => {
        return slot && slot.startTime && slot.endTime && slot.isActive;
      });

      console.log('Slots válidos:', validSlots);

      if (validSlots.length > 0) {
        return validSlots;
      }

      // Fallback: si la API de real-availability no devuelve nada, filtrar con la disponibilidad base
      const dayOfWeek = date.getDay();
      const searchDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

      const fallbackSlots = availability.filter((slot: any) => {
        if (!slot?.isActive) return false;
        // Aceptar variantes de nombre en los campos
        const sDate = slot.startDate ?? slot.start_date ?? slot.start;
        const eDate = slot.endDate ?? slot.end_date ?? slot.end;
        if (sDate && eDate) {
          const slotStart = parseLocalDate(sDate);
          const slotEnd = parseLocalDate(eDate);
          return searchDate >= slotStart && searchDate <= slotEnd;
        }
        const dow = slot.dayOfWeek ?? slot.day_of_week ?? slot.dow;
        return dow === dayOfWeek;
      });

      console.log('Fallback slots (desde availability base):', fallbackSlots);

      // Normalizar estructura de fallback para que incluya startTime/endTime como HH:mm:ss.SSS si vinieran como HH:mm
      const normalizeTime = (t: string) => (t && t.length === 5 ? `${t}:00.000` : t);
      const normalizedFallback = fallbackSlots.map((slot: any) => ({
        ...slot,
        startTime: normalizeTime(slot.startTime),
        endTime: normalizeTime(slot.endTime),
      }));

      return normalizedFallback;
    } catch (error) {
      console.error('Error obteniendo slots disponibles:', error);
      return [];
    }
  };

  // Estado para slots disponibles
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Función para combinar slots contiguos o solapados y normalizar
  const combineContiguousSlots = (slots: any[]) => {
    if (slots.length === 0) return [];

    const toMinutes = (timeStr: string): number => {
      const [h, m] = (timeStr || '').split(':');
      const hh = parseInt(h || '0', 10);
      const mm = parseInt(m || '0', 10);
      return hh * 60 + mm;
    };

    const minutesToTime = (mins: number): string => {
      const clamped = Math.max(0, Math.min(24 * 60, Math.round(mins)));
      const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
      const mm = String(clamped % 60).padStart(2, '0');
      return `${hh}:${mm}:00.000`;
    };

    // Ordenar por hora de inicio
    const sorted = [...slots].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

    const merged: Array<{ start: number; end: number }> = [];
    for (const s of sorted) {
      const start = toMinutes(s.startTime);
      const end = toMinutes(s.endTime);
      if (merged.length === 0) {
        merged.push({ start, end });
        continue;
      }
      const last = merged[merged.length - 1];
      if (start <= last.end) {
        // Solapa o es contiguo: extender el final
        last.end = Math.max(last.end, end);
      } else {
        merged.push({ start, end });
      }
    }

    // Filtrar segmentos muy cortos (menos de 10 min) y devolver normalizados
    const MIN_SEGMENT_MINUTES = 15;
    return merged
      .filter(seg => seg.end - seg.start >= MIN_SEGMENT_MINUTES)
      .map(seg => ({ startTime: minutesToTime(seg.start), endTime: minutesToTime(seg.end), isActive: true }));
  };

  const combinedAvailableSlots = combineContiguousSlots(availableSlots);

  // Cargar slots disponibles cuando cambia la fecha o el acompañante
  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (currentStep.step === 'schedule' && currentStep.selectedCompanion) {
        setLoadingSlots(true);
        try {
          const slots = await getAvailableSlots(selectedDate);
          setAvailableSlots(slots);
        } catch (error) {
          console.error('Error loading available slots:', error);
          setAvailableSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      }
    };

    loadAvailableSlots();
  }, [selectedDate, currentStep.step, currentStep.selectedCompanion?.id]);

  // Función para calcular las duraciones disponibles en un slot
  const getAvailableDurations = (slot: any): number[] => {
    const startTime = new Date(`2000-01-01T${slot.startTime}`);
    const endTime = new Date(`2000-01-01T${slot.endTime}`);
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    const durations: number[] = [];
    for (let i = 30; i <= totalMinutes; i += 30) {
      durations.push(i);
    }
    return durations;
  };

  // Función para generar opciones de hora de inicio
  const getStartTimeOptions = (slot: any, duration: number) => {
    const startTime = new Date(`2000-01-01T${slot.startTime}`);
    const endTime = new Date(`2000-01-01T${slot.endTime}`);
    const options = [];

    // Generar opciones cada 15 minutos
    let currentTime = new Date(startTime);
    while (currentTime.getTime() + (duration * 60 * 1000) <= endTime.getTime()) {
      const timeString = currentTime.toTimeString().slice(0, 5); // HH:mm
      options.push(timeString);
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return options;
  };

  // Función para validar si la duración y hora de inicio son válidas
  const isValidBooking = (slot: any, startTime: string, duration: number) => {
    const slotStart = new Date(`2000-01-01T${slot.startTime}`);
    const slotEnd = new Date(`2000-01-01T${slot.endTime}`);
    const bookingStart = new Date(`2000-01-01T${startTime}`);
    const bookingEnd = new Date(bookingStart.getTime() + (duration * 60 * 1000));

    return bookingStart >= slotStart && bookingEnd <= slotEnd;
  };

  // Función para manejar el clic en reservar
  const handleReserveClick = (slot: any, slotIndex: number) => {
    console.log('=== CLIC EN RESERVAR ===');
    console.log('Slot seleccionado:', slot);
    console.log('Índice del slot:', slotIndex);

    setSelectedSlot(slot);
    setCustomDuration(15); // Duración por defecto
    setCustomStartTime(slot.startTime.split(':').slice(0, 2).join(':')); // Hora de inicio por defecto
    setShowCustomForm(slotIndex);

    console.log('Formulario personalizado abierto para slot:', slotIndex);
  };

  // Debug: Log cuando cambian los horarios disponibles
  useEffect(() => {
    console.log('=== DEBUG SESSION BOOKING ===');
    console.log('Current step:', currentStep.step);
    console.log('Selected companion:', currentStep.selectedCompanion?.fullName);
    console.log('Selected date:', selectedDate.toDateString());
    console.log('Available slots length:', availableSlots.length);
    console.log('Combined slots length:', combinedAvailableSlots.length);
    console.log('Loading slots:', loadingSlots);
    console.log('Loading availability:', loadingAvailability);
    console.log('Loading date change:', loadingDateChange);

    if (currentStep.step === 'schedule' && availableSlots.length > 0) {
      console.log('Fecha seleccionada:', selectedDate.toDateString());
      console.log('Horarios disponibles (originales):', availableSlots.length);
      console.log('Horarios combinados:', combinedAvailableSlots.length);
      console.log('Horarios originales:', availableSlots);
      console.log('Horarios combinados:', combinedAvailableSlots);
    }
  }, [selectedDate, availableSlots, combinedAvailableSlots, currentStep.step, loadingSlots, loadingAvailability, loadingDateChange]);

  // Actualizar hora de inicio cuando cambie la duración
  useEffect(() => {
    if (selectedSlot && customDuration) {
      const startTimeOptions = getStartTimeOptions(selectedSlot, customDuration);
      if (startTimeOptions.length > 0 && !startTimeOptions.includes(customStartTime)) {
        setCustomStartTime(startTimeOptions[0]);
      }
    }
  }, [customDuration, selectedSlot]);

  // Función para verificar si un día está seleccionado
  const isDateSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  // Estado para tracking de disponibilidad por fecha
  const [availabilityByDate, setAvailabilityByDate] = useState<{ [key: string]: boolean }>({});
  const [loadingCalendarAvailability, setLoadingCalendarAvailability] = useState(false);

  // Función para verificar si un día tiene disponibilidad
  const hasAvailability = (date: Date) => {
    // Crear la fecha en la zona horaria local para evitar problemas de UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    console.log('=== DEBUG hasAvailability ===');
    console.log('Fecha original:', date);
    console.log('Fecha formateada:', dateString);
    console.log('Disponibilidad:', availabilityByDate[dateString]);

    return availabilityByDate[dateString] || false;
  };

  // Función para cargar disponibilidad para un rango de fechas
  const loadAvailabilityForMonth = async (year: number, month: number) => {
    if (!currentStep.selectedCompanion) return;

    setLoadingCalendarAvailability(true);
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const newAvailabilityByDate: { [key: string]: boolean } = {};

    // Normalizar "hoy" a medianoche para incluir el día actual como válido
    const now = new Date();
    const normalizedToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    );

    console.log('=== DEBUG loadAvailabilityForMonth ===');
    console.log('Year:', year, 'Month:', month);
    console.log('Start date:', startDate);
    console.log('End date:', endDate);

    // Verificar disponibilidad para cada día del mes
    for (let day = 1; day <= endDate.getDate(); day++) {
      const date = new Date(year, month, day);
      if (date >= normalizedToday) { // Incluir también el día actual
        try {
          const realAvailability = await fetchRealAvailability(currentStep.selectedCompanion.id, date);

          // Crear la fecha en la zona horaria local para evitar problemas de UTC
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;

          newAvailabilityByDate[dateString] = realAvailability.length > 0;

          console.log(`Día ${day}: ${dateString} - Disponibilidad: ${realAvailability.length > 0}`);
        } catch (error) {
          console.error('Error checking availability for date:', date, error);

          // Crear la fecha en la zona horaria local para evitar problemas de UTC
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;

          newAvailabilityByDate[dateString] = false;
        }
      } else {
        // Días pasados no se consultan; marcarlos como no disponibles
        const yearStr = date.getFullYear();
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        const dateString = `${yearStr}-${monthStr}-${dayStr}`;
        newAvailabilityByDate[dateString] = false;
      }
    }

    setAvailabilityByDate(newAvailabilityByDate);
    setLoadingCalendarAvailability(false);
  };

  // Cargar disponibilidad para el mes actual cuando cambie el acompañante o el mes
  useEffect(() => {
    if (currentStep.step === 'schedule' && currentStep.selectedCompanion) {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      loadAvailabilityForMonth(year, month);
    }
  }, [currentStep.step, currentStep.selectedCompanion?.id, selectedDate.getFullYear(), selectedDate.getMonth()]);

  // Función para generar el calendario
  const generateCalendar = () => {
    const today = new Date();
    const normalizedToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0, 0, 0, 0
    );
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    console.log('=== DEBUG generateCalendar ===');
    console.log('Current month:', currentMonth);
    console.log('Current year:', currentYear);
    console.log('Selected date:', selectedDate);

    // Crear fechas usando el constructor que maneja mejor las zonas horarias
    const firstDay = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const lastDay = new Date(currentYear, currentMonth + 1, 0, 0, 0, 0, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    console.log('First day of month:', firstDay);
    console.log('Last day of month:', lastDay);
    console.log('Start date for calendar:', startDate);

    const calendar = [];
    const currentDate = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        // Crear la fecha usando el constructor que maneja mejor las zonas horarias
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0);
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const isAvailable = hasAvailability(date);
        // Considerar como pasado solo días estrictamente anteriores a hoy (mismo día permitido)
        const isPast = date < normalizedToday;

        // Log solo para fechas del mes actual
        if (isCurrentMonth) {
          console.log(`Fecha generada: ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} - isSelected: ${isSelected}`);
        }

        weekDays.push({
          date,
          isCurrentMonth,
          isToday,
          isSelected,
          isAvailable,
          isPast
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      calendar.push(weekDays);
    }

    return calendar;
  };

  // Función para manejar el clic en una fecha del calendario
  const handleDateClick = (date: Date) => {
    console.log('=== DEBUG handleDateClick ===');
    console.log('Fecha clickeada (original):', date);
    console.log('Fecha clickeada (toDateString):', date.toDateString());
    console.log('Fecha clickeada (toISOString):', date.toISOString());
    console.log('Fecha clickeada (getDate):', date.getDate());
    console.log('Fecha clickeada (getMonth):', date.getMonth());
    console.log('Fecha clickeada (getFullYear):', date.getFullYear());

    if (date >= new Date()) {
      console.log('Fecha válida, estableciendo selectedDate...');
      // Crear la fecha usando el constructor que maneja mejor las zonas horarias
      const newSelectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      console.log('Nueva fecha seleccionada:', newSelectedDate);
      setSelectedDate(newSelectedDate);
    } else {
      console.log('Fecha en el pasado, ignorando...');
    }
  };

  // Función para navegar al mes anterior
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  // Función para navegar al mes siguiente
  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const handleCompanionSelect = (companion: Companion) => {
    setCurrentStep({
      step: 'schedule',
      selectedCompanion: companion
    });
  };

  const handleScheduleSelect = (date: Date, time: string, duration: number, type: 'video' | 'chat') => {
    setCurrentStep({
      ...currentStep,
      step: 'confirm',
      selectedDate: date,
      selectedTime: time,
      selectedDuration: duration,
      selectedType: type
    });
  };

  // Función para manejar la confirmación del formulario personalizado
  const handleCustomBookingConfirm = (slot: any) => {
    if (!isValidBooking(slot, customStartTime, customDuration)) {
      showError('La duración y hora de inicio no son válidas para este horario disponible.', 4000);
      return;
    }

    handleScheduleSelect(selectedDate, customStartTime, customDuration, 'video');
    setShowCustomForm(null);
  };

  // Función para mostrar toast de confirmación detallado
  const showBookingConfirmationToast = (companionName: string, date: Date, time: string, duration: number) => {
    const formattedDate = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    showSuccess(
      `🎉 ¡Solicitud de reserva enviada exitosamente!\n\n` +
      `📋 Detalles de tu solicitud:\n` +
      `👤 Acompañante: ${companionName}\n` +
      `📅 Fecha: ${formattedDate}\n` +
      `🕐 Hora: ${time}\n` +
      `⏱️ Duración: ${duration} minutos\n\n` +
      `⏳ Estado: Pendiente de confirmación\n` +
      `📱 Te notificaremos cuando el acompañante confirme o rechace tu solicitud.\n\n` +
      `💡 Consejo: Puedes revisar el estado de tu solicitud en tu dashboard.`,
      10000
    );
  };

  const handleConfirmBooking = async () => {
    if (!currentStep.selectedCompanion || !currentStep.selectedDate || !currentStep.selectedTime) return;

    const loadingToast = showLoading('Procesando tu solicitud de reserva...');
    setLoading(true);

    try {
      // Crear la fecha en la zona horaria local para evitar problemas de UTC
      const startTime = new Date(currentStep.selectedDate);
      const [hours, minutes] = currentStep.selectedTime.split(':');

      // Establecer la hora en la zona horaria local
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      console.log('=== DEBUG handleConfirmBooking ===');
      console.log('Fecha seleccionada:', currentStep.selectedDate);
      console.log('Hora seleccionada:', currentStep.selectedTime);
      console.log('Fecha final con hora:', startTime);
      console.log('ISO String:', startTime.toISOString());

      const sessionData = {
        user: userProfile.id,
        companion: currentStep.selectedCompanion.id,
        startTime: startTime.toISOString(),
        duration: currentStep.selectedDuration || 15,
        sessionType: currentStep.selectedType || 'video',
        specialty: 'general',
        notes: `Sesión de videochat con ${currentStep.selectedCompanion.fullName}`,
        status: 'pending' // Estado pendiente para que el acompañante pueda confirmar
      };

      console.log('=== CREATING SESSION ===');
      console.log('Session data:', sessionData);
      console.log('Duration:', sessionData.duration);

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        dismissLoading(loadingToast);
        showSuccess('¡Solicitud de reserva enviada exitosamente!', 6000);

        // Mostrar toast informativo detallado sobre el proceso
        setTimeout(() => {
          showBookingConfirmationToast(
            currentStep.selectedCompanion?.fullName || 'el acompañante',
            currentStep.selectedDate!,
            currentStep.selectedTime!,
            currentStep.selectedDuration || 15
          );
        }, 1000);

        setCurrentStep({ step: 'success' });
        onSessionCreated();
      } else {
        const error = await response.json();
        dismissLoading(loadingToast);

        if (response.status === 409) {
          showError(
            `El horario seleccionado ya no está disponible.\n\n` +
            `Por favor, selecciona otro horario o intenta con una fecha diferente.`,
            6000
          );
        } else {
          showError(`Error al crear la sesión: ${error.error}`, 5000);
        }
      }
    } catch (error) {
      console.error('Error creating session:', error);
      dismissLoading(loadingToast);
      showError('Error al crear la sesión. Por favor, intenta nuevamente.', 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep.step === 'schedule') {
      setCurrentStep({ step: 'search' });
    } else if (currentStep.step === 'confirm') {
      setCurrentStep({ ...currentStep, step: 'schedule' });
    }
  };

  // Paso 1: Búsqueda y filtros
  if (currentStep.step === 'search') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Buscar Acompañante</h2>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
            <select
              value={filters.language}
              onChange={(e) => setFilters({ ...filters, language: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los idiomas</option>
              <option value="Español">Español</option>
              <option value="Inglés">Inglés</option>
              <option value="Francés">Francés</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Especialidad</label>
            <select
              value={filters.specialty}
              onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las especialidades</option>
              <option value="Escucha activa">Escucha activa</option>
              <option value="Acompañamiento emocional">Acompañamiento emocional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duración</label>
            <select
              value={filters.duration}
              onChange={(e) => setFilters({ ...filters, duration: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1.5 horas</option>
              <option value={120}>2 horas</option>
            </select>
          </div>
        </div>

        {/* Lista de acompañantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableCompanions.map((companion) => (
            <div
              key={companion.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCompanionSelect(companion)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg text-gray-800">{companion.fullName}</h3>
                <div className="flex items-center text-yellow-500">
                  <span className="text-sm font-medium text-yellow-600">{companion.averageRating}</span>
                  <span className="text-sm">⭐</span>
                </div>
              </div>

              <div className="flex items-center mb-2">
                <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-gray-600">${companion.hourlyRate}/hora</span>
              </div>

              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {companion.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">{companion.bio}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Paso 2: Selección de horario
  if (currentStep.step === 'schedule' && currentStep.selectedCompanion) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800"
          >
            ← Volver
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            Agendar con {currentStep.selectedCompanion.fullName}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendario */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Seleccionar fecha</h3>
            <div className="border border-gray-200 rounded-lg p-4">
              <input
                type="date"
                value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}
                onChange={(e) => setSelectedDate(parseLocalDate(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
              />
            </div>
          </div>

          {/* Horarios disponibles */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Horarios disponibles</h3>
            {loadingAvailability || loadingDateChange ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">
                  {loadingDateChange ? 'Actualizando horarios...' : 'Cargando disponibilidad...'}
                </p>
              </div>
            ) : loadingSlots ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Verificando disponibilidad...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No hay disponibilidad para esta fecha</p>
                <p className="text-gray-500 text-sm mt-1">Intenta seleccionar otra fecha</p>
              </div>
            ) : (
              <div className="space-y-3">
                {combinedAvailableSlots.map((slot, index) => {
                  const startTime = slot.startTime.split(':').slice(0, 2).join(':');
                  const endTime = slot.endTime.split(':').slice(0, 2).join(':');
                  const isFormOpen = showCustomForm === index;

                  return (
                    <div
                      key={index}
                      className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-gray-900 text-lg">{startTime} - {endTime}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReserveClick(slot, index);
                            }}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Reservar
                          </button>
                        </div>
                      </div>

                      {/* Formulario personalizado de reserva */}
                      {showCustomForm === index && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800 mb-4 font-medium">Configurar sesión personalizada:</p>

                          <div className="space-y-4">
                            {/* Duración personalizada */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duración (minutos):
                              </label>
                              <input
                                type="number"
                                min="15"
                                max="480"
                                step="15"
                                value={customDuration}
                                onChange={(e) => setCustomDuration(parseInt(e.target.value) || 15)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Mínimo: 15 min, Máximo: 8 horas
                              </p>
                            </div>

                            {/* Hora de inicio */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hora de inicio:
                              </label>
                              <select
                                value={customStartTime}
                                onChange={(e) => setCustomStartTime(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                {getStartTimeOptions(slot, customDuration).map((time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex space-x-3 pt-2">
                              <button
                                onClick={() => handleCustomBookingConfirm(slot)}
                                disabled={!isValidBooking(slot, customStartTime, customDuration)}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                              >
                                Confirmar Reserva
                              </button>
                              <button
                                onClick={() => setShowCustomForm(null)}
                                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>

                            {/* Mensaje de validación */}
                            {!isValidBooking(slot, customStartTime, customDuration) && (
                              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                                ⚠️ La duración y hora de inicio no son válidas para este horario disponible.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mapa de disponibilidad */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Calendario de disponibilidad</h4>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start space-x-6">
              {/* Calendario */}
              <div className="flex-1">
                {/* Navegación del mes */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    ←
                  </button>
                  <div className="flex items-center space-x-2">
                    <h5 className="text-lg font-semibold text-gray-900">
                      {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h5>
                    {loadingCalendarAvailability && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    →
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-800 p-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendar().map((week, weekIndex) => (
                    week.map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`p-2 text-center text-xs border border-gray-200 min-h-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50' :
                          day.isSelected ? 'bg-blue-200 text-blue-900 font-bold border-blue-400' :
                            day.isToday ? 'bg-blue-100 text-blue-800 font-bold' :
                              'text-gray-800'
                          } ${day.isPast ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleDateClick(day.date)}
                      >
                        <span className="text-sm font-medium">{day.date.getDate()}</span>
                        {day.isAvailable && day.isCurrentMonth && (
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                        )}
                      </div>
                    ))
                  ))}
                </div>
              </div>

              {/* Referencia al lado */}
              <div className="flex flex-col space-y-3 text-xs w-48 flex-shrink-0">
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <div>
                    <span className="font-medium text-gray-900">Disponible</span>
                    <p className="text-gray-700">Horarios libres</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-blue-200 flex-shrink-0"></div>
                  <div>
                    <span className="font-medium text-gray-900">Hoy</span>
                    <p className="text-gray-700">Fecha actual</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0"></div>
                  <div>
                    <span className="font-medium text-gray-900">Seleccionado</span>
                    <p className="text-gray-700">Fecha elegida</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Paso 3: Confirmación
  if (currentStep.step === 'confirm' && currentStep.selectedCompanion) {
    const totalPrice = (currentStep.selectedCompanion.hourlyRate * (currentStep.selectedDuration || 60)) / 60;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800"
          >
            ← Volver
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Confirmar Reserva</h2>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Detalles de la sesión</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Acompañante:</span>
              <span className="font-medium text-gray-900">{currentStep.selectedCompanion.fullName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Duración:</span>
              <span className="font-medium text-gray-900">{currentStep.selectedDuration} minutos de Videochat</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Fecha y hora:</span>
              <span className="font-medium text-gray-900">
                {currentStep.selectedDate?.toLocaleDateString()} a las {currentStep.selectedTime}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Precio:</span>
              <span className="font-medium text-green-600">${totalPrice} USDT</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Saldo disponible:</span>
              <span className="font-medium text-gray-900">${userProfile.balance} USDT</span>
            </div>
          </div>
        </div>

        {userProfile.balance < totalPrice ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">
              Saldo insuficiente. Necesitas ${totalPrice - userProfile.balance} USDT más.
            </p>
            <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Comprar créditos
            </button>
          </div>
        ) : (
          <button
            onClick={handleConfirmBooking}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Reservando...' : 'Confirmar Reserva'}
          </button>
        )}
      </div>
    );
  }

  // Paso 4: Éxito
  if (currentStep.step === 'success') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Reserva Confirmada!</h2>

        <p className="text-gray-600 mb-6">
          Tu sesión ha sido reservada exitosamente. El acompañante recibirá una notificación y tendrá 2 horas para confirmar.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Próximos pasos:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• El acompañante recibirá una notificación</li>
            <li>• Tendrá 2 horas para confirmar la sesión</li>
            <li>• Recibirás un recordatorio 10 minutos antes</li>
            <li>• Podrás entrar a la sesión desde tu dashboard</li>
          </ul>
        </div>

        <button
          onClick={() => setCurrentStep({ step: 'search' })}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reservar otra sesión
        </button>
      </div>
    );
  }

  return null;
} 