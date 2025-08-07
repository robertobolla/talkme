'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import DailyVideoChat from '@/components/DailyVideoChat';

interface Session {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  sessionType: 'video' | 'chat';
  companion?: {
    id: number;
    fullName: string;
  };
  user?: {
    id: number;
    fullName: string;
  };
}

export default function VideoChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  const userRole = searchParams.get('role') as 'user' | 'companion';
  const userId = parseInt(searchParams.get('userId') || '0');

  const [session, setSession] = useState<Session | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeVideoChat = async () => {
      try {
        // Obtener datos de la sesión
        const sessionResponse = await fetch(`/api/sessions/${sessionId}`);
        if (!sessionResponse.ok) {
          throw new Error('No se pudo cargar la sesión');
        }
        const sessionData = await sessionResponse.json();
        setSession(sessionData);

        // Crear o obtener la sala de Daily
        const roomResponse = await fetch('/api/daily/room', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            sessionName: sessionData.title,
          }),
        });

        if (!roomResponse.ok) {
          throw new Error('No se pudo crear la sala de video');
        }

        const roomData = await roomResponse.json();
        setRoomUrl(roomData.roomUrl);
      } catch (err) {
        console.error('Error initializing video chat:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      initializeVideoChat();
    }
  }, [sessionId]);

  const handleLeaveCall = () => {
    if (confirm('¿Estás seguro de que quieres terminar la llamada?')) {
      window.close();
    }
  };

  const handleError = (error: any) => {
    console.error('Error en videochat:', error);
    setError('Error en la conexión de video');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Inicializando videochat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="bg-red-600 p-4 rounded-lg mb-4">
            <p className="text-lg font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.close()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!session || !roomUrl) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p>No se pudo cargar la sesión o la sala de video</p>
          <button
            onClick={() => window.close()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 mt-4"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-white text-lg font-semibold">{session.title}</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>•</span>
            <span>
              {userRole === 'user' 
                ? session.companion?.fullName 
                : session.user?.fullName
              }
            </span>
            <span>•</span>
            <span>Videochat en vivo</span>
          </div>
        </div>
        
        <button
          onClick={() => window.close()}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video Chat */}
      <div className="flex-1">
        <DailyVideoChat
          roomUrl={roomUrl}
          onLeaveCall={handleLeaveCall}
          onError={handleError}
        />
      </div>
    </div>
  );
} 