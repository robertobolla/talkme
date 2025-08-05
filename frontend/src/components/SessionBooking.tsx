'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, DollarSign, Heart, MessageCircle, Video } from 'lucide-react';

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
  const [currentStep, setCurrentStep] = useState<BookingStep>({ step: 'search' });
  const [filters, setFilters] = useState({
    gender: '',
    language: '',
    specialty: '',
    duration: 60,
    date: new Date(),
    time: ''
  });

  const [availableCompanions, setAvailableCompanions] = useState<Companion[]>(companions);
  const [loading, setLoading] = useState(false);

  // Hooks para el paso de schedule
  const [availability, setAvailability] = useState<any[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loadingDateChange, setLoadingDateChange] = useState(false);

  // Estado para el modal de selección de duración
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [showDurationDropdown, setShowDurationDropdown] = useState<number | null>(null);

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
          const response = await fetch(`/api/companions/${currentStep.selectedCompanion!.id}/availability`);
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
  const getAvailableSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dateString = date.toISOString().split('T')[0];

    console.log('=== DEBUG getAvailableSlots ===');
    console.log('Fecha a buscar:', dateString);
    console.log('Día de la semana:', dayOfWeek);
    console.log('Disponibilidad total:', availability);

    const filteredSlots = availability.filter(slot => {
      console.log('Analizando slot:', slot);

      if (slot.startDate && slot.endDate) {
        // Si tiene fechas específicas
        const slotStart = new Date(slot.startDate);
        const slotEnd = new Date(slot.endDate);

        // Normalizar las fechas para comparar solo la fecha (sin hora)
        const slotStartDate = new Date(slotStart.getFullYear(), slotStart.getMonth(), slotStart.getDate());
        const slotEndDate = new Date(slotEnd.getFullYear(), slotEnd.getMonth(), slotEnd.getDate());
        const searchDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const isInRange = searchDate >= slotStartDate && searchDate <= slotEndDate;
        console.log('Fechas específicas - Inicio:', slot.startDate, 'Fin:', slot.endDate, 'En rango:', isInRange);
        console.log('Fechas normalizadas - Inicio:', slotStartDate.toDateString(), 'Fin:', slotEndDate.toDateString(), 'Buscar:', searchDate.toDateString());
        return isInRange;
      } else {
        // Si usa día de la semana
        const isCorrectDay = slot.dayOfWeek === dayOfWeek;
        const isActive = slot.isActive;
        console.log('Día de semana - Día:', slot.dayOfWeek, 'Activo:', slot.isActive, 'Coincide:', isCorrectDay && isActive);
        return isCorrectDay && isActive;
      }
    });

    console.log('Slots filtrados:', filteredSlots);
    return filteredSlots;
  };

  const availableSlots = getAvailableSlots(selectedDate);

  // Función para combinar slots contiguos
  const combineContiguousSlots = (slots: any[]) => {
    if (slots.length === 0) return [];

    // Ordenar slots por hora de inicio
    const sortedSlots = [...slots].sort((a, b) => {
      const timeA = new Date(`2000-01-01T${a.startTime}`);
      const timeB = new Date(`2000-01-01T${b.startTime}`);
      return timeA.getTime() - timeB.getTime();
    });

    const combinedSlots = [];
    let currentSlot = { ...sortedSlots[0] };

    for (let i = 1; i < sortedSlots.length; i++) {
      const nextSlot = sortedSlots[i];

      // Verificar si el slot actual termina cuando el siguiente empieza
      const currentEnd = new Date(`2000-01-01T${currentSlot.endTime}`);
      const nextStart = new Date(`2000-01-01T${nextSlot.startTime}`);

      if (currentEnd.getTime() === nextStart.getTime()) {
        // Son contiguos, combinar
        currentSlot.endTime = nextSlot.endTime;
      } else {
        // No son contiguos, guardar el actual y empezar uno nuevo
        combinedSlots.push(currentSlot);
        currentSlot = { ...nextSlot };
      }
    }

    // Agregar el último slot
    combinedSlots.push(currentSlot);

    return combinedSlots;
  };

  const combinedAvailableSlots = combineContiguousSlots(availableSlots);

  // Función para calcular las duraciones disponibles en un slot
  const getAvailableDurations = (slot: any) => {
    const startTime = new Date(`2000-01-01T${slot.startTime}`);
    const endTime = new Date(`2000-01-01T${slot.endTime}`);
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    const durations = [];
    for (let i = 30; i <= totalMinutes; i += 30) {
      durations.push(i);
    }
    return durations;
  };

  // Función para manejar el clic en reservar
  const handleReserveClick = (slot: any, slotIndex: number) => {
    console.log('=== CLIC EN RESERVAR ===');
    console.log('Slot seleccionado:', slot);
    console.log('Índice del slot:', slotIndex);

    setSelectedSlot(slot);
    setSelectedDuration(60); // Duración por defecto
    setShowDurationDropdown(slotIndex);

    console.log('Dropdown abierto para slot:', slotIndex);
  };

  // Debug: Log cuando cambian los horarios disponibles
  useEffect(() => {
    if (currentStep.step === 'schedule' && availability.length > 0) {
      console.log('Fecha seleccionada:', selectedDate.toDateString());
      console.log('Horarios disponibles (originales):', availableSlots.length);
      console.log('Horarios combinados:', combinedAvailableSlots.length);
      console.log('Horarios originales:', availableSlots);
      console.log('Horarios combinados:', combinedAvailableSlots);
    }
  }, [selectedDate, availableSlots, combinedAvailableSlots, currentStep.step, availability.length]);

  // Función para verificar si un día está seleccionado
  const isDateSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
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

  const handleConfirmBooking = async () => {
    if (!currentStep.selectedCompanion || !currentStep.selectedDate || !currentStep.selectedTime) return;

    setLoading(true);

    try {
      const startTime = new Date(currentStep.selectedDate);
      const [hours, minutes] = currentStep.selectedTime.split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: userProfile.id,
          companion: currentStep.selectedCompanion.id,
          startTime: startTime.toISOString(),
          duration: currentStep.selectedDuration || 60,
          sessionType: currentStep.selectedType || 'video',
          specialty: 'general',
          notes: `Sesión de videochat con ${currentStep.selectedCompanion.fullName}`
        }),
      });

      if (response.ok) {
        setCurrentStep({ step: 'success' });
        onSessionCreated();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error al crear la sesión');
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
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={new Date().toISOString().split('T')[0]}
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
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay disponibilidad para esta fecha</p>
              </div>
            ) : (
              <div className="space-y-2">
                {combinedAvailableSlots.map((slot, index) => {
                  const startTime = slot.startTime.split(':').slice(0, 2).join(':');
                  const endTime = slot.endTime.split(':').slice(0, 2).join(':');
                  const isDropdownOpen = showDurationDropdown === index;
                  const availableDurations = getAvailableDurations(slot);

                  return (
                    <div
                      key={index}
                      className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{startTime} - {endTime}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReserveClick(slot, index);
                            }}
                            className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200"
                          >
                            <Video className="w-4 h-4 mr-1" />
                            Reservar
                          </button>
                        </div>
                      </div>

                      {/* Dropdown de duración */}
                      {isDropdownOpen && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                          <p className="text-sm text-gray-700 mb-2 font-medium">Selecciona la duración:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {availableDurations.map((duration) => (
                              <button
                                key={duration}
                                onClick={() => {
                                  setSelectedDuration(duration);
                                  handleScheduleSelect(selectedDate, startTime, duration, 'video');
                                  setShowDurationDropdown(null);
                                }}
                                className="p-2 text-left rounded border border-gray-200 bg-white transition-colors hover:bg-blue-50"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-900">{duration} min</span>
                                  <span className="text-xs text-gray-600">
                                    ${((currentStep.selectedCompanion?.hourlyRate || 0) * duration / 60).toFixed(2)}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setShowDurationDropdown(null)}
                            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                          >
                            Cancelar
                          </button>
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
          <h4 className="text-md font-medium text-gray-900 mb-3">Mapa de disponibilidad</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-6">
              {/* Calendario */}
              <div className="flex-1 max-w-none">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-800">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - date.getDay() + i);
                    const daySlots = getAvailableSlots(date);
                    const hasAvailability = daySlots.length > 0;
                    const isCurrentMonth = date.getMonth() === new Date().getMonth();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = isDateSelected(date);

                    return (
                      <div
                        key={i}
                        className={`p-1 text-center text-xs border border-gray-200 min-h-[20px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors ${!isCurrentMonth ? 'text-gray-400' :
                          isSelected ? 'bg-blue-200 text-blue-900 font-bold border-blue-400' :
                            isToday ? 'bg-blue-100 text-blue-800 font-bold' :
                              'text-gray-800'
                          }`}
                        onClick={() => {
                          if (isCurrentMonth) {
                            setSelectedDate(date);
                            // Forzar actualización inmediata de horarios
                            setLoadingDateChange(true);
                            setTimeout(() => {
                              setLoadingDateChange(false);
                            }, 200);
                          }
                        }}
                      >
                        <span className="mb-1">{date.getDate()}</span>
                        {hasAvailability && isCurrentMonth && (
                          <div className="w-1 h-1 rounded-full bg-green-500"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Referencia al lado */}
              <div className="flex flex-col space-y-2 text-xs w-48 flex-shrink-0">
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <div>
                    <span className="font-medium text-gray-900">Disponible</span>
                    <p className="text-gray-700">Horarios libres</p>
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