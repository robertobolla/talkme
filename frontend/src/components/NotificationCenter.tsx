'use client';

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationCenterProps {
  userId: number;
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  console.log('🔔 NotificationCenter renderizado con userId:', userId);
  console.log('🔔 NotificationCenter - typeof userId:', typeof userId);
  console.log('🔔 NotificationCenter - userId > 0:', userId > 0);

  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, markAllAsRead } = useNotifications(userId);

  console.log('🔔 NotificationCenter después de useNotifications:', {
    notificationsCount: notifications.length,
    unreadCount,
    loading
  });

  // Marcar todas como leídas cuando se abre la campanita
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      // Pequeño delay para que el usuario vea el cambio visual
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, unreadCount, markAllAsRead]);

  if (!userId || userId === 0) {
    return null;
  }

  // Función para renderizar una notificación individual con validaciones
  const renderNotification = (notification: any) => {
    // Validar que la notificación tenga la estructura esperada
    if (!notification || !notification.attributes) {
      console.warn('⚠️ Notificación inválida en render:', notification);
      return null;
    }

    const { title, message, status, createdAt } = notification.attributes;

    // Validar campos requeridos
    if (!title || !message || !status || !createdAt) {
      console.warn('⚠️ Campos faltantes en notificación:', { title, message, status, createdAt });
      return null;
    }

    const isUnread = status === 'unread';

    return (
      <div
        key={notification.id}
        className={`p-3 rounded-lg transition-colors ${isUnread
          ? 'bg-blue-50 border-l-4 border-blue-500'
          : 'bg-gray-50 border-l-4 border-gray-300'
          }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className={`font-medium ${isUnread
              ? 'text-blue-900'
              : 'text-gray-700'
              }`}>
              {title}
            </h4>
            <p className={`text-sm mt-1 ${isUnread
              ? 'text-blue-700'
              : 'text-gray-600'
              }`}>
              {message}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {formatDistanceToNow(new Date(createdAt), {
                addSuffix: true,
                locale: es
              })}
            </p>
          </div>

          {/* Indicador visual de estado */}
          {isUnread && (
            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2 flex-shrink-0" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Botón de la campanita */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={24} />

        {/* Indicador de notificaciones no leídas */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  ({unreadCount} no leídas)
                </span>
              )}
            </h3>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Cargando notificaciones...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              <div className="space-y-2">
                {notifications
                  .map(renderNotification)
                  .filter(Boolean) // Filtrar notificaciones nulas
                }
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay para cerrar al hacer clic fuera */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 