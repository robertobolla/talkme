import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface ProfileData {
  role: 'client' | 'professional';
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  bio: string;
  hourlyRate: number;
  skills: string[];
  workZones: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export function useProfileStorage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Obtener perfil del localStorage
  const getLocalProfile = (): ProfileData | null => {
    if (!user?.id) return null;

    try {
      const stored = localStorage.getItem(`profile_${user.id}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  };

  // Guardar perfil en localStorage
  const saveLocalProfile = (profileData: ProfileData) => {
    if (!user?.id) return;

    try {
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));
      console.log('Perfil guardado en localStorage:', profileData);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Cargar perfil desde Strapi
  const loadProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Cargar desde Strapi a través del API
      const response = await fetch('/api/onboarding/profile-form');

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setProfile(data.data);
          saveLocalProfile(data.data); // Sincronizar con localStorage como backup
          console.log('Perfil cargado desde Strapi:', data.data);
          return;
        }
      }

      // Si no hay datos en Strapi, cargar desde localStorage como fallback
      const localProfile = getLocalProfile();
      if (localProfile) {
        setProfile(localProfile);
        console.log('Perfil cargado desde localStorage (fallback):', localProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);

      // Fallback a localStorage
      const localProfile = getLocalProfile();
      if (localProfile) {
        setProfile(localProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  // Actualizar perfil
  const updateProfile = async (profileData: ProfileData) => {
    if (!user?.id) return false;

    try {
      // Guardar en localStorage inmediatamente
      saveLocalProfile(profileData);
      setProfile(profileData);

      // Mapear roles del frontend a los del backend
      const backendRole = profileData.role === 'client' ? 'user' : 'companion';
      
      // Intentar guardar en el servidor
      const response = await fetch('/api/onboarding/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: backendRole,
          profileData
        }),
      });

      if (response.ok) {
        console.log('Perfil actualizado exitosamente en servidor');
        return true;
      } else {
        console.warn('Error al guardar en servidor, pero guardado en localStorage');
        return true; // Aún es exitoso porque se guardó localmente
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  return {
    profile,
    loading,
    updateProfile,
    loadProfile
  };
} 