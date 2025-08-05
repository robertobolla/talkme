'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Star,
  CheckCircle,
  User,
  X,
  Filter,
  Eye
} from 'lucide-react';

interface Offer {
  id: number;
  title: string;
  description: string;
  location: string;
  dateTime: string;
  duration: number;
  status: string;
  client?: any;
  applicants?: any[];
  professional?: any;
  createdAt: string;
}

interface UserProfile {
  role: 'client' | 'professional';
  fullName: string;
}

type FilterStatus = 'all' | 'published' | 'accepted' | 'cancelled' | 'completed';

export default function OfferHistoryPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { showError } = useNotifications();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('OfferHistoryPage: Obteniendo datos del historial');

        // Obtener perfil del usuario
        const profileResponse = await fetch('/api/onboarding/profile-form');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('OfferHistoryPage: Perfil del usuario:', profileData.data);
          setUserProfile(profileData.data);
        }

        // Obtener todas las ofertas del usuario
        const offersResponse = await fetch('/api/offers/history');
        if (offersResponse.ok) {
          const offersData = await offersResponse.json();
          console.log('OfferHistoryPage: Ofertas obtenidas:', offersData.offers);
          setOffers(offersData.offers || []);
        } else {
          console.error('OfferHistoryPage: Error obteniendo ofertas:', offersResponse.status);
          showError('Error al cargar el historial de ofertas');
        }
      } catch (error) {
        console.error('OfferHistoryPage: Error obteniendo datos:', error);
        showError('Error al cargar el historial');
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando historial de ofertas...</p>
          </div>
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

  // Filtrar ofertas según el estado seleccionado
  const filteredOffers = offers.filter(offer => {
    if (filterStatus === 'all') return true;
    return offer.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publicada';
      case 'accepted':
        return 'Aceptada';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                Historial de {isClient ? 'Mis Ofertas' : 'Ofertas'}
              </h1>
              <p className="text-gray-600 mt-2">
                {isClient
                  ? 'Todas las ofertas que has creado y su estado actual'
                  : 'Todas las ofertas donde te has postulado'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
            <div className="flex space-x-2">
              {[
                { value: 'all', label: 'Todas' },
                { value: 'published', label: 'Publicadas' },
                { value: 'accepted', label: 'Aceptadas' },
                { value: 'cancelled', label: 'Canceladas' },
                { value: 'completed', label: 'Completadas' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value as FilterStatus)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterStatus === filter.value
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de ofertas */}
        <div className="space-y-4">
          {filteredOffers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filterStatus === 'all' ? 'No hay ofertas' : `No hay ofertas ${filterStatus}`}
              </h3>
              <p className="text-gray-600">
                {filterStatus === 'all'
                  ? 'Aún no tienes ofertas en tu historial'
                  : `No hay ofertas con estado "${filterStatus}"`
                }
              </p>
            </div>
          ) : (
            filteredOffers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{offer.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(offer.status)}`}>
                        {getStatusText(offer.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{offer.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{offer.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(offer.dateTime)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{offer.duration} horas</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Creada: {formatDate(offer.createdAt)}</span>
                      </div>
                    </div>

                    {/* Información específica según el estado */}
                    {offer.status === 'accepted' && offer.professional && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Profesional Aceptado
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{offer.professional.fullName}</p>
                              {offer.professional.hourlyRate && (
                                <p className="text-sm text-gray-600">
                                  Tarifa: ${offer.professional.hourlyRate}/hora
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/dashboard/professionals/${offer.professional.id}`)}
                            className="flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Perfil
                          </button>
                        </div>
                      </div>
                    )}

                    {offer.status === 'cancelled' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                          <X className="w-5 h-5 mr-2" />
                          Oferta Cancelada
                        </h4>
                        <p className="text-red-700 text-sm">
                          Esta oferta fue cancelada y ya no acepta nuevas postulaciones.
                        </p>
                      </div>
                    )}

                    {isClient && offer.applicants && offer.applicants.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          Postulantes ({offer.applicants.length})
                        </h4>
                        <div className="space-y-2">
                          {offer.applicants.slice(0, 3).map((applicant: any) => (
                            <div key={applicant.id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                                  <User className="w-4 h-4 text-gray-600" />
                                </div>
                                <span className="text-sm text-gray-700">{applicant.fullName}</span>
                              </div>
                              <button
                                onClick={() => router.push(`/dashboard/professionals/${applicant.id}`)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Ver Perfil
                              </button>
                            </div>
                          ))}
                          {offer.applicants.length > 3 && (
                            <p className="text-sm text-gray-500 text-center">
                              +{offer.applicants.length - 3} más postulantes
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                      className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 