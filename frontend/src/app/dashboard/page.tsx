'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Heart,
  MessageCircle,
  Video,
  Star,
  Plus,
  Search,
  XCircle
} from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import StatusBadge from '@/components/StatusBadge';
import SessionBooking from '@/components/SessionBooking';
import CompanionNotifications from '@/components/CompanionNotifications';
import CompanionAgenda from '@/components/CompanionAgenda';
import SessionCountdown from '@/components/SessionCountdown';
import SessionReadyModal from '@/components/SessionReadyModal';
import VideoChatWindow from '@/components/VideoChatWindow';
import { useNotifications } from '@/hooks/useNotifications';
import { useSessionReady } from '@/hooks/useSessionReady';

interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: 'user' | 'companion';
  balance: number;
  totalEarnings: number;
  averageRating: number;
  hourlyRate?: number; // Added for companion hourly rate
  status: string;
  isOnline?: boolean; // Added for companion status
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
  companion?: {
    id: number;
    fullName: string;
  };
  user?: {
    id: number;
    fullName: string;
  };
}

interface Companion {
  id: number;
  fullName: string;
  hourlyRate: number;
  specialties: string[];
  languages: string[];
  bio: string;
  averageRating: number;
}

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSession, setBookingSession] = useState<number | null>(null);
  const [showAgenda, setShowAgenda] = useState(false);
  const { showSuccess, showError, showLoading, dismissLoading } = useNotifications();

  // Session ready logic
  const {
    readyModalOpen,
    videoChatOpen,
    currentSession,
    userReady,
    otherPartyReady,
    handleReady,
    handleNotReady,
    handleCloseReadyModal,
    handleCloseVideoChat
  } = useSessionReady({
    sessions,
    userRole: userProfile?.role || 'user',
    userId: userProfile?.id || 0
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      fetchSessions();
      if (userProfile.role === 'user') {
        fetchCompanions();
      }
    }
  }, [userProfile]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile for email:', user?.emailAddresses[0].emailAddress);

      const response = await fetch(`/api/user-profiles?filters[email][$eq]=${user?.emailAddresses[0].emailAddress}&populate=*`);

      if (response.ok) {
        const data = await response.json();
        console.log('User profile response:', data);

        if (data.data && data.data.length > 0) {
          setUserProfile(data.data[0]);
          console.log('User profile found:', data.data[0]);
        } else {
          console.log('No user profile found for email:', user?.emailAddresses[0].emailAddress);
          // Intentar buscar por clerkUserId como fallback
          const clerkResponse = await fetch(`/api/user-profiles?filters[clerkUserId][$eq]=${user?.id}&populate=*`);
          if (clerkResponse.ok) {
            const clerkData = await clerkResponse.json();
            if (clerkData.data && clerkData.data.length > 0) {
              setUserProfile(clerkData.data[0]);
              console.log('User profile found by clerkUserId:', clerkData.data[0]);
            }
          }
        }
      } else {
        console.error('Error response from user-profiles API:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    if (!userProfile) return;

    try {
      const response = await fetch(`/api/sessions/user/${userProfile.id}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchCompanions = async () => {
    try {
      const response = await fetch('/api/sessions/companions/available');
      if (response.ok) {
        const data = await response.json();
        setCompanions(data);
      }
    } catch (error) {
      console.error('Error fetching companions:', error);
    }
  };

  const handleBookSession = async (companionId: number, sessionData: any) => {
    if (!userProfile || userProfile.role !== 'user') return;

    setBookingSession(companionId);
    const loadingToast = showLoading('Reservando sesión...');

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sessionData,
          user: userProfile.id,
          companion: companionId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sesión reservada exitosamente:', data);

        dismissLoading(loadingToast);
        showSuccess('¡Sesión reservada exitosamente! 🎉', 5000);

        // Recargar datos
        fetchSessions();
        setBookingSession(null);
      } else {
        const error = await response.json();
        dismissLoading(loadingToast);
        showError(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      dismissLoading(loadingToast);
      showError('Error al crear la sesión');
    }
  };

  const handleSessionCreated = () => {
    fetchSessions();
    setShowBooking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se encontró el perfil de usuario</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: userProfile.role === 'user' ? 'Saldo Disponible' : 'Ganancias Totales',
      value: userProfile.role === 'user' ? `$${userProfile.balance}` : `$${userProfile.totalEarnings}`,
      icon: DollarSign,
      color: userProfile.role === 'user' ? 'blue' : 'green',
      subtitle: userProfile.role === 'user' ? 'Créditos para reservar sesiones' : 'Total de sesiones completadas'
    },
    {
      title: 'Sesiones Activas',
      value: sessions.filter(s => s.status === 'confirmed' || s.status === 'in_progress').length.toString(),
      icon: Calendar,
      color: 'purple',
      subtitle: userProfile.role === 'user' ? 'Sesiones programadas' : 'Sesiones confirmadas'
    },
    {
      title: userProfile.role === 'user' ? 'Sesiones Completadas' : 'Calificación Promedio',
      value: userProfile.role === 'user'
        ? sessions.filter(s => s.status === 'completed').length.toString()
        : `${userProfile.averageRating}⭐`,
      icon: userProfile.role === 'user' ? Clock : Star,
      color: userProfile.role === 'user' ? 'orange' : 'yellow',
      subtitle: userProfile.role === 'user' ? 'Historial de sesiones' : 'Basado en reseñas'
    },
    // Cuarta stats card solo para acompañantes
    ...(userProfile.role === 'companion' ? [{
      title: 'Tarifa por Hora',
      value: `$${userProfile.hourlyRate || 0} ✏️`,
      icon: DollarSign,
      color: 'pink' as any,
      subtitle: 'Haz clic para editar tu tarifa por hora',
      onClick: () => router.push('/dashboard/edit-profile')
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bienvenido, {userProfile.fullName}
              </h1>
              <p className="text-gray-600 mt-2">
                {userProfile.role === 'user' ? 'Tu espacio personal para conectar con acompañantes' : 'Tu espacio para acompañar a otros'}
              </p>
            </div>

            {/* Badge de rol */}
            <div className="flex items-center space-x-2">
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${userProfile.role === 'user'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-pink-100 text-pink-800 border border-pink-200'
                }`}>
                {userProfile.role === 'user' ? '👤 Usuario' : '💝 Acompañante'}
              </div>

              {/* Estado online para acompañantes */}
              {userProfile.role === 'companion' && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${userProfile.isOnline
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                  {userProfile.isOnline ? '🟢 En línea' : '⚫ Desconectado'}
                </div>
              )}

              {/* Botón de editar perfil */}
              <button
                onClick={() => router.push('/dashboard/edit-profile')}
                className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 rounded-full hover:bg-gray-200 transition-colors"
              >
                ✏️ Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-${userProfile.role === 'companion' ? '4' : '3'} gap-6 mb-8`}>
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color as any}
              subtitle={stat.subtitle}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Booking for Users */}
            {userProfile.role === 'user' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Reservar Sesión</h2>
                  <button
                    onClick={() => setShowBooking(!showBooking)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showBooking ? (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Buscar Acompañante
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Reserva
                      </>
                    )}
                  </button>
                </div>

                {showBooking ? (
                  <SessionBooking
                    companions={companions}
                    userProfile={userProfile}
                    onSessionCreated={handleSessionCreated}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Haz clic en "Nueva Reserva" para buscar un acompañante
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Companion Agenda */}
            {userProfile.role === 'companion' && showAgenda && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Mi Agenda</h2>
                  <button
                    onClick={() => setShowAgenda(false)}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cerrar Agenda
                  </button>
                </div>
                <CompanionAgenda
                  companionId={userProfile.id}
                  userProfile={userProfile}
                />
              </div>
            )}

            {/* Sessions List */}
            {(!showAgenda || userProfile.role === 'user') && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  {userProfile.role === 'user' ? 'Mis Sesiones' : 'Historial de Sesiones'}
                </h2>

                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {userProfile.role === 'user'
                        ? 'No tienes sesiones programadas'
                        : 'No has recibido solicitudes de sesión'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg text-gray-800">
                            {session.title}
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
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {userProfile.role === 'user' ? 'Acciones Rápidas' : 'Panel de Acompañante'}
              </h3>

              <div className="space-y-3">
                {userProfile.role === 'user' ? (
                  <>
                    <button
                      onClick={() => setShowBooking(true)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Reservar Sesión
                    </button>

                    <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Comprar Créditos
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowAgenda(true)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Ver Agenda
                    </button>

                    <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Retirar Ganancias
                    </button>


                  </>
                )}
              </div>
            </div>

            {/* Notifications for Companions */}
            {userProfile.role === 'companion' && (
              <CompanionNotifications
                companionId={userProfile.id}
                onSessionConfirmed={() => {
                  fetchSessions();
                  showSuccess('Sesión confirmada exitosamente');
                }}
              />
            )}

            {/* Available Companions (for users) */}
            {userProfile.role === 'user' && companions.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Acompañantes Disponibles</h3>

                <div className="space-y-3">
                  {companions.slice(0, 3).map((companion) => (
                    <div
                      key={companion.id}
                      className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setShowBooking(true);
                        // Aquí podrías preseleccionar el acompañante
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">{companion.fullName}</h4>
                        <div className="flex items-center text-yellow-500">
                          <span className="text-sm font-medium">{companion.averageRating}</span>
                          <span className="text-sm">⭐</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>${companion.hourlyRate}/hora</span>
                        <span className="text-green-600">● Disponible</span>
                      </div>
                    </div>
                  ))}

                  {companions.length > 3 && (
                    <button
                      onClick={() => setShowBooking(true)}
                      className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Ver todos los acompañantes ({companions.length})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Ready Modal */}
      {currentSession && (
        <SessionReadyModal
          session={currentSession}
          userRole={userProfile?.role || 'user'}
          isOpen={readyModalOpen}
          onClose={handleCloseReadyModal}
          onReady={handleReady}
          onNotReady={handleNotReady}
          isOtherPartyReady={otherPartyReady}
        />
      )}

      {/* Video Chat Window */}
      {currentSession && (
        <VideoChatWindow
          session={currentSession}
          userRole={userProfile?.role || 'user'}
          isOpen={videoChatOpen}
          onClose={handleCloseVideoChat}
        />
      )}
    </div>
  );
} 