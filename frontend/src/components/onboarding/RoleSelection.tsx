'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Heart, CheckCircle, ArrowRight } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface RoleOption {
  id: 'user' | 'companion';
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
}

const roleOptions: RoleOption[] = [
  {
    id: 'user',
    title: 'Soy Usuario',
    description: 'Busco acompañantes virtuales para charlar y compartir momentos especiales',
    icon: <User className="w-8 h-8" />,
    features: [
      'Reservar sesiones de video o chat',
      'Encontrar acompañantes verificados',
      'Gestionar balance con criptomonedas',
      'Recibir acompañamiento virtual'
    ],
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  },
  {
    id: 'companion',
    title: 'Soy Acompañante',
    description: 'Ofrezco acompañamiento virtual y conversaciones significativas',
    icon: <Heart className="w-8 h-8" />,
    features: [
      'Recibir solicitudes de sesiones',
      'Mostrar tu experiencia y especialidades',
      'Ganar dinero por tus servicios',
      'Construir tu reputación'
    ],
    color: 'bg-pink-50 border-pink-200 hover:bg-pink-100'
  }
];

interface RoleSelectionProps {
  onRoleSelect?: (role: 'user' | 'companion') => void;
}

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'user' | 'companion' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showError, showLoading, dismissLoading } = useNotifications();

  const handleRoleSelection = async (role: 'user' | 'companion') => {
    console.log('=== RoleSelection: Iniciando selección de rol ===');
    console.log('Rol seleccionado:', role);

    setSelectedRole(role);
    setIsLoading(true);
    const loadingToast = showLoading('Seleccionando rol...');

    try {
      if (onRoleSelect) {
        console.log('RoleSelection: Usando callback onRoleSelect');
        try {
          await onRoleSelect(role);
          console.log('RoleSelection: Callback completado exitosamente');
          dismissLoading(loadingToast);
        } catch (callbackError) {
          console.error('RoleSelection: Error en callback onRoleSelect:', callbackError);
          const errorMessage = callbackError instanceof Error ? callbackError.message : 'Error al seleccionar rol';
          dismissLoading(loadingToast);
          showError(errorMessage);
          return; // No re-lanzar el error
        }
      } else {
        console.error('RoleSelection: No hay callback onRoleSelect disponible');
        dismissLoading(loadingToast);
        showError('Error: No hay callback disponible');
      }
    } catch (error) {
      console.error('RoleSelection: Error al seleccionar rol:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al seleccionar rol';
      dismissLoading(loadingToast);
      showError(errorMessage);
      console.error('RoleSelection: Error message:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Bienvenido a TalkMe!
          </h1>
          <p className="text-gray-700">
            Para personalizar tu experiencia, necesitamos saber cómo planeas usar nuestra plataforma
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roleOptions.map((option) => (
            <div
              key={option.id}
              className={`
                bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all duration-300 border-2
                ${selectedRole === option.id ? 'ring-4 ring-blue-500 ring-opacity-50 scale-105' : 'border-transparent'}
                ${option.color}
              `}
              onClick={() => setSelectedRole(option.id)}
            >
              {/* Selected indicator */}
              {selectedRole === option.id && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              )}

              {/* Icon and Title */}
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 ${option.id === 'user' ? 'bg-blue-100' : 'bg-pink-100'} rounded-lg flex items-center justify-center mr-4`}>
                  {option.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{option.title}</h3>
                  <p className="text-gray-700 text-sm">{option.description}</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">Lo que puedes hacer:</h4>
                <ul className="space-y-2">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={() => selectedRole && handleRoleSelection(selectedRole)}
            disabled={!selectedRole || isLoading}
            className={`
              px-8 py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center mx-auto
              ${selectedRole && !isLoading ? 'hover:bg-blue-700' : 'opacity-50 cursor-not-allowed'}
            `}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-gray-600">
          <p className="text-sm">
            No te preocupes, siempre puedes cambiar tu rol más tarde en tu perfil
          </p>
        </div>
      </div>
    </div>
  );
} 