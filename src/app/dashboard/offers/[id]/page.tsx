'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { canCompleteTask, formatTaskTime, getTimeUntilCompletion } from '@/lib/dateUtils';
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
  MessageSquare
} from 'lucide-react';
import RatingModal from '@/components/RatingModal';

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
}

interface UserProfile {
  role: 'client' | 'professional';
  fullName: string;
}

export default function OfferDetailPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;
  const { showSuccess, showError, showLoading, dismissLoading } = useNotifications();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingProfessional, setAcceptingProfessional] = useState<number | null>(null);
  const [cancellingOffer, setCancellingOffer] = useState(false);
  const [completingOffer, setCompletingOffer] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<number | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Definir isClient e isProfessional aquí para que estén disponibles en useEffect
  const isClient = userProfile?.role === 'client';
  const isProfessional = userProfile?.role === 'professional';

  useEffect(() => {
    if (!isLoaded || !user || !offerId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('OfferDetailPage: Obteniendo datos de la oferta', offerId);

        // Obtener perfil del usuario
        const profileResponse = await fetch('/api/onboarding/profile-form');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('OfferDetailPage: Perfil del usuario:', profileData.data);
          setUserProfile(profileData.data);
        }

        // Obtener detalles de la oferta
        const response = await fetch(`/api/offers/${offerId}`);
        const data = await response.json();

        console.log('OfferDetailPage: Respuesta del API:', data);

        if (data.success && data.offer) {
          console.log('OfferDetailPage: Oferta obtenida:', {
            id: data.offer.id,
            title: data.offer.title,
            applicantsCount: data.offer.applicants?.length || 0,
            isClient: userProfile?.role === 'client'
          });

          if (data.offer.applicants && data.offer.applicants.length > 0) {
            console.log('OfferDetailPage: Postulantes encontrados:', data.offer.applicants.map((a: any) => ({
              id: a.id,
              fullName: a.fullName,
              email: a.email
            })));
          }

          setOffer(data.offer);
        } else {
          console.error('OfferDetailPage: Error en la respuesta del API:', data);
        }
      } catch (error) {
        console.error('OfferDetailPage: Error obteniendo datos de la oferta:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, user, offerId]);

  // Verificar si ya se calificó cuando la oferta está completada
  useEffect(() => {
    if (offer?.status === 'completed' && isClient) {
      const checkRating = async () => {
        try {
          const reviewCheckResponse = await fetch(`/api/reviews/check?offerId=${offer.id}`);
          if (reviewCheckResponse.ok) {
            const reviewData = await reviewCheckResponse.json();
            setHasRated(reviewData.hasRated);
          }
        } catch (error) {
          console.error('Error checking rating:', error);
        }
      };
      checkRating();
    }
  }, [offer?.status, offer?.id, isClient]);

  const handleAcceptProfessional = async (professionalId: number) => {
    if (!offer) return;

    setAcceptingProfessional(professionalId);
    setSelectedProfessional(professionalId);
    const loadingToast = showLoading('Aceptando profesional...');

    try {
      const response = await fetch('/api/offers/accept-professional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId: offer.id,
          professionalId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Profesional aceptado exitosamente:', data);

        // Actualizar el estado local
        setOffer(prev => prev ? {
          ...prev,
          status: 'accepted',
          professional: { id: professionalId }
        } : null);

        dismissLoading(loadingToast);
        showSuccess('¡Profesional aceptado exitosamente!');
      } else {
        let errorMessage = 'Error al aceptar al profesional';
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
      console.error('Error al aceptar profesional:', error);
      dismissLoading(loadingToast);
      showError('Error al aceptar al profesional');
    } finally {
      setAcceptingProfessional(null);
    }
  };

  const handleCancelOffer = async () => {
    if (!offer) return;

    setCancellingOffer(true);
    const loadingToast = showLoading('Cancelando oferta...');

    try {
      const response = await fetch('/api/offers/cancel-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId: offer.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Oferta cancelada exitosamente:', data);

        // Actualizar el estado local
        setOffer(prev => prev ? {
          ...prev,
          status: 'cancelled'
        } : null);

        dismissLoading(loadingToast);
        showSuccess('¡Oferta cancelada exitosamente!');
      } else {
        let errorMessage = 'Error al cancelar la oferta';
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
      console.error('Error al cancelar oferta:', error);
      dismissLoading(loadingToast);
      showError('Error al cancelar la oferta');
    } finally {
      setCancellingOffer(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!offer) return;
    setCompletingOffer(true);
    const loadingToast = showLoading('Completando tarea y acreditando pago...');

    try {
      const response = await fetch(`/api/offers/complete-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId: offer.id }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Tarea completada exitosamente:', data);
        dismissLoading(loadingToast);
        showSuccess(`¡Tarea completada! Se han acreditado $${data.amount} a ${data.professional.name}`, 6000);

        // Actualizar el estado local
        setOffer(prev => prev ? { ...prev, status: 'completed' } : null);

        // Verificar si ya se calificó
        const reviewCheckResponse = await fetch(`/api/reviews/check?offerId=${offer.id}`);
        if (reviewCheckResponse.ok) {
          const reviewData = await reviewCheckResponse.json();
          setHasRated(reviewData.hasRated);
        }
      } else {
        let errorMessage = 'Error al completar la tarea';
        try {
          const errorData = await response.json();
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        dismissLoading(loadingToast);
        showError(errorMessage);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      dismissLoading(loadingToast);
      showError('Error al completar la tarea');
    } finally {
      setCompletingOffer(false);
    }
  };

  const handleRatingSubmitted = () => {
    setHasRated(true);
  };

  if (!isLoaded || loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando detalles de la oferta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">Oferta no encontrada</p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{offer.title}</h1>
        </div>

        {/* Detalles de la oferta */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles de la Oferta</h2>
              <p className="text-gray-600 mb-4">{offer.description}</p>

              {/* Información de tiempo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Horario de la Tarea</h4>
                    <p className="text-blue-800 text-sm">{formatTaskTime(offer.dateTime, offer.duration)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600">
                      {canCompleteTask(offer.dateTime, offer.duration)
                        ? '✅ Tarea puede ser completada'
                        : `⏰ ${getTimeUntilCompletion(offer.dateTime, offer.duration)}`
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{offer.location}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">
                    {new Date(offer.dateTime).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{offer.duration} horas</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">
                    {offer.professional ? (
                      <>
                        ${offer.professional.hourlyRate}/hora
                        <span className="text-gray-500 ml-2">
                          (${(offer.professional.hourlyRate * offer.duration).toFixed(2)} total)
                        </span>
                      </>
                    ) : (
                      'Precio según profesional'
                    )}
                  </span>
                </div>
                {!isClient && offer.client && (
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-700">
                      Cliente: {offer.client.fullName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium self-start ${offer.status === 'published' ? 'bg-green-100 text-green-800' :
                  offer.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                    offer.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                  {offer.status}
                </span>

                <div className="flex flex-col sm:flex-row gap-2">
                  {isClient && offer.status === 'published' && (
                    <button
                      onClick={handleCancelOffer}
                      disabled={cancellingOffer}
                      className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${cancellingOffer
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                    >
                      {cancellingOffer ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Cancelando...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Cancelar Oferta
                        </>
                      )}
                    </button>
                  )}

                  {isClient && offer.status === 'accepted' && canCompleteTask(offer.dateTime, offer.duration) && (
                    <button
                      onClick={handleCompleteTask}
                      disabled={completingOffer}
                      className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${completingOffer
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                      {completingOffer ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Completando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completar Tarea y Pagar
                        </>
                      )}
                    </button>
                  )}

                  {isClient && offer.status === 'accepted' && !canCompleteTask(offer.dateTime, offer.duration) && (
                    <div className="flex items-center px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        La tarea se podrá completar después de {getTimeUntilCompletion(offer.dateTime, offer.duration)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isClient && offer.applicants && offer.applicants.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Postulantes ({offer.applicants.length})
                  </h3>
                  <div className="space-y-3">
                    {offer.applicants.map((applicant: any) => (
                      <div
                        key={applicant.id}
                        className={`border rounded-lg p-4 transition-all duration-200 ${selectedProfessional === applicant.id
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:shadow-md'
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${selectedProfessional === applicant.id
                              ? 'bg-green-100'
                              : 'bg-blue-100'
                              }`}>
                              <User className={`w-5 h-5 ${selectedProfessional === applicant.id
                                ? 'text-green-600'
                                : 'text-blue-600'
                                }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{applicant.fullName}</h4>
                              <p className="text-sm text-gray-600 truncate">{applicant.email}</p>
                              {applicant.hourlyRate && (
                                <p className="text-sm text-gray-600">Tarifa: ${applicant.hourlyRate}/h</p>
                              )}
                              {applicant.averageRating && (
                                <div className="flex items-center mt-1">
                                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                  <span className="text-sm text-gray-600">{applicant.averageRating}/5</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <button
                              onClick={() => router.push(`/dashboard/professionals/${applicant.id}`)}
                              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap"
                            >
                              Ver Perfil
                            </button>
                            {offer.status === 'published' && (
                              <button
                                onClick={() => handleAcceptProfessional(applicant.id)}
                                disabled={acceptingProfessional === applicant.id}
                                className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${acceptingProfessional === applicant.id
                                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                                  }`}
                              >
                                {acceptingProfessional === applicant.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Aceptando...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Aceptar
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isClient && offer.status === 'accepted' && offer.professional && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Profesional Aceptado
                  </h3>
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {offer.professional.fullName || 'Profesional Seleccionado'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Tu oferta ha sido asignada a {offer.professional.fullName || 'un profesional'}
                        </p>
                        {offer.professional.hourlyRate && (
                          <p className="text-sm text-gray-600 mt-1">
                            Tarifa: ${offer.professional.hourlyRate}/hora
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/professionals/${offer.professional.id}`)}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                      >
                        Ver Perfil
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isClient && (!offer.applicants || offer.applicants.length === 0) && offer.status === 'published' && (
                <div className="mt-6">
                  <div className="border border-gray-200 rounded-lg p-6 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin Postulantes</h3>
                    <p className="text-gray-600">Aún no hay profesionales postulados a esta oferta.</p>
                  </div>
                </div>
              )}

              {isClient && offer.status === 'cancelled' && (
                <div className="mt-6">
                  <div className="border border-red-200 bg-red-50 rounded-lg p-6 text-center">
                    <X className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Oferta Cancelada</h3>
                    <p className="text-red-700">Esta oferta ha sido cancelada y ya no acepta nuevas postulaciones.</p>
                  </div>
                </div>
              )}

              {isClient && offer.status === 'completed' && (
                <div className="mt-6">
                  <div className="border border-green-200 bg-green-50 rounded-lg p-6">
                    <div className="flex items-center justify-center mb-4">
                      <CheckCircle className="w-12 h-12 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-900 mb-2 text-center">Tarea Completada</h3>
                    <p className="text-green-700 text-center mb-4">
                      Esta tarea ha sido completada exitosamente y el pago ha sido acreditado al profesional.
                    </p>
                    {offer.professional && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Profesional</p>
                            <p className="text-sm text-gray-600">{offer.professional.fullName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">Monto Acreditado</p>
                            <p className="text-sm text-green-600 font-semibold">
                              ${(offer.professional.hourlyRate * offer.duration).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Botón de calificación */}
                        <div className="border-t border-green-200 pt-4">
                          {hasRated ? (
                            <div className="flex items-center justify-center text-green-700">
                              <Star className="w-5 h-5 mr-2 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">Ya calificaste a este profesional</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowRatingModal(true)}
                              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Calificar Profesional
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de calificación */}
      {showRatingModal && offer && offer.professional && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          professionalName={offer.professional.fullName}
          offerId={offer.id}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </div>
  );
} 