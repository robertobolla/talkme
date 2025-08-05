import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export function useProfileCheck() {
  const { isLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push('/sign-in');
      return;
    }

    // Solo verificar que el usuario esté autenticado
    // El perfil se verificará en cada página individualmente
    console.log('useProfileCheck: Usuario autenticado:', user.id);
  }, [isLoaded, user, router]);
} 