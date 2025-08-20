import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: number;
  attributes: {
    title: string;
    message: string;
    status: 'read' | 'unread';
    createdAt: string;
  };
}

export function useNotifications(userId?: number) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🔔 useNotifications hook ejecutándose con userId:', userId);

  const fetchNotifications = useCallback(async () => {
    console.log('🔔 fetchNotifications llamado con userId:', userId);

    if (!userId) {
      console.log('⚠️ No userId provided, skipping notification fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Fetching notifications for userId: ${userId}`);
      const endpoint = `/api/notifications?userProfileId=${userId}`;
      console.log('🔍 URL del endpoint:', endpoint);

      const response = await fetch(endpoint);

      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Notifications fetched successfully:`, data.data?.length || 0);

      // Log de la estructura raw para debugging
      if (data.data && data.data.length > 0) {
        console.log('🔍 Primera notificación raw:', data.data[0]);
        console.log('🔍 Claves de la primera notificación:', Object.keys(data.data[0]));
        if (data.data[0].attributes) {
          console.log('🔍 Claves de attributes:', Object.keys(data.data[0].attributes));
        }
      }

      // Filtrar notificaciones válidas y mapear a la estructura esperada
      const validNotifications = data.data.filter((notification: any) => {
        // Verificar que la notificación tenga los campos requeridos
        // Las notificaciones pueden venir directamente del objeto raíz o bajo attributes
        const hasTitle = notification.title || notification.attributes?.title;
        const hasMessage = notification.message || notification.attributes?.message;
        const hasStatus = notification.status || notification.attributes?.status;
        const hasCreatedAt = notification.createdAt || notification.attributes?.createdAt;

        if (!hasTitle || !hasMessage || !hasStatus || !hasCreatedAt) {
          console.warn('⚠️ Notificación inválida encontrada:', notification);
          return false;
        }

        return true;
      }).map((notification: any) => {
        // Extraer campos de la notificación, manejando ambos formatos
        const title = notification.title || notification.attributes?.title;
        const message = notification.message || notification.attributes?.message;
        const status = notification.status || notification.attributes?.status;
        const createdAt = notification.createdAt || notification.attributes?.createdAt;

        return {
          id: notification.id,
          attributes: {
            title,
            message,
            status,
            createdAt
          }
        };
      });

      console.log(`📊 Notificaciones válidas: ${validNotifications.length}`);
      setNotifications(validNotifications);

      // Calcular notificaciones no leídas solo de las válidas
      const unread = validNotifications.filter((n: Notification) => n.attributes.status === 'unread').length;
      setUnreadCount(unread);

    } catch (err) {
      console.error('❌ Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(async (notificationIds: number[]) => {
    if (!notificationIds.length) return;

    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        // Actualizar estado local
        setNotifications(prev =>
          prev.map(notification =>
            notificationIds.includes(notification.id)
              ? {
                ...notification,
                attributes: {
                  ...notification.attributes,
                  status: 'read' as const
                }
              }
              : notification
          )
        );

        // Actualizar contador de no leídas
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));

        console.log(`✅ ${notificationIds.length} notificaciones marcadas como leídas`);
      } else {
        console.error('Error marking notifications as read:', response.status);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter(n => n.attributes.status === 'unread')
      .map(n => n.id);

    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  }, [notifications, markAsRead]);

  // Cargar notificaciones cuando userId esté disponible
  useEffect(() => {
    console.log(`🔄 useNotifications useEffect - userId changed:`, userId);
    if (userId && userId > 0) {
      console.log(`🔄 userId changed to ${userId}, loading notifications...`);
      fetchNotifications();
    } else {
      console.log(`⚠️ useNotifications: No userId provided or userId <= 0, skipping load`);
    }
  }, [userId]); // Solo depende de userId

  // Poll para actualizaciones cada 30 segundos
  useEffect(() => {
    console.log(`🔄 useNotifications polling useEffect - userId:`, userId);
    if (userId && userId > 0) {
      console.log(`🔄 Setting up polling for userId: ${userId}`);
      const interval = setInterval(() => {
        console.log(`🔄 Polling: ejecutando fetchNotifications`);
        fetchNotifications();
      }, 30000);
      return () => {
        console.log(`🔄 Clearing polling for userId: ${userId}`);
        clearInterval(interval);
      };
    }
  }, [userId]); // Solo depende de userId

  // Efecto adicional para forzar la carga inicial
  useEffect(() => {
    console.log(`🔄 useNotifications INITIAL useEffect - userId:`, userId);
    if (userId && userId > 0) {
      console.log(`🔄 INITIAL: Forzando carga de notificaciones para userId: ${userId}`);
      // Pequeño delay para asegurar que el hook esté completamente inicializado
      const timer = setTimeout(() => {
        console.log(`🔄 INITIAL: Ejecutando fetchNotifications después del delay`);
        fetchNotifications();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [userId]); // Solo depende de userId, no de fetchNotifications

  console.log('🔔 useNotifications hook retornando valores:', {
    notificationsCount: notifications.length,
    unreadCount,
    loading,
    error
  });

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
} 