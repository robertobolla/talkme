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
  timezone: string;
  interests: string[];
  languages: string[];
  profilePhoto?: File | null;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
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
    timezone: '',
    interests: [],
    languages: [],
    profilePhoto: null,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

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
        timezone: profile.timezone || '',
        interests: profile.interests || [],
        languages: profile.languages || [],
        profilePhoto: null, // Se manejará por separado
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

      // Manejar foto de perfil existente
      if (profile.profilePhoto && typeof profile.profilePhoto === 'object' && 'url' in profile.profilePhoto) {
        const photoUrl = `http://localhost:1337${profile.profilePhoto.url}`;
        setExistingPhotoUrl(photoUrl);
      }

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

  const addInterest = (interest: string) => {
    if (interest.trim() && !profileData.interests.includes(interest.trim())) {
      setProfileData(prev => ({
        ...prev,
        interests: [...prev.interests, interest.trim()]
      }));
    }
  };

  const removeInterest = (interest: string) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const toggleInterest = (interest: string) => {
    if (profileData.interests.includes(interest)) {
      removeInterest(interest);
    } else {
      addInterest(interest);
    }
  };

  const addLanguage = (language: string) => {
    if (language.trim() && !profileData.languages.includes(language.trim())) {
      setProfileData(prev => ({
        ...prev,
        languages: [...prev.languages, language.trim()]
      }));
    }
  };

  const removeLanguage = (language: string) => {
    setProfileData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showError('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('La imagen debe ser menor a 5MB. Tamaño actual: ' + Math.round(file.size / 1024) + ' KB');
        return;
      }

      setProfileData(prev => ({
        ...prev,
        profilePhoto: file
      }));
    }
  };

  const removePhoto = () => {
    setProfileData(prev => ({
      ...prev,
      profilePhoto: null
    }));
    setExistingPhotoUrl(null);
  };

  const validateStep = (step: number): boolean => {
    const errors: FormErrors = {};

    // Validación para modo edición (una sola página)
    if (isEditing) {
      // Validaciones básicas siempre requeridas
      if (!profileData.fullName.trim()) errors.fullName = 'El nombre es requerido';
      if (!profileData.phone.trim()) errors.phone = 'El teléfono es requerido';
      if (!profileData.dateOfBirth) errors.dateOfBirth = 'La fecha de nacimiento es requerida';
      if (!profileData.timezone.trim()) errors.timezone = 'La zona horaria es requerida';

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
        if (!profileData.timezone.trim()) errors.timezone = 'La zona horaria es requerida';
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

      let photoFileId = null;

      // Si hay una foto de perfil, subirla primero
      if (profileData.profilePhoto) {
        console.log('Iniciando upload de foto de perfil...');
        console.log('Archivo a subir:', profileData.profilePhoto.name, profileData.profilePhoto.size, 'bytes');

        const photoFormData = new FormData();
        photoFormData.append('photo', profileData.profilePhoto);

        console.log('FormData creado, haciendo petición a /api/upload-profile-photo...');

        let photoUploadResponse;
        try {
          photoUploadResponse = await fetch('/api/upload-profile-photo', {
            method: 'POST',
            body: photoFormData,
          });

          console.log('Respuesta del servidor:', photoUploadResponse.status, photoUploadResponse.statusText);
        } catch (fetchError) {
          console.error('Error en fetch:', fetchError);
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Error desconocido';
          throw new Error(`Error de red al subir la foto: ${errorMessage}`);
        }

        if (photoUploadResponse.ok) {
          const photoResult = await photoUploadResponse.json();
          photoFileId = photoResult.fileId;
          console.log('Foto de perfil subida exitosamente:', photoFileId);
        } else {
          const errorText = await photoUploadResponse.text();
          console.error('Error response:', errorText);
          throw new Error(`Error al subir la foto de perfil: ${photoUploadResponse.status} - ${errorText}`);
        }
      }

      // Asegurar que el email siempre venga de Clerk
      const profileDataWithClerkEmail = {
        ...profileData,
        email: user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress || profileData.email,
        profilePhoto: photoFileId // Reemplazar el archivo con el ID del archivo subido
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zona Horaria *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              value={profileData.timezone || ''}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${formErrors.timezone ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">Selecciona tu zona horaria</option>
              <option value="UTC-8">Pacífico (UTC-8)</option>
              <option value="UTC-7">Mountain (UTC-7)</option>
              <option value="UTC-6">Central (UTC-6)</option>
              <option value="UTC-5">Eastern (UTC-5)</option>
              <option value="UTC-4">Atlantic (UTC-4)</option>
              <option value="UTC-3">Brasilia (UTC-3)</option>
              <option value="UTC-2">Mid-Atlantic (UTC-2)</option>
              <option value="UTC-1">Azores (UTC-1)</option>
              <option value="UTC+0">UTC</option>
              <option value="UTC+1">Central Europe (UTC+1)</option>
              <option value="UTC+2">Eastern Europe (UTC+2)</option>
              <option value="UTC+3">Moscow (UTC+3)</option>
              <option value="UTC+4">Gulf (UTC+4)</option>
              <option value="UTC+5">Pakistan (UTC+5)</option>
              <option value="UTC+5:30">India (UTC+5:30)</option>
              <option value="UTC+6">Bangladesh (UTC+6)</option>
              <option value="UTC+7">Indochina (UTC+7)</option>
              <option value="UTC+8">China (UTC+8)</option>
              <option value="UTC+9">Japan (UTC+9)</option>
              <option value="UTC+10">Australia (UTC+10)</option>
              <option value="UTC+11">Solomon Islands (UTC+11)</option>
              <option value="UTC+12">New Zealand (UTC+12)</option>
            </select>
          </div>
          {formErrors.timezone && (
            <p className="text-red-500 text-sm mt-1">{formErrors.timezone}</p>
          )}
        </div>
      </div>

      {/* Foto de perfil */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Foto de Perfil
        </label>
        <div className="flex items-center space-x-4">
          <div className="relative">
            {profileData.profilePhoto ? (
              <div className="relative">
                <img
                  src={URL.createObjectURL(profileData.profilePhoto)}
                  alt="Foto de perfil"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ) : existingPhotoUrl ? (
              <div className="relative">
                <img
                  src={existingPhotoUrl}
                  alt="Foto de perfil"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              id="profile-photo"
            />
            <label
              htmlFor="profile-photo"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {profileData.profilePhoto ? 'Cambiar Foto' : 'Subir Foto'}
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Formatos: JPG, PNG, GIF. Máximo 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Temáticas de interés para usuarios y acompañantes */}
      {(role === 'client' || role === 'professional') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {role === 'client' ? 'Temáticas de Interés' : 'Especialidades'}
          </label>
          <p className="text-gray-500 text-sm mb-3">
            {role === 'client'
              ? 'Selecciona las temáticas que te interesan para personalizar tu experiencia'
              : 'Selecciona hasta 3 especialidades en las que te destacas'
            }
          </p>
          <div className="flex flex-wrap gap-2">
            {['Ansiedad', 'Amistad', 'Rutina', 'Duelo', 'Erótico'].map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                disabled={role === 'professional' && profileData.interests.length >= 3 && !profileData.interests.includes(interest)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${profileData.interests.includes(interest)
                  ? 'bg-blue-600 text-white shadow-sm'
                  : role === 'professional' && profileData.interests.length >= 3 && !profileData.interests.includes(interest)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
              >
                {interest}
              </button>
            ))}
          </div>
          {profileData.interests.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">
                {role === 'client' ? 'Temáticas seleccionadas:' : 'Especialidades seleccionadas:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {profileData.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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

      {/* Idiomas para acompañantes */}
      {role === 'professional' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Idiomas
          </label>
          <p className="text-gray-500 text-sm mb-3">Selecciona los idiomas que hablas</p>
          <div className="flex gap-2 mb-3">
            <select
              onChange={(e) => {
                if (e.target.value && !profileData.languages.includes(e.target.value)) {
                  addLanguage(e.target.value);
                  e.target.value = '';
                }
              }}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              defaultValue=""
            >
              <option value="">Selecciona un idioma</option>
              <option value="Español">Español</option>
              <option value="Inglés">Inglés</option>
              <option value="Francés">Francés</option>
              <option value="Alemán">Alemán</option>
              <option value="Italiano">Italiano</option>
              <option value="Portugués">Portugués</option>
              <option value="Ruso">Ruso</option>
              <option value="Chino">Chino</option>
              <option value="Japonés">Japonés</option>
              <option value="Coreano">Coreano</option>
              <option value="Árabe">Árabe</option>
              <option value="Hindi">Hindi</option>
              <option value="Holandés">Holandés</option>
              <option value="Sueco">Sueco</option>
              <option value="Noruego">Noruego</option>
              <option value="Danés">Danés</option>
              <option value="Finlandés">Finlandés</option>
              <option value="Polaco">Polaco</option>
              <option value="Checo">Checo</option>
              <option value="Húngaro">Húngaro</option>
              <option value="Turco">Turco</option>
              <option value="Griego">Griego</option>
              <option value="Hebreo">Hebreo</option>
              <option value="Tailandés">Tailandés</option>
              <option value="Vietnamita">Vietnamita</option>
              <option value="Indonesio">Indonesio</option>
              <option value="Malayo">Malayo</option>
              <option value="Filipino">Filipino</option>
            </select>
          </div>
          {profileData.languages.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Idiomas seleccionados:</p>
              <div className="flex flex-wrap gap-2">
                {profileData.languages.map((language, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {language}
                    <button
                      type="button"
                      onClick={() => removeLanguage(language)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header - Solo mostrar si no está en modo edición */}
        {!isEditing && (
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-slate-600 hover:text-slate-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </button>

            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Completa tu Perfil
            </h1>
            <p className="text-slate-600">
              {role === 'client'
                ? 'Cuéntanos sobre ti para personalizar tu experiencia'
                : 'Completa tu perfil de acompañante para empezar a ofrecer sesiones virtuales'
              }
            </p>
          </div>
        )}

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