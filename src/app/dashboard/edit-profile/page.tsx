'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import ProfileForm from '@/components/onboarding/ProfileForm';
import RoleSelection from '@/components/onboarding/RoleSelection';

export default function EditProfilePage() {
  const [role, setRole] = useState<'client' | 'professional' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        // Obtener el perfil actual del usuario
        const response = await fetch('/api/onboarding/profile-form');
        if (response.ok) {
          const data = await response.json();
          console.log('EditProfilePage: Respuesta del API:', data);

          // Verificar si hay datos del perfil
          if (data.data && data.data.role) {
            setRole(data.data.role);
            console.log('EditProfilePage: Rol encontrado:', data.data.role);
          } else {
            // Si no hay perfil, mostrar selector de rol
            console.log('EditProfilePage: No se encontró perfil, mostrando selector de rol');
            setShowRoleSelector(true);
          }
        } else {
          // Si hay error, mostrar selector de rol
          console.log('EditProfilePage: Error en la respuesta del API');
          setShowRoleSelector(true);
        }
      } catch (error) {
        console.error('Error checking profile status:', error);
        // En caso de error, mostrar selector de rol
        setShowRoleSelector(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileStatus();
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

  if (!role && !showRoleSelector) {
    return null; // Se redirigirá automáticamente
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-slate-600 hover:text-slate-800 mb-4"
          >
            ← Volver al Dashboard
          </button>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {role ? 'Editar Perfil' : 'Crear Perfil'}
          </h1>
          <p className="text-slate-600">
            {role
              ? 'Actualiza tu información personal y profesional'
              : 'Completa tu información personal y profesional'
            }
          </p>
        </div>

        {showRoleSelector ? (
          <RoleSelection onRoleSelect={(selectedRole: 'client' | 'professional') => {
            setRole(selectedRole);
            setShowRoleSelector(false);
          }} />
        ) : role && (
          <ProfileForm role={role} isEditing={true} />
        )}
      </div>
    </div>
  );
} 