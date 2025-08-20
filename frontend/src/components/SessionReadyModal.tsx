'use client';

import React, { useState, useEffect } from 'react';
import { X, Video, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface SessionReadyModalProps {
  session: {
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
  };
  userRole: 'user' | 'companion';
  isOpen: boolean;
  onClose: () => void;
  onReady: () => void;
  onNotReady: () => void;
  isOtherPartyReady: boolean;
  isUserReady?: boolean;
}

export default function SessionReadyModal({
  session,
  userRole,
  isOpen,
  onClose,
  onReady,
  onNotReady,
  isOtherPartyReady,
  isUserReady
}: SessionReadyModalProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  const [isExpired, setIsExpired] = useState(false);
  const [globalTimer, setGlobalTimer] = useState<any>(null);

  // Obtener el timer global del backend
  useEffect(() => {
    if (isOpen && session) {
      const fetchGlobalTimer = async () => {
        try {
          const response = await fetch(`/api/sessions/${session.id}/ready?userId=${userRole === 'user' ? session.user?.id : session.companion?.id}&userRole=${userRole}`);
          if (response.ok) {
            const data = await response.json();
            setGlobalTimer(data.timer);
          }
        } catch (error) {
          console.error('Error fetching global timer:', error);
        }
      };

      fetchGlobalTimer();
      const interval = setInterval(fetchGlobalTimer, 2000); // Actualizar cada 2 segundos
      return () => clearInterval(interval);
    }
  }, [isOpen, session, userRole]);

  // Calcular tiempo restante basado en el timer global
  useEffect(() => {
    if (!globalTimer) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const sessionTime = new Date(globalTimer.startTime).getTime();
      const difference = sessionTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [globalTimer]);

  // Cerrar modal automáticamente si la sesión ya pasó
  useEffect(() => {
    if (isExpired) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Cerrar después de 3 segundos si la sesión ya pasó

      return () => clearTimeout(timer);
    }
  }, [isExpired, onClose]);

  if (!isOpen) return null;

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const otherPartyName = userRole === 'user'
    ? session.companion?.fullName
    : session.user?.fullName;

  const handleClose = () => {
    console.log('Modal close button clicked');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            ¿Estás listo para la sesión?
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Session Info */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <Video className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-gray-700 font-medium">
              {session.title || `Sesión de ${session.sessionType}`}
            </span>
          </div>

          <div className="flex items-center mb-3">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-gray-600">
              {new Date(session.startTime).toLocaleDateString()} a las{' '}
              {new Date(session.startTime).toLocaleTimeString()}
            </span>
          </div>

          {/* Contador global sincronizado */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-blue-800 font-medium">Contador Sincronizado</span>
              </div>
              <span className="text-lg font-bold text-blue-900">
                {formatTime(timeLeft.hours, timeLeft.minutes, timeLeft.seconds)}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Tiempo restante sincronizado entre todos los participantes
            </p>
          </div>
        </div>

        {/* Ready Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isUserReady ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {userRole === 'user' ? 'Tú' : 'Acompañante'} - {isUserReady ? 'Listo' : 'No listo'}
              </span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isOtherPartyReady ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {otherPartyName} - {isOtherPartyReady ? 'Listo' : 'No listo'}
              </span>
            </div>
          </div>

          {/* Mensaje de estado */}
          {isUserReady && !isOtherPartyReady && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-blue-800 text-sm">
                  Tu video comenzará pronto cuando {otherPartyName} esté listo.
                </span>
              </div>
            </div>
          )}

          {!isUserReady && isOtherPartyReady && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 text-sm">
                  {otherPartyName} está esperando que te marques como listo.
                </span>
              </div>
            </div>
          )}

          {isUserReady && isOtherPartyReady && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                <span className="text-green-800 text-sm font-medium">
                  ¡Ambos están listos! El videochat se abrirá automáticamente en unos segundos...
                </span>
              </div>
              <div className="mt-2 text-center">
                <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Abriendo videochat...
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de espera cuando ninguno está listo */}
          {!isUserReady && !isOtherPartyReady && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-gray-700 text-sm">
                  Esperando que ambos usuarios se marquen como listos para iniciar la sesión.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {!isUserReady ? (
            <button
              onClick={onReady}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Estoy Listo
            </button>
          ) : (
            <button
              onClick={onNotReady}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5 mr-2" />
              No Estoy Listo
            </button>
          )}
          
          <button
            onClick={onClose}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Session Details */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Duración:</span> {session.duration} min
            </div>
            <div>
              <span className="font-medium">Tipo:</span> {session.sessionType === 'video' ? 'Videochat' : 'Chat'}
            </div>
            <div>
              <span className="font-medium">Con:</span> {otherPartyName}
            </div>
            <div>
              <span className="font-medium">Estado:</span> 
              <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {session.status === 'confirmed' ? 'Confirmada' :
                 session.status === 'pending' ? 'Pendiente' : session.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 