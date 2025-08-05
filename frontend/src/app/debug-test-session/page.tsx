'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useNotifications } from '@/hooks/useNotifications';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DebugTestSessionPage() {
    const { user, isLoaded } = useUser();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { showSuccess, showError, showLoading, dismissLoading } = useNotifications();

    const testCreateSession = async () => {
        setLoading(true);
        const loadingToast = showLoading('Probando creación de sesión...');

        try {
            const sessionData = {
                data: {
                    title: 'Sesión de prueba desde frontend',
                    description: 'Sesión de video con María García',
                    startTime: new Date(Date.now() + 30 * 60000).toISOString(),
                    endTime: new Date(Date.now() + 90 * 60000).toISOString(),
                    duration: 60,
                    price: 25,
                    sessionType: 'video',
                    status: 'pending',
                    user: 12,
                    companion: 15
                }
            };

            console.log('Enviando datos:', sessionData);

            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sessionData),
            });

            const data = await response.json();
            console.log('Respuesta:', data);

            if (response.ok) {
                dismissLoading(loadingToast);
                showSuccess('¡Sesión creada exitosamente!');
                setResult(data);
            } else {
                dismissLoading(loadingToast);
                showError(`Error: ${data.error || 'Error desconocido'}`);
                setResult(data);
            }
        } catch (error) {
            console.error('Error:', error);
            dismissLoading(loadingToast);
            showError('Error al crear la sesión');
            setResult({ error: error instanceof Error ? error.message : 'Error desconocido' });
        } finally {
            setLoading(false);
        }
    };

    const testGetCompanions = async () => {
        setLoading(true);
        const loadingToast = showLoading('Obteniendo acompañantes...');

        try {
            const response = await fetch('/api/sessions/companions/available');
            const data = await response.json();

            console.log('Acompañantes:', data);
            dismissLoading(loadingToast);
            showSuccess(`Encontrados ${data.length} acompañantes`);
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
            dismissLoading(loadingToast);
            showError('Error al obtener acompañantes');
            setResult({ error: error instanceof Error ? error.message : 'Error desconocido' });
        } finally {
            setLoading(false);
        }
    };

    const testGetUserSessions = async () => {
        setLoading(true);
        const loadingToast = showLoading('Obteniendo sesiones del usuario...');

        try {
            const response = await fetch('/api/sessions/user/12');
            const data = await response.json();

            console.log('Sesiones del usuario:', data);
            dismissLoading(loadingToast);
            showSuccess(`Encontradas ${data.length} sesiones`);
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
            dismissLoading(loadingToast);
            showError('Error al obtener sesiones');
            setResult({ error: error instanceof Error ? error.message : 'Error desconocido' });
        } finally {
            setLoading(false);
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Debug: Probar APIs de Sesiones
                    </h1>

                    <div className="space-y-4">
                        <div className="flex space-x-4">
                            <button
                                onClick={testCreateSession}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Probando...' : 'Crear Sesión'}
                            </button>

                            <button
                                onClick={testGetCompanions}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? 'Probando...' : 'Obtener Acompañantes'}
                            </button>

                            <button
                                onClick={testGetUserSessions}
                                disabled={loading}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                            >
                                {loading ? 'Probando...' : 'Obtener Sesiones Usuario'}
                            </button>
                        </div>

                        {result && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Resultado:</h3>
                                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        )}

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