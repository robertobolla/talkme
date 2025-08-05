'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ClearDataPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [localStorageCount, setLocalStorageCount] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Contar perfiles en localStorage
    const count = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
      .filter(key => key && key.startsWith('profile_')).length;
    setLocalStorageCount(count);
  }, []);

  const clearAllProfiles = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar TODOS los perfiles de usuarios? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Limpiar perfiles del servidor
      const serverResponse = await fetch('/api/onboarding/update-profile', {
        method: 'DELETE',
      });

      if (serverResponse.ok) {
        const serverData = await serverResponse.json();
        console.log('Perfiles del servidor eliminados:', serverData);
      }

      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('profile_')) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log('Perfil eliminado de localStorage:', key);
        });

        setLocalStorageCount(0);
        setMessage(`✅ Datos limpiados exitosamente. ${keysToRemove.length} perfiles eliminados de localStorage.`);
        setMessageType('success');
      }

    } catch (error) {
      console.error('Error clearing data:', error);
      setMessage('❌ Error al limpiar los datos. Revisa la consola para más detalles.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearLocalStorageOnly = () => {
    if (!confirm('¿Estás seguro de que quieres limpiar solo el localStorage?')) {
      return;
    }

    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('profile_')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('Perfil eliminado de localStorage:', key);
      });

      setLocalStorageCount(0);
      setMessage(`✅ localStorage limpiado. ${keysToRemove.length} perfiles eliminados.`);
      setMessageType('success');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            ← Volver
          </button>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Limpiar Datos de Usuarios
          </h1>
          <p className="text-gray-600">
            Página de administración para limpiar todos los datos de usuarios
          </p>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="font-semibold text-red-800">⚠️ ADVERTENCIA</h3>
          </div>
          <p className="text-red-700 mt-2">
            Esta acción eliminará TODOS los perfiles de usuarios tanto del servidor como del localStorage.
            Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={clearAllProfiles}
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <Trash2 className="w-5 h-5 mr-2" />
            )}
            {isLoading ? 'Limpiando...' : 'Limpiar TODOS los datos'}
          </button>

          <button
            onClick={clearLocalStorageOnly}
            className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 flex items-center justify-center"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Limpiar solo localStorage
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg ${messageType === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
            <div className="flex items-center">
              {messageType === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertTriangle className="w-5 h-5 mr-2" />
              )}
              {message}
            </div>
          </div>
        )}

        {/* Current Data Info */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Información actual:</h3>
          <p className="text-gray-600">
            • Perfiles en localStorage: {isClient ? localStorageCount : 'Cargando...'}
          </p>
          <p className="text-gray-600">
            • Usuario actual: {user?.emailAddresses?.[0]?.emailAddress || 'No autenticado'}
          </p>
        </div>
      </div>
    </div>
  );
} 