'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import RoleSelection from '@/components/onboarding/RoleSelection';
import ProfileForm from '@/components/onboarding/ProfileForm';
import { useNotifications } from '@/hooks/useNotifications';

export default function OnboardingPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'role-selection' | 'profile-form'>('role-selection');
  const [selectedRole, setSelectedRole] = useState<'client' | 'professional' | null>(null);
  const { showError, showSuccess, showLoading, dismissLoading } = useNotifications();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push('/sign-in');
      return;
    }

    // Verificar si ya tiene un perfil
    const checkExistingProfile = async () => {
      try {
        const response = await fetch('/api/onboarding/profile-form');
        if (response.ok) {
          const data = await response.json();
          console.log('Onboarding: Datos del perfil recibidos:', data);
          if (data.data && data.data.role) {
            console.log('Onboarding: Usuario ya tiene perfil, redirigiendo al dashboard');
            // Si ya tiene un perfil, redirigir al dashboard
            router.push('/dashboard');
          } else {
            console.log('Onboarding: Usuario no tiene perfil, continuando con onboarding');
          }
        }
      } catch (error) {
        console.error('Error checking existing profile:', error);
      }
    };

    checkExistingProfile();
  }, [isLoaded, user, router]);

  const handleRoleSelection = async (role: 'client' | 'professional') => {
    const loadingToast = showLoading('Seleccionando rol...');

    try {
      console.log('=== OnboardingPage: Iniciando handleRoleSelection ===');
      console.log('Rol a seleccionar:', role);

      // Obtener información del usuario de Clerk
      console.log('OnboardingPage: Información completa del usuario de Clerk:', {
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        emailAddresses: user.emailAddresses,
        primaryEmailAddress: user.primaryEmailAddress
      });

      const userInfo = {
        role,
        fullName: user.fullName || (user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.lastName || 'Usuario'),
        email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || 'usuario@example.com'
      };

      console.log('OnboardingPage: Enviando información del usuario:', userInfo);

      const response = await fetch('/api/onboarding/select-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo),
      });

      console.log('OnboardingPage: Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('OnboardingPage: Datos de respuesta:', data);
        setSelectedRole(role);
        dismissLoading(loadingToast);
        showSuccess('Rol seleccionado correctamente');

        if (data.nextStep === 'complete-profile') {
          console.log('OnboardingPage: Cambiando a profile-form');
          setCurrentStep('profile-form');
        } else {
          console.log('OnboardingPage: Redirigiendo a dashboard');
          router.push('/dashboard');
        }
      } else {
        console.log('OnboardingPage: Error en la respuesta, status:', response.status);

        // Intentar obtener el error de forma segura
        let errorMessage = 'Error al seleccionar rol';

        try {
          const errorData = await response.json();
          console.log('OnboardingPage: Error data (JSON):', errorData);

          // Manejar diferentes formatos de error
          if (errorData.error && typeof errorData.error === 'object') {
            errorMessage = errorData.error.message || errorMessage;
          } else if (errorData.error && typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.log('OnboardingPage: No se pudo parsear el error como JSON');
          try {
            const textError = await response.text();
            console.log('OnboardingPage: Error data (text):', textError);
            errorMessage = textError || errorMessage;
          } catch (textError) {
            console.log('OnboardingPage: No se pudo leer el texto del error');
          }
        }

        console.log('OnboardingPage: Error final:', errorMessage);
        dismissLoading(loadingToast);
        showError(errorMessage);
      }
    } catch (error) {
      console.error('OnboardingPage: Error in role selection:', error);
      dismissLoading(loadingToast);
      showError('Error al seleccionar rol. Inténtalo de nuevo.');
    }
  };

  const handleProfileComplete = () => {
    router.push('/dashboard');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'role-selection' ? (
          <RoleSelection onRoleSelect={handleRoleSelection} />
        ) : (
          <ProfileForm
            role={selectedRole!}
            onComplete={handleProfileComplete}
          />
        )}
      </div>
    </div>
  );
} 