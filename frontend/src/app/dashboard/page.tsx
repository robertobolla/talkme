'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  XCircle,
  User
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
  hourlyRate?: number;
  status: string;
  isOnline?: boolean;
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

  console.log('=== DASHBOARD RENDER ===');
  console.log('User:', user);
  console.log('User ID:', user?.id);
  console.log('User email:', user?.emailAddresses?.[0]?.emailAddress);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [showAgenda, setShowAgenda] = useState(false);
  const { showSuccess, showError, showLoading, dismissLoading } = useNotifications();

  // Estado para filtros de sesiones
  const [sessionFilter, setSessionFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed'>('all');

  // Estado para paginación de sesiones
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;

  // Estado para rastrear sesiones que ya han mostrado notificación
  const [notifiedSessions, setNotifiedSessions] = useState<Set<number>>(new Set());

  // Función para filtrar sesiones según el estado seleccionado
  const getFilteredSessions = () => {
    if (sessionFilter === 'all') {
      return sessions;
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

  // Session ready logic
  const {
    currentSession,
    readyModalOpen,
    videoChatOpen,
    otherPartyReady,
    modalDisabled,
    handleCloseReadyModal,
    handleReady,
    handleNotReady,
    handleCloseVideoChat,
    forceCloseModal,
    toggleModalDisabled
  } = useSessionReady({
    sessions,
    userRole: userProfile?.role || 'user',
    userId: userProfile?.id || 0
  });

  const fetchUserProfile = async () => {
    if (!user) return;

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
      console.log('=== FETCHING SESSIONS ===');
      console.log('User Profile ID:', userProfile.id);
      console.log('User Role:', userProfile.role);
      const endpoint = userProfile.role === 'companion'
        ? `/api/sessions/companion/${userProfile.id}`
        : `/api/sessions/user/${userProfile.id}`;
      console.log('Using endpoint:', endpoint);
      const response = await fetch(endpoint);
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Sessions data:', data);
        console.log('=== SESSIONS ORDER VERIFICATION ===');
        console.log('Total sessions loaded:', data.data?.length || 0);
        if (data.data && data.data.length > 0) {
          console.log('First session (should be most recent):', {
            id: data.data[0].id,
            createdAt: data.data[0].createdAt,
            title: data.data[0].title,
            status: data.data[0].status
          });
          if (data.data.length > 1) {
            console.log('Second session:', {
              id: data.data[1].id,
              createdAt: data.data[1].createdAt,
              title: data.data[1].title,
              status: data.data[1].status
            });
          }
        }

        const newSessions = data.data || [];

        // Detectar cambios de estado en las sesiones
        if (userProfile.role === 'user') {
          newSessions.forEach((session: Session) => {
            const existingSession = sessions.find(s => s.id === session.id);

            // Si la sesión existe y el estado cambió
            if (existingSession && existingSession.status !== session.status) {
              const sessionKey = `${session.id}-${session.status}`;

              // Solo mostrar notificación si no se ha mostrado antes
              if (!notifiedSessions.has(session.id)) {
                if (session.status === 'confirmed') {
                  showSuccess(`¡Tu sesión con ${session.companion?.fullName || 'el acompañante'} ha sido confirmada!`);
                  setNotifiedSessions(prev => new Set([...prev, session.id]));
                } else if (session.status === 'cancelled') {
                  showError(`Tu sesión con ${session.companion?.fullName || 'el acompañante'} ha sido cancelada.`);
                  setNotifiedSessions(prev => new Set([...prev, session.id]));
                } else if (session.status === 'completed') {
                  showSuccess(`Tu sesión con ${session.companion?.fullName || 'el acompañante'} ha sido completada.`);
                  setNotifiedSessions(prev => new Set([...prev, session.id]));
                }
              }
            }
          });
        }

        setSessions(newSessions);
      } else {
        console.error('Error response:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchCompanions = async () => {
    try {
      console.log('=== FETCHING COMPANIONS ===');
      const response = await fetch('/api/sessions/companions/available');
      console.log('Companions response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Companions data:', data);
        setCompanions(data);
      } else {
        console.error('Error fetching companions:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
      }
    } catch (error) {
      console.error('Error fetching companions:', error);
    }
  };

  const handleSessionCreated = () => {
    fetchSessions();
    setShowBooking(false);
  };

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

  // Polling para actualizar sesiones automáticamente (solo para usuarios)
  useEffect(() => {
    if (userProfile && userProfile.role === 'user') {
      const interval = setInterval(() => {
        fetchSessions();
      }, 10000); // Verificar cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [userProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Perfil no encontrado</h2>
          <p className="text-gray-600">Por favor, completa tu perfil primero.</p>
          <button
            onClick={() => router.push('/onboarding')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Completar Perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bienvenido, {userProfile.fullName}
              </h1>
              <p className="text-gray-600">
                {userProfile.role === 'user' ? 'Panel de Usuario' : 'Panel de Acompañante'}
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/edit-profile')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <User className="w-4 h-4 mr-2" />
              Editar Perfil
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Saldo"
            value={`$${userProfile.balance} USDT`}
            icon={DollarSign}
            color="green"
          />
          {userProfile.role === 'companion' ? (
            <>
              <StatsCard
                title="Ganancias Totales"
                value={`$${userProfile.totalEarnings} USDT`}
                icon={DollarSign}
                color="blue"
              />
              <StatsCard
                title="Tarifa por Hora"
                value={`$${userProfile.hourlyRate || 0} USDT`}
                icon={Clock}
                color="purple"
                onClick={() => router.push('/dashboard/edit-profile')}
              />
              <StatsCard
                title="Calificación Promedio"
                value={`${userProfile.averageRating} ⭐`}
                icon={Star}
                color="yellow"
              />
            </>
          ) : (
            <>
              <StatsCard
                title="Sesiones Completadas"
                value={sessions.filter(s => s.status === 'completed').length}
                icon={Calendar}
                color="blue"
              />
              <StatsCard
                title="Acompañantes Disponibles"
                value={companions.length}
                icon={Users}
                color="green"
              />
            </>
          )}
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
            {userProfile.role === 'companion' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Mi Agenda</h2>
                  <button
                    onClick={() => setShowAgenda(!showAgenda)}
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

            {/* Sessions List - Solo para usuarios */}
            {(!showAgenda && userProfile.role === 'user') && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Título solo para usuarios */}
                {userProfile.role === 'user' && (
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    Mis Sesiones
                    {sessionFilter !== 'all' && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({getFilteredSessions().length} sesiones {sessionFilter === 'pending' ? 'pendientes' :
                          sessionFilter === 'confirmed' ? 'confirmadas' :
                            sessionFilter === 'completed' ? 'completadas' :
                              sessionFilter === 'cancelled' ? 'canceladas' : ''})
                      </span>
                    )}
                  </h2>
                )}

                {/* Filtros de sesiones solo para usuarios */}
                {userProfile.role === 'user' && (
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
                )}

                {sessions.length === 0 && userProfile.role === 'user' ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No tienes sesiones programadas
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Debug: {sessions.length} sesiones cargadas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getCurrentPageSessions().length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          No hay sesiones {sessionFilter !== 'all' ? `en estado &quot;${sessionFilter}&quot;` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Mostrando {getCurrentPageSessions().length} de {getFilteredSessions().length} sesiones
                        </p>
                      </div>
                    ) : (
                      <>
                        {getCurrentPageSessions().map((session) => (
                          <div
                            key={session.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-lg text-gray-800">
                                Sesión con{' '}
                                <Link
                                  href={`/dashboard/professionals/${session.companion?.id}`}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  {session.companion?.fullName || 'Acompañante'}
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
                      </>
                    )}
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
                      onClick={() => setShowAgenda(!showAgenda)}
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

      {/* Emergency Modal Controls */}
      {readyModalOpen && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white p-3 rounded-lg shadow-lg">
          <div className="text-sm font-medium mb-2">Modal de Sesión Abierto</div>
          <div className="space-y-2">
            <button
              onClick={forceCloseModal}
              className="w-full bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded text-xs"
            >
              Cerrar Modal (Emergencia)
            </button>
            <button
              onClick={toggleModalDisabled}
              className={`w-full px-3 py-1 rounded text-xs ${modalDisabled
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
                } text-white`}
            >
              {modalDisabled ? 'Habilitar Modal' : 'Deshabilitar Modal'}
            </button>
          </div>
        </div>
      )}

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