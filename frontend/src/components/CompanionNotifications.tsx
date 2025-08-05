'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Clock, Video, MessageCircle } from 'lucide-react';

interface SessionRequest {
    id: number;
    title: string;
    description: string;
    startTime: string;
    duration: number;
    price: number;
    sessionType: 'video' | 'chat';
    user: {
        id: number;
        fullName: string;
    };
}

interface CompanionNotificationsProps {
    companionId: number;
    onSessionConfirmed: () => void;
}

export default function CompanionNotifications({ companionId, onSessionConfirmed }: CompanionNotificationsProps) {
    const [pendingSessions, setPendingSessions] = useState<SessionRequest[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPendingSessions();
    }, [companionId]);

    const fetchPendingSessions = async () => {
        try {
            const response = await fetch(`/api/sessions/companion/${companionId}/pending`);
            if (response.ok) {
                const data = await response.json();
                setPendingSessions(data);
            }
        } catch (error) {
            console.error('Error fetching pending sessions:', error);
        }
    };

    const handleAcceptSession = async (sessionId: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/sessions/${sessionId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Remover la sesión de la lista de pendientes
                setPendingSessions(prev => prev.filter(s => s.id !== sessionId));
                onSessionConfirmed();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error accepting session:', error);
            alert('Error al aceptar la sesión');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectSession = async (sessionId: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/sessions/${sessionId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Remover la sesión de la lista de pendientes
                setPendingSessions(prev => prev.filter(s => s.id !== sessionId));
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error rejecting session:', error);
            alert('Error al rechazar la sesión');
        } finally {
            setLoading(false);
        }
    };

    if (pendingSessions.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                    <Bell className="w-6 h-6 text-gray-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">Notificaciones</h3>
                </div>

                <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No tienes solicitudes de sesión pendientes</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
                <Bell className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">
                    Solicitudes Pendientes ({pendingSessions.length})
                </h3>
            </div>

            <div className="space-y-4">
                {pendingSessions.map((session) => (
                    <div
                        key={session.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-lg text-gray-800">
                                {session.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                                {session.sessionType === 'video' ? (
                                    <Video className="w-4 h-4 text-blue-600" />
                                ) : (
                                    <MessageCircle className="w-4 h-4 text-green-600" />
                                )}
                                <span className="text-sm text-gray-600 capitalize">
                                    {session.sessionType}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-600">
                                <span className="text-sm">
                                    <strong>Usuario:</strong> {session.user.fullName}
                                </span>
                            </div>

                            <div className="flex items-center text-gray-600">
                                <Clock className="w-4 h-4 mr-2" />
                                <span className="text-sm">
                                    {new Date(session.startTime).toLocaleDateString()} a las{' '}
                                    {new Date(session.startTime).toLocaleTimeString()}
                                </span>
                            </div>

                            <div className="flex items-center text-gray-600">
                                <span className="text-sm">
                                    <strong>Duración:</strong> {session.duration} minutos
                                </span>
                            </div>

                            <div className="flex items-center text-gray-600">
                                <span className="text-sm">
                                    <strong>Precio:</strong> ${session.price} USDT
                                </span>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => handleAcceptSession(session.id)}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                {loading ? 'Aceptando...' : 'Aceptar'}
                            </button>

                            <button
                                onClick={() => handleRejectSession(session.id)}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="w-4 h-4 mr-2" />
                                {loading ? 'Rechazando...' : 'Rechazar'}
                            </button>
                        </div>

                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center text-yellow-800">
                                <Clock className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">
                                    Tienes 2 horas para responder a esta solicitud
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 