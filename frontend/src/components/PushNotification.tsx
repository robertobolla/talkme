'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Clock, DollarSign, User, Star } from 'lucide-react';
import { Notification } from '../hooks/useNotifications';

interface PushNotificationProps {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  duration?: number;
}

export default function PushNotification({ 
  notification, 
  onClose, 
  onMarkAsRead, 
  duration = 5000 
}: PushNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Mostrar notificación con animación
    const showTimer = setTimeout(() => setIsVisible(true), 100);

    // Ocultar automáticamente después del tiempo especificado
    const hideTimer = setTimeout(() => {
      if (!isHovered) {
        handleClose();
      }
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, isHovered]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Esperar a que termine la animación
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
    handleClose();
  };

  const getNotificationIcon = () => {
    const iconClass = "w-5 h-5";
    
    switch (notification.type) {
      case 'session_request':
        return <AlertCircle className={`${iconClass} text-orange-500`} />;
      case 'session_confirmed':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'session_cancelled':
        return <X className={`${iconClass} text-red-500`} />;
      case 'session_completed':
        return <CheckCircle className={`${iconClass} text-blue-500`} />;
      case 'session_reminder':
        return <Clock className={`${iconClass} text-yellow-500`} />;
      case 'payment_received':
        return <DollarSign className={`${iconClass} text-green-500`} />;
      case 'payment_sent':
        return <DollarSign className={`${iconClass} text-blue-500`} />;
      case 'profile_updated':
        return <User className={`${iconClass} text-purple-500`} />;
      case 'review_received':
        return <Star className={`${iconClass} text-yellow-500`} />;
      default:
        return <Info className={`${iconClass} text-gray-500`} />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getPriorityText = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return '';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 w-80 bg-white rounded-lg shadow-lg border-l-4 ${getPriorityColor()} transform transition-all duration-300 z-50 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex items-center space-x-3 flex-1">
          {getNotificationIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {notification.title}
              </h4>
              {notification.priority !== 'medium' && (
                <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                  notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  notification.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {getPriorityText()}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Footer con acciones */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {notification.status === 'unread' && (
              <button
                onClick={handleMarkAsRead}
                className="flex items-center space-x-1 px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <CheckCircle className="w-3 h-3" />
                <span>Marcar como leída</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(notification.createdAt).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-linear"
          style={{
            width: isHovered ? '100%' : '0%',
            transition: isHovered ? 'none' : `width ${duration}ms linear`
          }}
        />
      </div>
    </div>
  );
} 