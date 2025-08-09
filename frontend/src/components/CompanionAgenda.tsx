'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, X, ChevronLeft, ChevronRight, Video, MessageCircle, DollarSign, CheckCircle, XCircle, Trash2, RefreshCw } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import SessionCountdown from './SessionCountdown';
import StatusBadge from './StatusBadge';
import Link from 'next/link';

interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: 'user' | 'companion';
}

interface Session {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  sessionType: 'video' | 'chat';
  user?: {
    id: number;
    fullName: string;
  };
}

interface AvailabilitySlot {
  id?: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string;
  endTime: string;
  startDate?: string; // Nueva: fecha de inicio
  endDate?: string; // Nueva: fecha de fin
  isActive: boolean;
}

interface CompanionAgendaProps {
  companionId: number;
  userProfile: UserProfile;
}

// Tipos para el calendario
type DayStatus = 'available' | 'booked' | 'full' | 'no-availability';

interface CalendarDay {
  date: Date;
  status: DayStatus;
  sessions: Session[];
  availabilitySlots: AvailabilitySlot[];
}

export default function CompanionAgenda({ companionId, userProfile }: CompanionAgendaProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'availability'>('sessions');
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;
  const [newSlot, setNewSlot] = useState<Omit<AvailabilitySlot, 'id'>>({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    startDate: new Date().toISOString().split('T')[0], // Fecha actual
    endDate: new Date().toISOString().split('T')[0], // Fecha actual
    isActive: true
  });

  const [useSpecificDates, setUseSpecificDates] = useState(true);

  // Estado para el calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // Estado para rastrear sesiones que ya han mostrado notificación
  const [notifiedSessions, setNotifiedSessions] = useState<Set<number>>(new Set());
  const [lastSessionCount, setLastSessionCount] = useState<number>(0);
  const [hasNotifiedForNewSessions, setHasNotifiedForNewSessions] = useState<boolean>(false);
  const [notificationShown, setNotificationShown] = useState<boolean>(false);

  // Función simple para verificar si ya se mostró la notificación
  const hasShownNotification = () => {
    return localStorage.getItem(`notification_${companionId}`) === 'true';
  };

  // Función simple para marcar que se mostró la notificación
  const markNotificationAsShown = () => {
    localStorage.setItem(`notification_${companionId}`, 'true');
  };

  // Función simple para limpiar la notificación
  const clearNotification = () => {
    localStorage.removeItem(`notification_${companionId}`);
  };

  const { showSuccess, showError, showLoading, dismissLoading } = useNotifications();

  const daysOfWeek = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Función para formatear tiempo (quitar segundos)
  const formatDisplayTime = (time: string) => {
    // Si el tiempo viene en formato HH:mm:ss.SSS, solo tomar HH:mm
    return time.split(':').slice(0, 2).join(':');
  };

  // Parseo seguro de fecha en formato YYYY-MM-DD como fecha local (evita problemas de UTC)
  const parseLocalDate = (dateString: string) => {
    const [yearStr, monthStr, dayStr] = dateString.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1; // 0-based
    const day = Number(dayStr);
    return new Date(year, month, day, 0, 0, 0, 0);
  };

  // Función para filtrar sesiones según el estado seleccionado
  const getFilteredSessions = () => {
    if (sessionFilter === 'all') {
      // Ocultar pendientes en el listado normal para evitar duplicación con la caja de "Solicitudes Pendientes"
      return sessions.filter(session => session.status !== 'pending');
    }
    if (sessionFilter === 'pending') {
      // No mostrar cards para pendientes; se gestionan en la caja superior
      return [];
    }
    return sessions.filter(session => session.status === sessionFilter);
  };

  // Función para obtener las sesiones de la página actual
  const getCurrentPageSessions = () => {
    const filteredSessions = getFilteredSessions();
    const startIndex = (currentPage - 1) * sessionsPerPage;
    const endIndex = startIndex + sessionsPerPage;
    return filteredSessions.slice(startIndex, endIndex);
  };

  // Función para calcular el total de páginas
  const getTotalPages = () => {
    const filteredSessions = getFilteredSessions();
    return Math.ceil(filteredSessions.length / sessionsPerPage);
  };

  // Función para ir a una página específica
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Función para ir a la página anterior
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Función para ir a la página siguiente
  const goToNextPage = () => {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Resetear paginación cuando cambie el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [sessionFilter]);

  // Función para generar el calendario del mes
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const currentDay = new Date(startDate);

    while (currentDay <= lastDay || currentDay.getDay() !== 0) {
      const dateStr = currentDay.toISOString().split('T')[0];

      // Obtener sesiones para este día
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate.toDateString() === currentDay.toDateString();
      });

      // Obtener disponibilidad para este día
      const dayAvailability = availability.filter(slot => {
        if (slot.startDate && slot.endDate) {
          // Si tiene fechas específicas, comparar como fechas locales e incluir estado activo
          const slotStart = parseLocalDate(slot.startDate);
          const slotEnd = parseLocalDate(slot.endDate);
          return slot.isActive && currentDay >= slotStart && currentDay <= slotEnd;
        } else {
          // Si usa día de la semana
          return slot.dayOfWeek === currentDay.getDay() && slot.isActive;
        }
      });

      // Determinar el estado del día
      let status: DayStatus = 'no-availability';

      if (dayAvailability.length > 0) {
        const bookedSessions = daySessions.filter(s =>
          s.status === 'confirmed' || s.status === 'in_progress' || s.status === 'completed'
        );

        if (bookedSessions.length >= dayAvailability.length) {
          status = 'full';
        } else if (bookedSessions.length > 0) {
          status = 'booked';
        } else {
          status = 'available';
        }
      }

      days.push({
        date: new Date(currentDay),
        status,
        sessions: daySessions,
        availabilitySlots: dayAvailability
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }

    setCalendarDays(days);
  };

  // Función para obtener el color del estado del calendario
  const getCalendarStatusColor = (status: DayStatus) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'booked': return 'bg-blue-500';
      case 'full': return 'bg-red-500';
      case 'no-availability': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  // Función para obtener el color del estado de las sesiones
  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Función para obtener el tooltip del estado
  const getStatusTooltip = (day: CalendarDay) => {
    switch (day.status) {
      case 'available':
        return `Disponible - ${day.availabilitySlots.length} horario(s) libre(s)`;
      case 'booked':
        return `Reservado - ${day.sessions.length} sesión(es) reservada(s)`;
      case 'full':
        return `Completo - Todos los horarios reservados`;
      case 'no-availability':
        return 'Sin disponibilidad configurada';
      default:
        return '';
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchAvailability();
  }, [companionId]);

  // Polling para actualizar sesiones automáticamente
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('=== POLLING SESIONES ===');
      console.log('Companion ID:', companionId);
      console.log('Current sessions count:', sessions.length);
      console.log('Notified sessions count:', notifiedSessions.size);

      fetchSessions();
    }, 3000); // Verificar cada 3 segundos para mayor responsividad

    return () => clearInterval(interval);
  }, [companionId]); // Removí las dependencias que causaban re-creación del intervalo

  // Función para limpiar notificaciones cuando se monta el componente
  useEffect(() => {
    // Limpiar notificación al montar el componente
    clearNotification();

    // Hacer una verificación inmediata
    const immediateCheck = setTimeout(() => {
      console.log('=== VERIFICACIÓN INMEDIATA ===');
      fetchSessions();
    }, 1000);

    return () => clearTimeout(immediateCheck);
  }, [companionId]);

  // Detectar cuando el usuario regresa a la página y forzar actualización
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('=== PÁGINA VISIBLE - ACTUALIZANDO SESIONES ===');
        forceUpdateSessions();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [companionId]);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, sessions, availability]);

  // Resetear el estado cuando cambia el tipo de horario
  useEffect(() => {
    setNewSlot({
      dayOfWeek: useSpecificDates ? 0 : 1,
      startTime: '09:00',
      endTime: '10:00',
      startDate: useSpecificDates ? new Date().toISOString().split('T')[0] : undefined,
      endDate: useSpecificDates ? new Date().toISOString().split('T')[0] : undefined,
      isActive: true
    });
  }, [useSpecificDates]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/sessions/companion/${companionId}/all`);
      if (response.ok) {
        const data = await response.json();

        // Detectar nuevas sesiones pendientes
        const currentPendingSessions = data.filter((s: Session) => s.status === 'pending');
        const newPendingSessions = currentPendingSessions.filter((session: Session) =>
          !sessions.some(existingSession => existingSession.id === session.id)
        );

        // Si hay nuevas sesiones y no hemos notificado, mostrar notificación
        if (newPendingSessions.length > 0 && !hasShownNotification()) {
          const firstNewSession = newPendingSessions[0];
          console.log('=== NUEVA SOLICITUD DETECTADA ===');
          console.log('Session ID:', firstNewSession.id);
          console.log('User:', firstNewSession.user?.fullName);

          showSuccess(`¡Nueva solicitud de sesión recibida de ${firstNewSession.user?.fullName || 'un usuario'}!`);
          markNotificationAsShown();
        }

        // Actualizar las sesiones
        setSessions(data);

        console.log('=== SESIONES ACTUALIZADAS ===');
        console.log('Total sessions:', data.length);
        console.log('Pending sessions:', currentPendingSessions.length);
        console.log('New sessions:', newPendingSessions.length);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Función para forzar actualización inmediata
  const forceUpdateSessions = async () => {
    console.log('=== FORZAR ACTUALIZACIÓN ===');
    try {
      const response = await fetch(`/api/sessions/companion/${companionId}/all`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
        console.log('Sesiones actualizadas inmediatamente:', data.length);
      }
    } catch (error) {
      console.error('Error en actualización forzada:', error);
    }
  };

  // Función para limpiar notificaciones de sesiones que ya no están pendientes
  const cleanupNotifications = (currentSessions: Session[]) => {
    console.log('=== LIMPIEZA DE NOTIFICACIONES ===');
    console.log('Notification shown:', hasShownNotification());
  };

  const fetchAvailability = async () => {
    try {
      const response = await fetch(`/api/companions/${companionId}/availability`);
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailabilitySlot = async () => {
    // Validar que las horas sean lógicas
    if (newSlot.startTime >= newSlot.endTime) {
      showError('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }

    // Validar fechas si se usan fechas específicas
    if (useSpecificDates) {
      if (!newSlot.startDate || !newSlot.endDate) {
        showError('Por favor, completa las fechas de inicio y fin.');
        return;
      }

      if (newSlot.startDate > newSlot.endDate) {
        showError('La fecha de inicio debe ser anterior o igual a la fecha de fin.');
        return;
      }
    }

    // Validar si ya existe un horario duplicado
    if (validateDuplicateSlot(newSlot)) {
      const conflictType = useSpecificDates ? 'fechas y horarios' : 'día y horarios';
      showError(`Ya existe un horario que se solapa con las ${conflictType} seleccionados. Por favor, elige un horario diferente.`);
      return;
    }

    const loadingToast = showLoading('Agregando horario...');

    try {
      // Convertir el formato de tiempo a HH:mm:ss.SSS
      const formatTime = (time: string) => {
        return time + ':00.000';
      };

      const slotData = {
        ...newSlot,
        startTime: formatTime(newSlot.startTime),
        endTime: formatTime(newSlot.endTime),
        // Si usa fechas específicas, usar 0 como dayOfWeek por defecto
        ...(useSpecificDates ? {
          startDate: newSlot.startDate,
          endDate: newSlot.endDate,
          dayOfWeek: 0 // Usar 0 (Domingo) como valor por defecto para fechas específicas
        } : {
          dayOfWeek: newSlot.dayOfWeek,
          startDate: undefined,
          endDate: undefined
        })
      };

      const response = await fetch(`/api/companions/${companionId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotData),
      });

      if (response.ok) {
        showSuccess('Horario agregado exitosamente');
        setShowAddSlot(false);
        setNewSlot({
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          isActive: true
        });
        fetchAvailability();
      } else {
        const error = await response.json();
        showError(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding availability slot:', error);
      showError('Error al agregar horario');
    } finally {
      dismissLoading(loadingToast);
    }
  };

  const handleToggleAvailability = async (slotId: number, isActive: boolean) => {
    const loadingToast = showLoading('Actualizando disponibilidad...');

    try {
      const response = await fetch(`/api/companions/${companionId}/availability/${slotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        showSuccess('Disponibilidad actualizada');
        fetchAvailability();
      } else {
        const error = await response.json();
        showError(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      showError('Error al actualizar disponibilidad');
    } finally {
      dismissLoading(loadingToast);
    }
  };

  const handleDeleteAvailability = async (slotId: number) => {
    const loadingToast = showLoading('Eliminando horario...');

    try {
      const response = await fetch(`/api/companions/${companionId}/availability/${slotId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSuccess('Horario eliminado exitosamente');
        fetchAvailability();
      } else {
        const error = await response.json();
        showError(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting availability:', error);
      showError('Error al eliminar horario');
    } finally {
      dismissLoading(loadingToast);
    }
  };

  const validateDuplicateSlot = (newSlot: Omit<AvailabilitySlot, 'id'>) => {
    // Convertir el formato de tiempo para comparación
    const formatTime = (time: string) => {
      return time + ':00.000';
    };

    const newStartTime = formatTime(newSlot.startTime);
    const newEndTime = formatTime(newSlot.endTime);

    return availability.some(slot => {
      // Si ambos usan días de la semana
      if (!useSpecificDates && slot.startDate === null && slot.endDate === null) {
        // Verificar si es el mismo día y hay solapamiento de horas
        if (slot.dayOfWeek === newSlot.dayOfWeek) {
          // Verificar si hay solapamiento de horarios
          const slotStart = slot.startTime;
          const slotEnd = slot.endTime;

          // Un horario se solapa si:
          // - El nuevo horario empieza antes que termine el existente Y
          // - El nuevo horario termina después que empiece el existente
          return (newStartTime < slotEnd && newEndTime > slotStart);
        }
        return false;
      }

      // Si ambos usan fechas específicas
      if (useSpecificDates && slot.startDate && slot.endDate) {
        // Verificar si las fechas se solapan
        const slotStartDate = new Date(slot.startDate);
        const slotEndDate = new Date(slot.endDate);
        const newStartDate = new Date(newSlot.startDate!);
        const newEndDate = new Date(newSlot.endDate!);

        // Las fechas se solapan si:
        // - La nueva fecha empieza antes que termine la existente Y
        // - La nueva fecha termina después que empiece la existente
        const datesOverlap = (newStartDate <= slotEndDate && newEndDate >= slotStartDate);

        if (datesOverlap) {
          // Si las fechas se solapan, verificar si las horas también se solapan
          const slotStart = slot.startTime;
          const slotEnd = slot.endTime;

          return (newStartTime < slotEnd && newEndTime > slotStart);
        }

        return false;
      }

      return false;
    });
  };

  const handleAcceptSession = async (sessionId: number) => {
    const loadingToast = showLoading('Aceptando solicitud...');
    try {
      const response = await fetch(`/api/sessions/${sessionId}/accept`, {
        method: 'POST',
      });
      if (response.ok) {
        showSuccess('Solicitud aceptada');
        clearNotification();
        fetchSessions();
      } else {
        const errorText = await response.text().catch(() => '');
        let errorMsg = 'Error al aceptar la sesión';
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed?.error || errorText || errorMsg;
        } catch {
          if (errorText) errorMsg = errorText;
        }
        showError(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error accepting session:', error);
      showError('Error al aceptar solicitud');
    } finally {
      dismissLoading(loadingToast);
    }
  };

  const handleRejectSession = async (sessionId: number) => {
    const loadingToast = showLoading('Rechazando solicitud...');
    try {
      const response = await fetch(`/api/sessions/${sessionId}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        showSuccess('Solicitud rechazada');
        clearNotification();
        fetchSessions();
      } else {
        const errorText = await response.text().catch(() => '');
        let errorMsg = 'Error al rechazar la sesión';
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed?.error || errorText || errorMsg;
        } catch {
          if (errorText) errorMsg = errorText;
        }
        showError(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error rejecting session:', error);
      showError('Error al rechazar solicitud');
    } finally {
      dismissLoading(loadingToast);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Calendario Mensual */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendario y Leyenda lado a lado */}
        <div className="flex items-start space-x-6 w-full">
          {/* Calendario */}
          <div className="grid grid-cols-7 gap-1 flex-1 max-w-none">
            {/* Días de la semana */}
            {daysOfWeek.map((day) => (
              <div key={day} className="p-1 text-center text-xs font-medium text-gray-600 bg-gray-50">
                {day.slice(0, 3)}
              </div>
            ))}

            {/* Días del mes */}
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`p-1 text-center text-xs border border-gray-200 min-h-[40px] flex flex-col items-center justify-center relative ${day.date.getMonth() !== currentDate.getMonth() ? 'text-gray-400' : 'text-gray-900'
                  }`}
                title={getStatusTooltip(day)}
              >
                <span className="mb-1">{day.date.getDate()}</span>
                {day.status !== 'no-availability' && (
                  <div className={`w-2 h-2 rounded-full ${getCalendarStatusColor(day.status)}`}></div>
                )}
                {day.sessions.length > 0 && day.status === 'no-availability' && (
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                )}
              </div>
            ))}
          </div>

          {/* Leyenda al lado */}
          <div className="flex flex-col space-y-2 text-xs w-64 flex-shrink-0">
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
              <div>
                <span className="font-medium text-gray-900">Disponible</span>
                <p className="text-gray-600">Horarios libres</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
              <div>
                <span className="font-medium text-gray-900">Reservado</span>
                <p className="text-gray-600">Sesiones confirmadas</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
              <div>
                <span className="font-medium text-gray-900">Completo</span>
                <p className="text-gray-600">Sin horarios libres</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0"></div>
              <div>
                <span className="font-medium text-gray-900">Sin disponibilidad</span>
                <p className="text-gray-600">No configurado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sessions'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Sesiones
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'availability'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Disponibilidad
          </button>
        </div>
      </div>

      {activeTab === 'sessions' && (
        <div>
          {/* Filtros de sesiones */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSessionFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sessionFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Todas ({sessions.length})
              </button>
              <button
                onClick={() => setSessionFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sessionFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Pendientes ({sessions.filter(s => s.status === 'pending').length})
              </button>
              <button
                onClick={() => setSessionFilter('confirmed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sessionFilter === 'confirmed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Confirmadas ({sessions.filter(s => s.status === 'confirmed').length})
              </button>
              <button
                onClick={() => setSessionFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sessionFilter === 'completed'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Completadas ({sessions.filter(s => s.status === 'completed').length})
              </button>
              <button
                onClick={() => setSessionFilter('cancelled')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sessionFilter === 'cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Canceladas ({sessions.filter(s => s.status === 'cancelled').length})
              </button>
            </div>
          </div>

          {/* Sección de Solicitudes Pendientes */}
          {sessions.filter(s => s.status === 'pending').length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-yellow-800">
                  Solicitudes Pendientes ({sessions.filter(s => s.status === 'pending').length})
                </h3>
                <span className="text-sm text-yellow-600">
                  Necesitan tu confirmación
                </span>
              </div>

              <div className="space-y-3">
                {sessions.filter(s => s.status === 'pending').map((session) => (
                  <div
                    key={session.id}
                    className="bg-white border border-yellow-300 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800">
                        Sesión con{' '}
                        <Link
                          href={`/dashboard/professionals/${session.user?.id}`}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {session.user?.fullName || 'Usuario'}
                        </Link>
                      </h4>
                      <StatusBadge status={session.status} />
                    </div>

                    <div className="flex items-center text-gray-600 mb-3">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {new Date(session.startTime).toLocaleDateString()} a las{' '}
                        {new Date(session.startTime).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {session.sessionType === 'video' ? (
                          <Video className="w-4 h-4 text-blue-600" />
                        ) : (
                          <MessageCircle className="w-4 h-4 text-green-600" />
                        )}
                        <span className="text-sm text-gray-600 capitalize">
                          {session.sessionType}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-gray-600">
                        <div className="flex items-center">
                          <span className="text-sm">{session.duration} min</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">{session.price} USDT</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => handleAcceptSession(session.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Aceptar
                      </button>
                      <button
                        onClick={() => handleRejectSession(session.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4 inline mr-2" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {getFilteredSessions().length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {sessions.length === 0
                  ? 'No tienes sesiones programadas'
                  : `No hay sesiones ${sessionFilter !== 'all' ? `en estado "${sessionFilter}"` : ''}`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {getCurrentPageSessions().map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg text-gray-800">
                      Sesión con{' '}
                      <Link
                        href={`/dashboard/professionals/${session.user?.id}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {session.user?.fullName || 'Usuario'}
                      </Link>
                    </h3>
                    <StatusBadge status={session.status} />
                  </div>

                  <div className="flex items-center text-gray-600 mb-3">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {new Date(session.startTime).toLocaleDateString()} a las{' '}
                      {new Date(session.startTime).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Contador para sesiones confirmadas */}
                  {session.status === 'confirmed' && new Date(session.startTime) > new Date() && (
                    <div className="mb-3">
                      <SessionCountdown startTime={session.startTime} />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {session.sessionType === 'video' ? (
                        <Video className="w-4 h-4 text-blue-600" />
                      ) : (
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-sm text-gray-600 capitalize">
                        {session.sessionType}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-gray-600">
                      <div className="flex items-center">
                        <span className="text-sm">{session.duration} min</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">{session.price} USDT</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Paginación */}
              {getTotalPages() > 1 && (
                <div className="flex items-center justify-center mt-6 space-x-2">
                  {/* Botón Anterior */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>

                  {/* Números de página */}
                  {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => {
                    const isCurrentPage = page === currentPage;
                    const isNearCurrent = Math.abs(page - currentPage) <= 2;

                    if (isNearCurrent || page === 1 || page === getTotalPages()) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 rounded-lg transition-colors ${isCurrentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                      return <span key={page} className="px-2 text-gray-500">...</span>;
                    }
                    return null;
                  })}

                  {/* Botón Siguiente */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === getTotalPages()}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              )}

              {/* Información de paginación */}
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  Mostrando {getCurrentPageSessions().length} de {getFilteredSessions().length} sesiones
                  {getTotalPages() > 1 && ` (Página ${currentPage} de ${getTotalPages()})`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'availability' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowAddSlot(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Horario
            </button>
          </div>

          {showAddSlot && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-800 mb-4">Nuevo Horario</h4>

              {/* Toggle para elegir tipo de horario */}
              <div className="mb-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="scheduleType"
                      checked={useSpecificDates}
                      onChange={() => setUseSpecificDates(true)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Fechas específicas</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="scheduleType"
                      checked={!useSpecificDates}
                      onChange={() => setUseSpecificDates(false)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Día de la semana</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {/* Día de la semana - solo se muestra si no usa fechas específicas */}
                {!useSpecificDates && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Día de la Semana
                    </label>
                    <select
                      value={newSlot.dayOfWeek}
                      onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    >
                      {daysOfWeek.map((day, index) => (
                        <option key={index} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Fechas específicas - solo se muestra si usa fechas específicas */}
                {useSpecificDates && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Inicio
                      </label>
                      <input
                        type="date"
                        value={newSlot.startDate}
                        onChange={(e) => setNewSlot({ ...newSlot, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Fin
                      </label>
                      <input
                        type="date"
                        value={newSlot.endDate}
                        onChange={(e) => setNewSlot({ ...newSlot, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  />
                </div>

                <div className="flex items-end space-x-2">
                  <button
                    onClick={handleAddAvailabilitySlot}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Guardar
                  </button>
                  <button
                    onClick={() => setShowAddSlot(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {availability.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tienes horarios configurados</p>
              <p className="text-sm text-gray-500 mt-2">
                Agrega horarios para que los usuarios puedan reservar sesiones
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availability.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${slot.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        {/* Mostrar día de la semana solo si no hay fechas específicas */}
                        {(!slot.startDate && !slot.endDate) && (
                          <span className="font-medium text-gray-900">
                            {daysOfWeek[slot.dayOfWeek]}
                          </span>
                        )}
                        <span className="text-gray-600">
                          {formatDisplayTime(slot.startTime)} - {formatDisplayTime(slot.endTime)}
                        </span>
                      </div>
                      {/* Mostrar fechas específicas si existen */}
                      {slot.startDate && slot.endDate && (
                        <div className="text-sm text-gray-500 mt-1">
                          {slot.startDate === slot.endDate
                            ? `Fecha: ${slot.startDate}`
                            : `Período: ${slot.startDate} - ${slot.endDate}`
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleAvailability(slot.id!, !slot.isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${slot.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                    >
                      {slot.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      onClick={() => handleDeleteAvailability(slot.id!)}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 