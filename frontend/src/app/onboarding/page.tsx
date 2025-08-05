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
  const [selectedRole, setSelectedRole] = useState<'user' | 'companion' | null>(null);
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

  const handleRoleSelection = async (role: 'user' | 'companion') => {
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

        let errorMessage = 'Error al seleccionar el rol';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }

        console.error('OnboardingPage: Error message:', errorMessage);
        dismissLoading(loadingToast);
        showError(errorMessage);
      }
    } catch (error) {
      console.error('OnboardingPage: Error en handleRoleSelection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al seleccionar el rol';
      dismissLoading(loadingToast);
      showError(errorMessage);
    }
  };

  const handleProfileComplete = () => {
    console.log('OnboardingPage: Perfil completado, redirigiendo al dashboard');
    router.push('/dashboard');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {currentStep === 'role-selection' ? (
        <RoleSelection onRoleSelect={handleRoleSelection} />
      ) : (
        <ProfileForm onComplete={handleProfileComplete} selectedRole={selectedRole} />
      )}
    </div>
  );
} 