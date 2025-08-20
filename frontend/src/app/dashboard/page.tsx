'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import CompanionAgenda from '@/components/CompanionAgenda';
import SessionCountdown from '@/components/SessionCountdown';
import SessionReadyModal from '@/components/SessionReadyModal';
import VideoChatWindow from '@/components/VideoChatWindow';
import { useNotifications } from '@/hooks/useNotifications';
import { useSessionReady } from '@/hooks/useSessionReady';
import { useToast } from '@/hooks/useToast';
import NotificationCenter from '@/components/NotificationCenter';

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
  profilePhoto?: { url: string } | null;
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
  photoUrl?: string | null;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  console.log('=== DASHBOARD RENDER ===');
  console.log('isLoaded:', isLoaded);
  console.log('User:', user);
  console.log('User ID:', user?.id);
  console.log('User emailAddresses:', user?.emailAddresses);
  console.log('User email:', user?.emailAddresses?.[0]?.emailAddress);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [showAgenda, setShowAgenda] = useState(false);
  const { showSuccess, showError, showLoading, dismissLoading } = useToast();

  // Estado para filtros de sesiones
  const [sessionFilter, setSessionFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed'>('all');

  // Estado para paginación de sesiones
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;

  // Estado para rastrear sesiones que ya han mostrado notificación
  const [notifiedSessions, setNotifiedSessions] = useState<Set<number>>(new Set());

  // Ref para almacenar el estado anterior de las sesiones
  const previousSessionsRef = useRef<Session[]>([]);

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
    userReady,
    currentSession,
    readyModalOpen,
    videoChatOpen,
    otherPartyReady,
    modalDisabled,
    handleCloseReadyModal,
    handleReady,
    handleNotReady,
    handleCloseVideoChat
  } = useSessionReady({
    sessions,
    userRole: userProfile?.role || 'user',
    userId: userProfile?.id || 0
  });

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      // Verificar que user tenga emailAddresses antes de acceder
      if (!user.emailAddresses || user.emailAddresses.length === 0) {
        console.log('⚠️ Usuario no tiene emailAddresses, usando clerkUserId como fallback');
        const clerkResponse = await fetch(`/api/user-profiles?filters[clerkUserId][$eq]=${user?.id}&populate=*`);
        if (clerkResponse.ok) {
          const clerkData = await clerkResponse.json();
          if (clerkData.data && clerkData.data.length > 0) {
            setUserProfile(clerkData.data[0]);
          }
        }
        return;
      }

      const response = await fetch(`/api/user-profiles?filters[email][$eq]=${user.emailAddresses[0].emailAddress}&populate=*`);

      if (response.ok) {
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          setUserProfile(data.data[0]);
        } else {
          // Intentar buscar por clerkUserId como fallback
          const clerkResponse = await fetch(`/api/user-profiles?filters[clerkUserId][$eq]=${user?.id}&populate=*`);
          if (clerkResponse.ok) {
            const clerkData = await clerkResponse.json();
            if (clerkData.data && clerkData.data.length > 0) {
              setUserProfile(clerkData.data[0]);
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

  // Función auxiliar para crear notificaciones de cambio de estado
  const createSessionStatusNotification = async (session: Session, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      console.log(`🔄 Creando notificación para sesión ${session.id} con estado ${status}`);

      // Verificar que no se haya creado ya una notificación para esta sesión y estado
      const notificationKey = `${session.id}_${status}`;
      if (notifiedSessions.has(session.id)) {
        console.log(`⚠️ Notificación ya creada para sesión ${session.id} con estado ${status}, saltando...`);
        return;
      }

      const statusText = {
        confirmed: 'confirmada',
        cancelled: 'cancelada',
        completed: 'completada'
      }[status];

      const companionName = session.companion?.fullName || 'el acompañante';
      const sessionTitle = `Sesión con ${companionName}`;
      const recipientId = userProfile?.id || 0;

      console.log(`📝 Datos de notificación:`, {
        recipientId,
        userProfileId: userProfile?.id,
        title: `Sesión ${statusText}`,
        message: `Tu sesión con ${companionName}: "${sessionTitle}" ha sido ${statusText}.`,
        type: `session_${status}`,
        priority: status === 'cancelled' ? 'high' : 'medium'
      });

      // Verificar que recipientId sea válido
      if (!recipientId || recipientId === 0) {
        console.error(`❌ recipientId inválido: ${recipientId}`);
        return;
      }

      console.log(`🚀 Enviando notificación al endpoint /api/notifications...`);

      // Crear notificación usando el servicio
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          title: `Sesión ${statusText}`,
          message: `Tu sesión con ${companionName}: "${sessionTitle}" ha sido ${statusText}.`,
          type: `session_${status}`,
          priority: status === 'cancelled' ? 'high' : 'medium'
        }),
      });

      console.log(`📊 Respuesta del endpoint /api/notifications:`, response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Notificación de sesión ${status} creada exitosamente:`, result);
      } else {
        const errorText = await response.text();
        console.error(`❌ Error al crear notificación de sesión ${status}:`, response.status, errorText);
      }
    } catch (error) {
      console.error(`❌ Error al crear notificación de sesión ${status}:`, error);
    }
  };

  const fetchSessions = async () => {
    if (!userProfile) return;

    // Debug: Log del userProfile
    console.log('🔍 Debug fetchSessions - userProfile:', {
      id: userProfile.id,
      role: userProfile.role,
      fullName: userProfile.fullName
    });

    try {
      const endpoint = userProfile.role === 'companion'
        ? `/api/sessions/companion/${userProfile.id}`
        : `/api/sessions/user/${userProfile.id}`;
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();

        const newSessions = data.data || [];

        // Detectar cambios de estado en las sesiones usando el ref anterior
        if (userProfile.role === 'user') {
          console.log('🔍 Verificando cambios de estado para usuario...');
          console.log('Sesiones anteriores:', previousSessionsRef.current.map((s: Session) => ({ id: s.id, status: s.status })));
          console.log('Nuevas sesiones:', newSessions.map((s: Session) => ({ id: s.id, status: s.status })));

          newSessions.forEach((session: Session) => {
            const previousSession = previousSessionsRef.current.find(s => s.id === session.id);
            console.log(`📋 Sesión ${session.id}:`, {
              previousStatus: previousSession?.status,
              newStatus: session.status,
              hasChanged: previousSession && previousSession.status !== session.status,
              alreadyNotified: notifiedSessions.has(session.id)
            });

            // Solo procesar si hay un cambio real de estado
            if (previousSession && previousSession.status !== session.status) {
              console.log(`🔄 Cambio de estado detectado para sesión ${session.id}: ${previousSession.status} -> ${session.status}`);

              // Solo mostrar notificación si no se ha mostrado antes
              if (!notifiedSessions.has(session.id)) {
                console.log(`🔔 Creando notificación para sesión ${session.id} con estado ${session.status}`);

                if (session.status === 'confirmed') {
                  showSuccess(`¡Tu sesión con ${session.companion?.fullName || 'el acompañante'} ha sido confirmada!`);

                  // Debug: Log antes de crear la notificación
                  console.log(`🔔 DEBUG: Creando notificación para sesión confirmada:`, {
                    sessionId: session.id,
                    sessionStatus: session.status,
                    userProfileId: userProfile?.id,
                    userProfileRole: userProfile?.role,
                    companionName: session.companion?.fullName
                  });

                  // Crear notificación persistente
                  createSessionStatusNotification(session, 'confirmed');

                  setNotifiedSessions(prev => new Set([...prev, session.id]));
                } else if (session.status === 'cancelled') {
                  showError(`Tu sesión con ${session.companion?.fullName || 'el acompañante'} ha sido cancelada.`);

                  // Crear notificación persistente
                  createSessionStatusNotification(session, 'cancelled');

                  setNotifiedSessions(prev => new Set([...prev, session.id]));
                } else if (session.status === 'completed') {
                  showSuccess(`¡Tu sesión con ${session.companion?.fullName || 'el acompañante'} ha sido completada!`);

                  // Crear notificación persistente
                  createSessionStatusNotification(session, 'completed');

                  setNotifiedSessions(prev => new Set([...prev, session.id]));
                }
              } else {
                console.log(`⚠️ Sesión ${session.id} ya fue notificada, saltando...`);
              }
            } else if (!previousSession) {
              console.log(`🆕 Nueva sesión ${session.id} con estado ${session.status}`);
            } else {
              console.log(`➡️ Sesión ${session.id} sin cambios de estado`);
            }
          });
        }

        // Actualizar el ref con las nuevas sesiones ANTES de actualizar el estado
        previousSessionsRef.current = newSessions;
        console.log('📝 Ref actualizado con nuevas sesiones:', newSessions.length);

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
      const response = await fetch('/api/sessions/companions/available');
      if (response.ok) {
        const data = await response.json();
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

  const handleAcceptSession = async (sessionId: number) => {
    const loadingToast = showLoading('Aceptando sesión...');
    try {
      const response = await fetch(`/api/sessions/${sessionId}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        showSuccess('Sesión aceptada exitosamente');
        fetchSessions(); // Recargar sesiones
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
      showError('Error al aceptar sesión');
    } finally {
      dismissLoading(loadingToast);
    }
  };

  const handleSessionCreated = () => {
    fetchSessions();
    setShowBooking(false);
  };

  // Función para limpiar notificaciones antiguas (opcional)
  const clearOldNotifications = () => {
    // Limpiar notificaciones de sesiones que ya no existen
    if (sessions.length > 0) {
      const currentSessionIds = new Set(sessions.map(s => s.id));
      setNotifiedSessions(prev => {
        const newSet = new Set(prev);
        for (const id of prev) {
          if (!currentSessionIds.has(id)) {
            newSet.delete(id);
          }
        }
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (isLoaded && user && user.emailAddresses && user.emailAddresses.length > 0) {
      fetchUserProfile();
      fetchCompanions();
    }
  }, [isLoaded, user]);

  // Debug: Log cuando userProfile cambie
  useEffect(() => {
    console.log('🔍 Debug userProfile changed:', {
      userProfileId: userProfile?.id,
      userProfileRole: userProfile?.role,
      userProfileFullName: userProfile?.fullName,
      hasUserProfile: !!userProfile,
      loading
    });
  }, [userProfile, loading]);

  // Debug: Log cuando notifiedSessions cambie
  useEffect(() => {
    console.log('🔔 Debug notifiedSessions changed:', {
      count: notifiedSessions.size,
      sessionIds: Array.from(notifiedSessions)
    });
  }, [notifiedSessions]);

  // Cargar sesiones cuando userProfile esté disponible
  useEffect(() => {
    if (userProfile) {
      fetchSessions();
      if (userProfile.role === 'user') {
        fetchCompanions();
      }
    }
  }, [userProfile]);

  // Polling para actualizar sesiones automáticamente (para acompañantes también)
  useEffect(() => {
    if (userProfile) {
      const interval = setInterval(() => {
        fetchSessions();
      }, 10000); // Verificar cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [userProfile]);

  // Limpiar notificaciones antiguas cuando cambien las sesiones
  useEffect(() => {
    if (sessions.length > 0) {
      clearOldNotifications();
    }
  }, [sessions]);

  // Mostrar loading mientras Clerk se carga
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Verificar si el usuario está autenticado
  if (isLoaded && !user) {
    router.push('/sign-in');
    return null;
  }

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
        {/* Header con información del usuario y acciones */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {(() => {
                // Resolver URL de foto de perfil desde múltiples formas posibles
                const anyProfile: any = userProfile as any;
                let url: string | null = null;
                if (anyProfile?.profilePhoto?.url) {
                  url = anyProfile.profilePhoto.url;
                } else if (typeof anyProfile?.profilePhoto === 'string') {
                  url = anyProfile.profilePhoto;
                } else if (anyProfile?.attributes?.profilePhoto?.data?.attributes?.url) {
                  url = anyProfile.attributes.profilePhoto.data.attributes.url;
                } else if (anyProfile?.profilePhoto?.data?.attributes?.url) {
                  url = anyProfile.profilePhoto.data.attributes.url;
                }
                if (url && !url.startsWith('http')) {
                  const base = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
                  url = `${base}${url}`;
                }
                return url ? (
                  <img
                    src={url}
                    alt="Foto de perfil"
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-lg">
                      {userProfile?.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                );
              })()}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ¡Hola, {userProfile?.fullName || 'Usuario'}!
                </h1>
                <p className="text-gray-600">
                  {userProfile?.role === 'user' ? 'Cliente' : 'Acompañante'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <NotificationCenter userId={userProfile?.id || 0} />
            <button
              onClick={() => router.push('/dashboard/edit-profile')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Editar Perfil
            </button>
            <button
              onClick={() => router.push('/dashboard/buy-credits')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Comprar Créditos
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - User Actions */}
          <div className={`${userProfile.role === 'user' ? 'lg:col-span-4' : 'lg:col-span-3'} space-y-6`}>
            {/* Session Booking for Users */}
            {userProfile.role === 'user' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <SessionBooking
                  companions={companions}
                  userProfile={userProfile}
                  onSessionCreated={handleSessionCreated}
                />
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

            {/* Sessions List - Para usuarios y acompañantes */}
            {(!showAgenda) && (
              <div className="lg:w-2/3">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  {/* Header con título y acciones */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {userProfile.role === 'user' ? 'Mis Sesiones' : 'Mi Agenda de Sesiones'}
                        {sessionFilter !== 'all' && (
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            ({getFilteredSessions().length} sesiones {sessionFilter === 'pending' ? 'pendientes' :
                              sessionFilter === 'confirmed' ? 'confirmadas' :
                                sessionFilter === 'completed' ? 'completadas' :
                                  sessionFilter === 'cancelled' ? 'canceladas' : ''})
                          </span>
                        )}
                      </h1>
                      <p className="text-gray-600 mt-1">
                        Gestiona tus sesiones programadas y revisa el historial
                      </p>
                    </div>

                    {/* Botón de comprar créditos y campanita de notificaciones */}
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => window.open('/dashboard/create-offer', '_blank')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Comprar Créditos
                      </button>

                      {userProfile && userProfile.id > 0 && (
                        <NotificationCenter userId={userProfile.id} />
                      )}
                    </div>
                  </div>

                  {/* Filtros de sesiones para usuarios y acompañantes */}
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

                  {sessions.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {userProfile.role === 'user' ? 'No tienes sesiones programadas' : 'No tienes sesiones asignadas'}
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
                            No hay sesiones {sessionFilter !== 'all' ? `en estado "${sessionFilter}"` : ''}
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
                                    href={`/dashboard/professionals/${userProfile.role === 'user' ? session.companion?.id : session.user?.id}`}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    {userProfile.role === 'user'
                                      ? (session.companion?.fullName || 'Acompañante')
                                      : (session.user?.fullName || 'Usuario')
                                    }
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

                              {/* Reabrir modal o entrar al videochat según momento de la sesión */}
                              {(() => {
                                // Para acompañantes, permitir también sesiones pending
                                const allowedStatuses = userProfile.role === 'companion' ? ['pending', 'confirmed'] : ['confirmed'];
                                if (!allowedStatuses.includes(session.status)) {
                                  console.log(`🔴 Sesión ${session.id}: Estado ${session.status} no permitido para ${userProfile.role}`);
                                  return null;
                                }

                                const now = new Date();
                                const start = new Date(session.startTime);
                                const end = new Date(session.endTime);
                                const oneMinuteBefore = new Date(start.getTime() - 60 * 1000);
                                const fiveMinutesAfter = new Date(start.getTime() + 5 * 60 * 1000);

                                // Para acompañantes, mostrar botón en ventanas más amplias
                                let inPrepWindow, inActiveWindow;

                                if (userProfile.role === 'companion') {
                                  // Para acompañantes: desde 5 minutos antes hasta 10 minutos después
                                  const fiveMinutesBefore = new Date(start.getTime() - 5 * 60 * 1000);
                                  const tenMinutesAfter = new Date(start.getTime() + 10 * 60 * 1000);
                                  inPrepWindow = now >= fiveMinutesBefore && now <= tenMinutesAfter && now < start;
                                  inActiveWindow = now >= start && now <= end;

                                  console.log(`👥 Acompañante - Sesión ${session.id}:`, {
                                    now: now.toISOString(),
                                    start: start.toISOString(),
                                    fiveMinutesBefore: fiveMinutesBefore.toISOString(),
                                    tenMinutesAfter: tenMinutesAfter.toISOString(),
                                    inPrepWindow,
                                    inActiveWindow,
                                    status: session.status
                                  });
                                } else {
                                  // Para usuarios: desde 1 minuto antes hasta 5 minutos después
                                  inPrepWindow = now >= oneMinuteBefore && now <= fiveMinutesAfter && now < start;
                                  inActiveWindow = now >= start && now <= end;

                                  console.log(`👤 Usuario - Sesión ${session.id}:`, {
                                    now: now.toISOString(),
                                    start: start.toISOString(),
                                    oneMinuteBefore: oneMinuteBefore.toISOString(),
                                    fiveMinutesAfter: fiveMinutesAfter.toISOString(),
                                    inPrepWindow,
                                    inActiveWindow,
                                    status: session.status
                                  });
                                }

                                // Para acompañantes, mostrar todas las sesiones pendientes
                                if (userProfile.role === 'companion' && session.status === 'pending') {
                                  console.log(`✅ Acompañante - Sesión ${session.id} pendiente: Mostrando para aceptar`);
                                  return (
                                    <div className="mt-3 flex justify-end">
                                      <button
                                        onClick={() => handleAcceptSession(session.id)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                      >
                                        Aceptar Sesión
                                      </button>
                                    </div>
                                  );
                                }

                                // Para otras sesiones, mantener la lógica de ventana de tiempo
                                if (!inPrepWindow && !inActiveWindow) {
                                  console.log(`⏰ Sesión ${session.id}: Fuera de ventana de tiempo`);
                                  return null;
                                }

                                console.log(`✅ Sesión ${session.id}: Mostrando botón - Prep: ${inPrepWindow}, Active: ${inActiveWindow}`);

                                return (
                                  <div className="mt-3 flex justify-end">
                                    {inPrepWindow ? (
                                      <button
                                        onClick={() => {
                                          // Reabrir modal de preparación
                                          // forceOpenModal eliminado - usar lógica normal
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                      >
                                        {userProfile.role === 'user' ? 'Reabrir preparación' : 'Preparar sesión'}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          const url = `/dashboard/videochat/${session.id}?role=${userProfile.role}&userId=${userProfile.id}`;
                                          window.open(url, '_blank');
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                      >
                                        {userProfile.role === 'user' ? 'Entrar al videochat' : 'Iniciar sesión'}
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}

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
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions (oculto para usuarios para liberar ancho) */}
          {userProfile.role !== 'user' && (
            <div className="space-y-6 lg:col-span-1">
              {/* Quick Actions */}
              {/* Botón de comprar créditos se movió al header; no duplicar aquí para usuarios */}

              {/* Eliminado: Notificaciones duplicadas para acompañantes (sección lateral derecha) */}

              {/* Available Companions removed from sidebar to free width for Reservar Sesión */}
            </div>
          )}
        </div>
      </div>

      {/* Session Ready Modal */}
      {readyModalOpen && currentSession && (
        <SessionReadyModal
          session={currentSession}
          userRole={userProfile?.role || 'user'}
          isOpen={readyModalOpen}
          onClose={handleCloseReadyModal}
          onReady={handleReady}
          onNotReady={handleNotReady}
          isOtherPartyReady={otherPartyReady}
          isUserReady={userReady}
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