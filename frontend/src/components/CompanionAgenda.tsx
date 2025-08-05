'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle, XCircle, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

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
          // Si tiene fechas específicas
          const slotStart = new Date(slot.startDate);
          const slotEnd = new Date(slot.endDate);
          return currentDay >= slotStart && currentDay <= slotEnd;
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
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
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
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tienes sesiones programadas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">{session.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                      {session.status === 'pending' && 'Pendiente'}
                      {session.status === 'confirmed' && 'Confirmada'}
                      {session.status === 'in_progress' && 'En Progreso'}
                      {session.status === 'completed' && 'Completada'}
                      {session.status === 'cancelled' && 'Cancelada'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {new Date(session.startTime).toLocaleDateString()} a las{' '}
                        {new Date(session.startTime).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {session.user?.fullName || 'Usuario'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{session.duration} min</span>
                      <span className="text-sm text-gray-600">•</span>
                      <span className="text-sm text-gray-600">${session.price} USDT</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 capitalize">
                        {session.sessionType}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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