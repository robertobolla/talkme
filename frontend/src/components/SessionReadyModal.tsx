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
}

export default function SessionReadyModal({
  session,
  userRole,
  isOpen,
  onClose,
  onReady,
  onNotReady,
  isOtherPartyReady
}: SessionReadyModalProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const sessionTime = new Date(session.startTime).getTime();
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
  }, [session.startTime]);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <Video className="w-8 h-8 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">
              ¡Tu sesión está lista!
            </h2>
          </div>
          
          <p className="text-gray-600">
            {userRole === 'user' ? 'Tu acompañante' : 'Tu cliente'} está esperando
          </p>
        </div>

        {/* Session Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">{session.title}</h3>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>
                {new Date(session.startTime).toLocaleDateString()} a las{' '}
                {new Date(session.startTime).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="mr-4">
                <strong>Duración:</strong> {session.duration} minutos
              </span>
              <span>
                <strong>Tipo:</strong> {session.sessionType === 'video' ? 'Videochat' : 'Chat'}
              </span>
            </div>

            <div className="flex items-center">
              <span>
                <strong>Con:</strong> {otherPartyName}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown */}
        {!isExpired && (
          <div className="text-center mb-6">
            <div className="flex items-center justify-center text-blue-600 mb-2">
              <Clock className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">
                La sesión comenzará en: {formatTime(timeLeft.hours, timeLeft.minutes, timeLeft.seconds)}
              </span>
            </div>
          </div>
        )}

        {/* Ready Status */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${isOtherPartyReady ? 'text-green-600' : 'text-gray-400'}`}>
              <CheckCircle className="w-5 h-5 mr-1" />
              <span className="text-sm">
                {otherPartyName} {isOtherPartyReady ? 'está listo' : 'no está listo'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onReady}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            ¡Estoy listo para la sesión!
          </button>

          <button
            onClick={onNotReady}
            className="w-full flex items-center justify-center px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            Necesito más tiempo
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Ambas partes deben confirmar que están listas para iniciar la sesión</p>
        </div>
      </div>
    </div>
  );
} 