'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface SessionCountdownProps {
  startTime: string;
  className?: string;
}

export default function SessionCountdown({ startTime, className = '' }: SessionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const sessionTime = new Date(startTime).getTime();
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

    // Calcular inmediatamente
    calculateTimeLeft();

    // Actualizar cada segundo
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  if (isExpired) {
    return (
      <div className={`flex items-center text-red-600 ${className}`}>
        <Clock className="w-4 h-4 mr-1" />
        <span className="text-sm font-medium">Sesión iniciada</span>
      </div>
    );
  }

  const formatTime = (hours: number, minutes: number) => {
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${timeLeft.seconds}s`;
    }
  };

  return (
    <div className={`flex items-center text-blue-600 ${className}`}>
      <Clock className="w-4 h-4 mr-1" />
      <span className="text-sm font-medium">
        Faltan {formatTime(timeLeft.hours, timeLeft.minutes)} para que comience la sesión
      </span>
    </div>
  );
} 