'use client';

import React, { useState } from 'react';
import DailyVideoChat from '@/components/DailyVideoChat';

export default function TestVideoChatPage() {
    const [roomUrl, setRoomUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createRoom = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/daily/room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: 'test-123',
                    sessionName: 'Sesión de prueba de videochat',
                }),
            });

            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setRoomUrl(data.roomUrl);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveCall = () => {
        if (confirm('¿Estás seguro de que quieres terminar la llamada?')) {
            setRoomUrl(null);
        }
    };

    const handleError = (error: any) => {
        console.error('Error en videochat:', error);
        setError('Error en la conexión de video');
    };

    if (roomUrl) {
        return (
            <div className="min-h-screen bg-gray-900">
                <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                    <h1 className="text-white text-lg font-semibold">Videochat de prueba</h1>
                    <button
                        onClick={handleLeaveCall}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Salir de la llamada
                    </button>
                </div>

                <DailyVideoChat
                    roomUrl={roomUrl}
                    onLeaveCall={handleLeaveCall}
                    onError={handleError}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Test Videochat Completo</h1>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Prueba del videochat con Daily.co</h2>

                    <p className="text-gray-600 mb-4">
                        Esta página te permite probar el videochat completo con Daily.co.
                        Se creará una sala de video y se abrirá la interfaz de Daily.
                    </p>

                    <button
                        onClick={createRoom}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Creando sala...' : 'Iniciar videochat'}
                    </button>

                    {error && (
                        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            <p className="font-semibold">Error:</p>
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-sm text-gray-600">
                    <p>• Se abrirá una sala de Daily.co en esta misma página</p>
                    <p>• Podrás probar todas las funciones de video y audio</p>
                    <p>• Usa "Salir de la llamada" para volver a esta página</p>
                </div>
            </div>
        </div>
    );
} 