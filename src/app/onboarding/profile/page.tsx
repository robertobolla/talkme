'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import ProfileForm from '@/components/onboarding/ProfileForm';

export default function OnboardingProfilePage() {
  const { user } = useUser();
  const router = useRouter();
  const [role, setRole] = useState<'client' | 'professional' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      console.log('=== OnboardingProfilePage: Verificando rol ===');
      try {
        console.log('OnboardingProfilePage: Llamando a /api/onboarding/profile-form');
        const response = await fetch('/api/onboarding/profile-form');
        console.log('OnboardingProfilePage: Respuesta de la API:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('OnboardingProfilePage: Datos recibidos:', data);
          
          if (data.role) {
            console.log('OnboardingProfilePage: Rol encontrado:', data.role);
            setRole(data.role);
          } else {
            console.log('OnboardingProfilePage: No hay rol, redirigiendo a /onboarding');
            router.push('/onboarding');
            return;
          }
        } else {
          console.log('OnboardingProfilePage: Error en la API, redirigiendo a /onboarding');
          router.push('/onboarding');
          return;
        }
      } catch (error) {
        console.error('OnboardingProfilePage: Error checking role:', error);
        router.push('/onboarding');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkRole();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return null; // Se redirigirá automáticamente
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6">
        <ProfileForm role={role} />
      </div>
    </div>
  );
} 