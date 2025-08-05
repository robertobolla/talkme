'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DebugClearUserPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError, showLoading, dismissLoading } = useNotifications();

    const handleClearUserData = async () => {
        if (!email.trim()) {
            showError('Por favor ingresa un email');
            return;
        }

        setLoading(true);
        const loadingToast = showLoading('Limpiando datos del usuario...');

        try {
            const response = await fetch('/api/debug/clear-user-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                dismissLoading(loadingToast);
                showSuccess(data.message || 'Datos limpiados exitosamente');

                // Redirigir al onboarding
                setTimeout(() => {
                    router.push('/onboarding');
                }, 2000);
            } else {
                dismissLoading(loadingToast);
                showError(data.error || 'Error al limpiar los datos');
            }
        } catch (error) {
            console.error('Error clearing user data:', error);
            dismissLoading(loadingToast);
            showError('Error al limpiar los datos');
        } finally {
            setLoading(false);
        }
    };

    const handleUseCurrentUser = () => {
        if (user?.emailAddresses?.[0]?.emailAddress) {
            setEmail(user.emailAddresses[0].emailAddress);
        }
    };

    if (!isLoaded) {
        return (
            <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" color="blue" text="Cargando..." />
            </div>
        );
    }

    return (
        <div className="pt-16 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Debug: Limpiar Datos de Usuario
                    </h1>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email del usuario a limpiar:
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@ejemplo.com"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleUseCurrentUser}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                >
                                    Usar Usuario Actual
                                </button>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        ⚠️ Advertencia
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>
                                            Esta acción eliminará permanentemente el perfil del usuario y todos sus datos asociados.
                                            Solo usa esto para testing o debugging.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={handleClearUserData}
                                disabled={loading || !email.trim()}
                                className={`px-6 py-3 rounded-md font-medium transition-colors ${loading || !email.trim()
                                        ? 'bg-red-300 text-red-700 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <LoadingSpinner size="sm" color="white" />
                                        <span className="ml-2">Limpiando...</span>
                                    </div>
                                ) : (
                                    'Limpiar Datos y Ir al Onboarding'
                                )}
                            </button>

                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>

                        {user && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-md">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Usuario Actual:</h3>
                                <p className="text-sm text-gray-600">
                                    Email: {user.emailAddresses?.[0]?.emailAddress || 'No disponible'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Nombre: {user.fullName || 'No disponible'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 