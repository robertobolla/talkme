import { useState, useEffect, useCallback } from 'react';
import { Notification } from './useNotifications';

export interface PushNotification {
    id: string;
    notification: Notification;
    timestamp: number;
}

export function usePushNotifications() {
    const [pushNotifications, setPushNotifications] = useState<PushNotification[]>([]);
    const [isEnabled, setIsEnabled] = useState(false);

    // Verificar si las notificaciones push están habilitadas
    useEffect(() => {
        if ('Notification' in window) {
            setIsEnabled(Notification.permission === 'granted');
        }
    }, []);

    // Solicitar permisos para notificaciones push
    const requestPermission = useCallback(async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            setIsEnabled(permission === 'granted');
            return permission === 'granted';
        }
        return isEnabled;
    }, [isEnabled]);

    // Mostrar notificación push del navegador
    const showBrowserNotification = useCallback((notification: Notification) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `notification-${notification.id}`,
                requireInteraction: notification.priority === 'urgent',
                data: notification,
            });

            // Manejar clic en la notificación
            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();

                // Aquí podrías navegar a la página relevante
                if (notification.relatedSession) {
                    window.open(`/dashboard/sessions/${notification.relatedSession.id}`, '_blank');
                }
            };

            // Cerrar automáticamente después de 5 segundos (excepto urgentes)
            if (notification.priority !== 'urgent') {
                setTimeout(() => {
                    browserNotification.close();
                }, 5000);
            }

            return browserNotification;
        }
        return null;
    }, []);

    // Agregar notificación push personalizada
    const addPushNotification = useCallback((notification: Notification) => {
        const pushNotification: PushNotification = {
            id: `push-${Date.now()}-${Math.random()}`,
            notification,
            timestamp: Date.now(),
        };

        setPushNotifications(prev => [...prev, pushNotification]);

        // Mostrar notificación del navegador si está habilitada
        if (isEnabled) {
            showBrowserNotification(notification);
        }

        // Remover automáticamente después de 10 segundos
        setTimeout(() => {
            removePushNotification(pushNotification.id);
        }, 10000);

        return pushNotification;
    }, [isEnabled, showBrowserNotification]);

    // Remover notificación push
    const removePushNotification = useCallback((id: string) => {
        setPushNotifications(prev => prev.filter(pn => pn.id !== id));
    }, []);

    // Limpiar todas las notificaciones push
    const clearAllPushNotifications = useCallback(() => {
        setPushNotifications([]);
    }, []);

    // Obtener notificaciones push por prioridad
    const getPushNotificationsByPriority = useCallback((priority: Notification['priority']) => {
        return pushNotifications.filter(pn => pn.notification.priority === priority);
    }, [pushNotifications]);

    // Obtener notificaciones push urgentes
    const getUrgentPushNotifications = useCallback(() => {
        return getPushNotificationsByPriority('urgent');
    }, [getPushNotificationsByPriority]);

    // Obtener notificaciones push de alta prioridad
    const getHighPriorityPushNotifications = useCallback(() => {
        return getPushNotificationsByPriority('high');
    }, [getPushNotificationsByPriority]);

    // Verificar si hay notificaciones urgentes
    const hasUrgentNotifications = useCallback(() => {
        return pushNotifications.some(pn => pn.notification.priority === 'urgent');
    }, [pushNotifications]);

    // Verificar si hay notificaciones de alta prioridad
    const hasHighPriorityNotifications = useCallback(() => {
        return pushNotifications.some(pn =>
            pn.notification.priority === 'high' || pn.notification.priority === 'urgent'
        );
    }, [pushNotifications]);

    // Configurar notificaciones automáticas para eventos específicos
    const setupAutomaticNotifications = useCallback(() => {
        // Aquí podrías configurar listeners para eventos específicos
        // como cambios en el estado de sesiones, pagos, etc.

        // Ejemplo: Listener para cambios en el estado de sesiones
        const handleSessionStateChange = (event: CustomEvent) => {
            const { session, action, userRole } = event.detail;

            // Crear notificación automática basada en la acción
            switch (action) {
                case 'confirmed':
                    // Notificar al usuario que la sesión fue confirmada
                    break;
                case 'cancelled':
                    // Notificar a ambos usuarios sobre la cancelación
                    break;
                case 'completed':
                    // Notificar sobre la finalización de la sesión
                    break;
            }
        };

        // Agregar event listener
        window.addEventListener('sessionStateChange', handleSessionStateChange as EventListener);

        // Cleanup
        return () => {
            window.removeEventListener('sessionStateChange', handleSessionStateChange as EventListener);
        };
    }, []);

    // Efecto para configurar notificaciones automáticas
    useEffect(() => {
        const cleanup = setupAutomaticNotifications();
        return cleanup;
    }, [setupAutomaticNotifications]);

    return {
        pushNotifications,
        isEnabled,
        requestPermission,
        addPushNotification,
        removePushNotification,
        clearAllPushNotifications,
        getPushNotificationsByPriority,
        getUrgentPushNotifications,
        getHighPriorityPushNotifications,
        hasUrgentNotifications,
        hasHighPriorityNotifications,
        showBrowserNotification,
    };
} 