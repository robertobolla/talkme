'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useProfileStorage } from '@/hooks/useProfileStorage';
import { useNotifications } from '@/hooks/useNotifications';
import {
  User, Mail, Phone, Calendar, MapPin, DollarSign,
  Save, ArrowLeft, CheckCircle
} from 'lucide-react';

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  bio: string;
  hourlyRate: number;
  skills: string[];
  workZones: string[];

}

interface FormErrors {
  [key: string]: string; // Define FormErrors interface
}

export default function ProfileForm({ role, isEditing = false }: { role: 'client' | 'professional'; isEditing?: boolean }) {
  const { user } = useUser();
  const { profile, loading, updateProfile } = useProfileStorage();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showSuccess, showError, showLoading, dismissLoading } = useNotifications();

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    bio: '',
    hourlyRate: 0,
    skills: [],
    workZones: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Inicializar datos del usuario cuando esté disponible
  useEffect(() => {
    if (user) {
      const clerkEmail = user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress || '';
      const clerkFullName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '';

      setProfileData(prev => ({
        ...prev,
        email: clerkEmail,
        fullName: prev.fullName || clerkFullName
      }));
    }
  }, [user]);

  // Cargar datos existentes si estamos en modo edición
  useEffect(() => {
    if (isEditing && profile) {
      console.log('Cargando perfil existente:', profile);

      // Asegurar que todos los valores null se conviertan en strings vacíos
      // El email siempre debe venir de Clerk, no de Strapi
      const sanitizedProfile = {
        fullName: profile.fullName || '',
        email: user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        address: profile.address || '',
        bio: profile.bio || '',
        hourlyRate: profile.hourlyRate || 0,
        skills: profile.skills || [],
        workZones: profile.workZones || [],
        emergencyContact: {
          name: profile.emergencyContact?.name || '',
          phone: profile.emergencyContact?.phone || '',
          relationship: profile.emergencyContact?.relationship || ''
        }
      };

      setProfileData(prev => ({
        ...prev,
        ...sanitizedProfile
      }));

      console.log('Perfil cargado en modo edición:', sanitizedProfile);
      console.log('Tarifa por hora cargada:', sanitizedProfile.hourlyRate);
    }
  }, [isEditing, profile, user]);

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    console.log(`Cambiando campo ${field} a:`, value);
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };



  const addSkill = (skill: string) => {
    if (skill.trim() && !profileData.skills.includes(skill.trim())) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addWorkZone = (zone: string) => {
    if (zone.trim() && !profileData.workZones.includes(zone.trim())) {
      setProfileData(prev => ({
        ...prev,
        workZones: [...prev.workZones, zone.trim()]
      }));
    }
  };

  const removeWorkZone = (zone: string) => {
    setProfileData(prev => ({
      ...prev,
      workZones: prev.workZones.filter(z => z !== zone)
    }));
  };

  const validateStep = (step: number): boolean => {
    const errors: FormErrors = {};

    // Validación para modo edición (una sola página)
    if (isEditing) {
      // Validaciones básicas siempre requeridas
      if (!profileData.fullName.trim()) errors.fullName = 'El nombre es requerido';
      if (!profileData.phone.trim()) errors.phone = 'El teléfono es requerido';
      if (!profileData.dateOfBirth) errors.dateOfBirth = 'La fecha de nacimiento es requerida';
      if (!profileData.address.trim()) errors.address = 'La dirección es requerida';

      // Validaciones específicas por rol
      if (role === 'professional') {
        if (!profileData.bio.trim()) errors.bio = 'La biografía es requerida';
        if (profileData.hourlyRate <= 0) errors.hourlyRate = 'La tarifa por hora debe ser mayor a 0';
      }


    } else {
      // Validación para modo onboarding (por pasos)
      if (step === 1) {
        if (!profileData.fullName.trim()) errors.fullName = 'El nombre es requerido';
        if (!profileData.phone.trim()) errors.phone = 'El teléfono es requerido';
        if (!profileData.dateOfBirth) errors.dateOfBirth = 'La fecha de nacimiento es requerida';
        if (!profileData.address.trim()) errors.address = 'La dirección es requerida';
      }

      if (step === 2 && role === 'professional') {
        if (!profileData.bio.trim()) errors.bio = 'La biografía es requerida';
        if (profileData.hourlyRate <= 0) errors.hourlyRate = 'La tarifa por hora debe ser mayor a 0';
      }


    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(isEditing ? 1 : currentStep)) return;

    setIsLoading(true);
    setError(null);
    const loadingToast = showLoading(isEditing ? 'Actualizando perfil...' : 'Guardando perfil...');

    try {
      console.log('Guardando perfil con datos:', profileData);

      // Asegurar que el email siempre venga de Clerk
      const profileDataWithClerkEmail = {
        ...profileData,
        email: user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress || profileData.email
      };

      const success = await updateProfile({
        role,
        ...profileDataWithClerkEmail
      });

      if (success) {
        console.log('Perfil guardado exitosamente');
        dismissLoading(loadingToast);
        showSuccess(isEditing ? 'Perfil actualizado correctamente' : 'Perfil completado correctamente');

        // Redirigir según el contexto
        if (isEditing) {
          router.push('/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error('Error al guardar el perfil');
      }
    } catch (error) {
      console.error(`Error al ${isEditing ? 'actualizar' : 'completar'} perfil:`, error);
      dismissLoading(loadingToast);
      const errorMessage = error instanceof Error ? error.message : `Error al ${isEditing ? 'actualizar' : 'completar'} el perfil`;
      setError(errorMessage);
      showError(errorMessage);
      setIsLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Información Personal</h3>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={profileData.fullName || ''}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Tu nombre completo"
            />
          </div>
          {formErrors.fullName && (
            <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={profileData.email || ''}
              disabled
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              placeholder="tu@email.com"
            />
          </div>
          <p className="text-gray-500 text-sm mt-1">Email obtenido de tu cuenta de Clerk</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={profileData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${formErrors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="+34 600 000 000"
            />
          </div>
          {formErrors.phone && (
            <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Nacimiento *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={profileData.dateOfBirth || ''}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                }`}
            />
          </div>
          {formErrors.dateOfBirth && (
            <p className="text-red-500 text-sm mt-1">{formErrors.dateOfBirth}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dirección *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={profileData.address || ''}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${formErrors.address ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Tu dirección completa"
          />
        </div>
        {formErrors.address && (
          <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
        )}
      </div>
    </div>
  );

  const renderProfessionalInfo = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Información de Acompañante</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Biografía *
        </label>
        <textarea
          value={profileData.bio || ''}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${formErrors.bio ? 'border-red-500' : 'border-gray-300'
            }`}
          rows={4}
          placeholder="Cuéntanos sobre tu experiencia y por qué te apasiona ser acompañante virtual..."
        />
        {formErrors.bio && (
          <p className="text-red-500 text-sm mt-1">{formErrors.bio}</p>
        )}
      </div>

      {/* Campo de tarifa por hora solo para acompañantes */}
      {role === 'professional' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tarifa por Hora (USDT) *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={profileData.hourlyRate || profileData.hourlyRate === 0 ? profileData.hourlyRate : ''}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? 0 : parseFloat(value);
                handleInputChange('hourlyRate', isNaN(numValue) ? 0 : numValue);
              }}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${formErrors.hourlyRate ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="25"
              min="0"
              step="0.01"
            />
          </div>
          <p className="text-sm text-blue-600 mt-2 font-medium">
            💡 Esta es tu tarifa por hora que verán los usuarios al reservar sesiones. Puedes ajustarla en cualquier momento.
          </p>
          {formErrors.hourlyRate && (
            <p className="text-red-500 text-sm mt-1">{formErrors.hourlyRate}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Habilidades
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Agregar habilidad..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                addSkill(input.value);
                input.value = '';
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              const input = document.querySelector('input[placeholder="Agregar habilidad..."]') as HTMLInputElement;
              if (input) {
                addSkill(input.value);
                input.value = '';
              }
            }}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Agregar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profileData.skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zonas de Trabajo
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Agregar zona..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                addWorkZone(input.value);
                input.value = '';
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              const input = document.querySelector('input[placeholder="Agregar zona..."]') as HTMLInputElement;
              if (input) {
                addWorkZone(input.value);
                input.value = '';
              }
            }}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Agregar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profileData.workZones.map((zone, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
            >
              {zone}
              <button
                type="button"
                onClick={() => removeWorkZone(zone)}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-slate-600 hover:text-slate-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {isEditing ? 'Editar Perfil' : 'Completa tu Perfil'}
          </h1>
          <p className="text-slate-600">
            {isEditing
              ? 'Actualiza tu información personal y profesional'
              : role === 'client'
                ? 'Cuéntanos sobre ti para personalizar tu experiencia'
                : 'Completa tu perfil de acompañante para empezar a ofrecer sesiones virtuales'
            }
          </p>
        </div>

        {/* Progress Bar - Solo mostrar si no está en modo edición */}
        {!isEditing && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Progreso</span>
              <span className="text-sm text-slate-500">
                {currentStep}/2
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {isEditing ? (
            // Modo edición: mostrar todo en una sola página
            <div className="space-y-8">
              {renderBasicInfo()}
              {role === 'professional' && renderProfessionalInfo()}

              {/* Botón de guardar para modo edición */}
              <div className="flex justify-end pt-6">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </div>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Modo onboarding: mostrar por pasos
            <>
              {currentStep === 1 && renderBasicInfo()}
              {currentStep === 2 && role === 'professional' && renderProfessionalInfo()}

              {/* Navigation */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 rounded-lg font-medium ${currentStep === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  Anterior
                </button>

                <button
                  onClick={() => {
                    if (currentStep < 2) {
                      setCurrentStep(prev => prev + 1);
                    } else {
                      handleSubmit();
                    }
                  }}
                  disabled={isLoading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </div>
                  ) : currentStep === 2 ? (
                    <div className="flex items-center">
                      <Save className="w-4 h-4 mr-2" />
                      Completar Perfil
                    </div>
                  ) : (
                    'Siguiente'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 