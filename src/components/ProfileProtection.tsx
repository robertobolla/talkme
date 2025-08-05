'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface ProfileProtectionProps {
  children: React.ReactNode;
}

export default function ProfileProtection({ children }: ProfileProtectionProps) {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push('/sign-in');
      return;
    }

    // Solo verificar que el usuario esté autenticado, sin verificar perfil
    console.log('ProfileProtection: Usuario autenticado:', user.id);
    setIsChecking(false);

  }, [isLoaded, user, router]);

  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 