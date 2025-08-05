'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  Star,
  MapPin
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';

interface UserProfile {
  id: number;
  role: 'client' | 'professional';
  fullName: string;
  email: string;
  hourlyRate?: number;
  totalOffers?: number;
  completedJobs?: number;
  averageRating?: number;
  totalEarnings?: number;
}

interface Offer {
  id: number;
  title: string;
  description: string;
  location: string;
  dateTime: string;
  duration: number;
  status: string;

  applicants?: any[];
  hasApplied?: boolean;
  professional?: {
    id: number;
    fullName: string;
    hourlyRate: number;
  };
  attributes?: {
    applicants?: any[];
  };
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState<number | null>(null);
  const [cancelingFrom, setCancelingFrom] = useState<number | null>(null);
  const { showSuccess, showError, showLoading, dismissLoading } = useNotifications();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchData = async () => {
      try {
        // Obtener perfil del usuario
        const profileResponse = await fetch('/api/onboarding/profile-form');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('Dashboard: Datos del perfil recibidos:', profileData);
          console.log('Dashboard: Rol del usuario:', profileData.data?.role);
          console.log('Dashboard: Nombre del usuario:', profileData.data?.fullName);
          console.log('Dashboard: Datos completos del perfil:', JSON.stringify(profileData.data, null, 2));
          setUserProfile(profileData.data);
        }

        // Obtener ofertas
        const offersResponse = await fetch('/api/offers');
        if (offersResponse.ok) {
          const offersData = await offersResponse.json();
          setOffers(offersData.offers || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner
            size="lg"
            color="blue"
            text="Cargando tu dashboard..."
            className="min-h-[400px]"
          />
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">No se pudo cargar el perfil</p>
          </div>
        </div>
      </div>
    );
  }

  const isClient = userProfile.role === 'client';
  const isProfessional = userProfile.role === 'professional';

  const handleApply = async (offerId: number) => {
    if (!isProfessional) return;

    setApplyingTo(offerId);
    const loadingToast = showLoading('Postulándose a la oferta...');

    try {
      const response = await fetch('/api/offers/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Postulación exitosa:', data);

        // Actualizar el estado local para mostrar que ya se postuló
        setOffers(prevOffers =>
          prevOffers.map(offer =>
            offer.id === offerId
              ? { ...offer, hasApplied: true }
              : offer
          )
        );

        dismissLoading(loadingToast);
        showSuccess('¡Postulación enviada exitosamente! 🎉', 5000);
      } else {
        let errorMessage = 'Error al postularse';
        try {
          const errorData = await response.json();
          // Asegurar que errorMessage sea siempre un string
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          } else if (errorData.error && typeof errorData.error === 'object') {
            errorMessage = errorData.error.message || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        dismissLoading(loadingToast);
        showError(errorMessage);
      }
    } catch (error) {
      console.error('Error al postularse:', error);
      dismissLoading(loadingToast);
      showError('Error al postularse a la oferta');
    } finally {
      setApplyingTo(null);
    }
  };

  const handleCancelApplication = async (offerId: number) => {
    if (!isProfessional) return;

    setCancelingFrom(offerId);
    const loadingToast = showLoading('Cancelando postulación...');

    try {
      const response = await fetch('/api/offers/cancel-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Postulación cancelada exitosamente:', data);

        // Actualizar el estado local para mostrar que ya no se postuló
        setOffers(prevOffers =>
          prevOffers.map(offer =>
            offer.id === offerId
              ? { ...offer, hasApplied: false }
              : offer
          )
        );

        dismissLoading(loadingToast);
        showSuccess('¡Postulación cancelada exitosamente! ✅', 4000);
      } else {
        let errorMessage = 'Error al cancelar la postulación';
        try {
          const errorData = await response.json();
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          } else if (errorData.error && typeof errorData.error === 'object') {
            errorMessage = errorData.error.message || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        dismissLoading(loadingToast);
        showError(errorMessage);
      }
    } catch (error) {
      console.error('Error al cancelar postulación:', error);
      dismissLoading(loadingToast);
      showError('Error al cancelar la postulación');
    } finally {
      setCancelingFrom(null);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ¡Hola, {userProfile.fullName || user?.firstName || 'Usuario'}!
              </h1>

              <p className="text-gray-600 mt-2">
                {isClient
                  ? 'Gestiona tus ofertas y encuentra profesionales para el cuidado de tus seres queridos'
                  : 'Encuentra oportunidades de trabajo y ayuda a familias que necesitan tu experiencia'
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Indicador de tipo de cuenta */}
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${isClient
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-green-100 text-green-800 border border-green-200'
                }`}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isClient ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                  {isClient ? 'Cliente' : 'Profesional'}
                </div>
              </div>

              {/* Botón de tareas aceptadas para profesionales */}
              {!isClient && (
                <button
                  onClick={() => router.push('/dashboard/accepted-tasks')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Mis Tareas Aceptadas
                </button>
              )}

              {/* Botón de editar perfil */}
              <button
                onClick={() => router.push('/dashboard/edit-profile')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={isClient ? Users : DollarSign}
            title={isClient ? 'Ofertas Creadas' : 'Precio por Hora'}
            value={isClient ? offers.length : `$${userProfile.hourlyRate || 0}`}
            color="blue"
          />

          <StatsCard
            icon={Clock}
            title={isClient ? 'Horas Contratadas' : 'Horas Trabajadas'}
            value={userProfile.completedJobs || 0}
            color="green"
          />

          <StatsCard
            icon={isClient ? DollarSign : DollarSign}
            title={isClient ? 'Presupuesto Total' : 'Total Facturado'}
            value={isClient ? `$${userProfile.hourlyRate || 0}` : `$${userProfile.totalEarnings || 0}`}
            color="yellow"
          />

          <StatsCard
            icon={Star}
            title="Calificación"
            value={`${userProfile.averageRating || 0}/5`}
            color="purple"
          />
        </div>

        {/* Recent Offers Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {isClient ? 'Mis Ofertas' : `Ofertas Disponibles (${offers.length})`}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push('/dashboard/offer-history')}
                  className="flex items-center bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Historial
                </button>
                {isClient && (
                  <button
                    onClick={() => router.push('/dashboard/create-offer')}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Oferta
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {offers.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={isClient ? 'No tienes ofertas creadas' : 'No hay ofertas disponibles'}
                description={
                  isClient
                    ? 'Crea tu primera oferta para encontrar profesionales que te ayuden con el cuidado de tus seres queridos'
                    : 'Las ofertas aparecerán aquí cuando estén disponibles. Mientras tanto, asegúrate de tener tu perfil completo.'
                }
                action={
                  isClient
                    ? {
                      label: 'Crear Primera Oferta',
                      onClick: () => router.push('/dashboard/create-offer'),
                      variant: 'primary'
                    }
                    : undefined
                }
              />
            ) : (
              <div className="space-y-4">
                {offers.slice(0, 5).map((offer) => (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{offer.title}</h4>
                          <button
                            onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm pr-2"
                          >
                            Ver Detalles
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{offer.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {offer.location}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(offer.dateTime).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {offer.duration}h
                          </div>
                          {isClient && (
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {offer.attributes?.applicants?.length || offer.applicants?.length || 0} postulantes
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={offer.status as any} />

                        {isProfessional && offer.status === 'published' && (
                          <button
                            onClick={() => offer.hasApplied ? handleCancelApplication(offer.id) : handleApply(offer.id)}
                            disabled={applyingTo === offer.id || cancelingFrom === offer.id}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${offer.hasApplied
                              ? cancelingFrom === offer.id
                                ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                                : 'bg-red-100 text-red-800 hover:bg-red-200 hover:scale-105'
                              : applyingTo === offer.id
                                ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200 hover:scale-105'
                              }`}
                          >
                            {offer.hasApplied
                              ? cancelingFrom === offer.id
                                ? (
                                  <div className="flex items-center">
                                    <LoadingSpinner size="sm" color="gray" />
                                    <span className="ml-1">Cancelando...</span>
                                  </div>
                                )
                                : 'Cancelar Postulación'
                              : applyingTo === offer.id
                                ? (
                                  <div className="flex items-center">
                                    <LoadingSpinner size="sm" color="blue" />
                                    <span className="ml-1">Postulándose...</span>
                                  </div>
                                )
                                : 'Postularse'
                            }
                          </button>
                        )}

                        {isProfessional && offer.status === 'accepted' && offer.professional && offer.professional.id === userProfile.id && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Postulación Aceptada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 