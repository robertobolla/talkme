'use client';

import React, { useEffect, useRef, useState } from 'react';

interface DailyVideoChatProps {
  roomUrl: string;
  onLeaveCall?: () => void;
  onError?: (error: any) => void;
}

export default function DailyVideoChat({ roomUrl, onLeaveCall, onError }: DailyVideoChatProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!roomUrl) {
      setError('No se proporcionó URL de la sala');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Crear iframe de Daily
    if (iframeRef.current) {
      iframeRef.current.src = roomUrl;

      // Eventos del iframe
      const handleLoad = () => {
        setIsLoading(false);
        console.log('Daily iframe cargado');
      };

      const handleError = () => {
        setError('Error al cargar la sala de video');
        onError?.(new Error('Error al cargar iframe'));
      };

      iframeRef.current.addEventListener('load', handleLoad);
      iframeRef.current.addEventListener('error', handleError);

      return () => {
        if (iframeRef.current) {
          iframeRef.current.removeEventListener('load', handleLoad);
          iframeRef.current.removeEventListener('error', handleError);
        }
      };
    }
  }, [roomUrl, onError]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="bg-red-600 p-4 rounded-lg mb-4">
            <p className="text-lg font-semibold">Error de conexión</p>
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Conectando a la sala de video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <iframe
        ref={iframeRef}
        className="w-full h-screen border-0"
        allow="camera; microphone; fullscreen; speaker; display-capture"
        allowFullScreen
      />
    </div>
  );
} 