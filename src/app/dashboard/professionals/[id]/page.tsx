'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Star,
  User,
  Calendar,
  MapPin as LocationIcon
} from 'lucide-react';

interface ProfessionalProfile {
  id: number;
  fullName: string;
  address: string;
  bio: string;
  hourlyRate: number;
  skills: string[];
  workZones: string[];
  averageRating: number;
  totalHoursWorked: number;
  dateOfBirth: string;
  reviewsReceived?: any[];
}

export default function ProfessionalProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const professionalId = params.id as string;
  const { showError } = useNotifications();

  const [professional, setProfessional] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user || !professionalId) return;

    const fetchProfessionalProfile = async () => {
      setLoading(true);
      try {
        console.log('ProfessionalProfilePage: Obteniendo perfil del profesional', professionalId);

        const response = await fetch(`/api/user-profiles/${professionalId}`);

        if (response.ok) {
          const data = await response.json();
          console.log('ProfessionalProfilePage: Perfil obtenido:', data);

          if (data.data) {
            setProfessional(data.data);
          } else {
            showError('Perfil no encontrado');
            router.back();
          }
        } else {
          console.error('ProfessionalProfilePage: Error obteniendo perfil:', response.status);
          showError('Error al cargar el perfil del profesional');
          router.back();
        }
      } catch (error) {
        console.error('ProfessionalProfilePage: Error obteniendo perfil del profesional:', error);
        showError('Error al cargar el perfil del profesional');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalProfile();
  }, [isLoaded, user, professionalId]);

  if (!isLoaded || loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando perfil del profesional...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">Profesional no encontrado</p>
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Perfil del Profesional</h1>
        </div>

        {/* Información principal */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{professional.fullName}</h2>

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Tarifa por hora</p>
                      <p className="text-lg font-semibold text-gray-900">${professional.hourlyRate}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Calificación</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {professional.averageRating}/5
                        {(professional.reviewsReceived?.length || 0) > 0 && (
                          <span className="text-sm font-normal text-green-600 ml-2">
                            (
                            <button
                              onClick={() => router.push(`/dashboard/reviews?professionalId=${professional.id}`)}
                              className="hover:underline cursor-pointer"
                            >
                              {professional.reviewsReceived?.length} reviews
                            </button>
                            )
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Horas trabajadas</p>
                      <p className="text-lg font-semibold text-gray-900">{professional.totalHoursWorked}h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información detallada */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información personal */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Información Personal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Fecha de nacimiento</label>
                <div className="flex items-center mt-1">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{formatDate(professional.dateOfBirth)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Dirección</label>
                <div className="flex items-center mt-1">
                  <LocationIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{professional.address || 'No especificada'}</span>
                </div>
              </div>

              {professional.bio && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Biografía</label>
                  <p className="text-gray-900 mt-1">{professional.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Habilidades y zonas de trabajo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Habilidades y Zonas</h3>
            <div className="space-y-4">
              {professional.skills && professional.skills.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Habilidades</label>
                  <div className="flex flex-wrap gap-2">
                    {professional.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {professional.workZones && professional.workZones.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Zonas de trabajo</label>
                  <div className="flex flex-wrap gap-2">
                    {professional.workZones.map((zone, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                      >
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
} 