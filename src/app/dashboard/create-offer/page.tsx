'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, AlertCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface OfferForm {
  title: string;
  description: string;
  location: string;
  dateTime: string;
  duration: number;
  specialRequirements: string;
}

export default function CreateOfferPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<OfferForm>({
    title: '',
    description: '',
    location: '',
    dateTime: '',
    duration: 1,
    specialRequirements: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<OfferForm>>({});
  const { showSuccess, showError, showLoading, dismissLoading } = useNotifications();

  const handleInputChange = (field: keyof OfferForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleNumberChange = (field: 'duration', value: string) => {
    // Permitir campo vacío para poder borrar el 0
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        [field]: ''
      }));
    } else {
      const numValue = field === 'duration' ? parseInt(value) : parseFloat(value);
      if (!isNaN(numValue)) {
        setFormData(prev => ({
          ...prev,
          [field]: numValue
        }));
      }
    }
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<OfferForm> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'La ubicación es requerida';
    }
    if (!formData.dateTime) {
      newErrors.dateTime = 'La fecha y hora son requeridas';
    }
    if (!formData.duration || formData.duration < 1) {
      newErrors.duration = 'La duración debe ser al menos 1 hora';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const loadingToast = showLoading('Creando oferta...');

    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        dismissLoading(loadingToast);
        showSuccess('Oferta creada exitosamente');
        router.push('/dashboard');
      } else {
        let errorMessage = 'Error desconocido';
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
        showError(`Error al crear la oferta: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      dismissLoading(loadingToast);
      showError('Error al crear la oferta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Crear Nueva Oferta</h1>
          <p className="text-gray-600 mt-2">
            Describe el cuidado que necesitas y encuentra al profesional ideal
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título de la Oferta *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Ej: Cuidado de ancianos en casa"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Describe detalladamente el tipo de cuidado que necesitas..."
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Ubicación *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Ciudad, dirección o zona"
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location}</p>
              )}
            </div>

            {/* Fecha y Hora */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha y Hora *
              </label>
              <input
                type="datetime-local"
                value={formData.dateTime}
                onChange={(e) => handleInputChange('dateTime', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${errors.dateTime ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.dateTime && (
                <p className="text-red-500 text-sm mt-1">{errors.dateTime}</p>
              )}
            </div>

            {/* Duración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duración (horas) *
              </label>
              <input
                type="number"
                value={formData.duration || formData.duration === 0 ? formData.duration : ''}
                onChange={(e) => handleNumberChange('duration', e.target.value)}
                min="1"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${errors.duration ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="1"
              />
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Los profesionales definirán su precio por hora en sus perfiles
              </p>
            </div>

            {/* Requisitos Especiales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Requisitos Especiales
              </label>
              <textarea
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Experiencia específica, certificaciones, idiomas, etc."
              />
            </div>



            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear Oferta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 