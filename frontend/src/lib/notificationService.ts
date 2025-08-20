/**
 * Servicio para crear notificaciones automáticamente
 */

export interface CreateNotificationData {
  recipientId: number;
  title: string;
  message: string;
  type: 'session_request' | 'session_confirmed' | 'session_cancelled' | 'session_completed' | 'session_reminder' | 'payment_received' | 'payment_sent' | 'profile_updated' | 'review_received' | 'system_alert';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: any;
}

export class NotificationService {
  /**
   * Crear notificación de solicitud de sesión
   */
  static async createSessionRequestNotification(
    companionId: number,
    userName: string,
    sessionTitle: string,
    sessionId: number
  ) {
    return this.createNotification({
      recipientId: companionId,
      title: 'Nueva solicitud de sesión',
      message: `${userName} ha solicitado una sesión: "${sessionTitle}"`,
      type: 'session_request',
      priority: 'high',
      metadata: {
        sessionId,
        userName,
        sessionTitle,
      },
    });
  }

  /**
   * Crear notificación de sesión confirmada
   */
  static async createSessionConfirmedNotification(
    userId: number,
    companionName: string,
    sessionTitle: string,
    sessionId: number
  ) {
    return this.createNotification({
      recipientId: userId,
      title: 'Sesión confirmada',
      message: `${companionName} ha confirmado tu sesión: "${sessionTitle}"`,
      type: 'session_confirmed',
      priority: 'medium',
      metadata: {
        sessionId,
        companionName,
        sessionTitle,
      },
    });
  }

  /**
   * Crear notificación de sesión cancelada
   */
  static async createSessionCancelledNotification(
    recipientId: number,
    otherPartyName: string,
    sessionTitle: string,
    sessionId: number,
    reason?: string
  ) {
    return this.createNotification({
      recipientId,
      title: 'Sesión cancelada',
      message: `${otherPartyName} ha cancelado la sesión: "${sessionTitle}"${reason ? ` - Razón: ${reason}` : ''}`,
      type: 'session_cancelled',
      priority: 'high',
      metadata: {
        sessionId,
        otherPartyName,
        sessionTitle,
        reason,
      },
    });
  }

  /**
   * Crear notificación de sesión completada
   */
  static async createSessionCompletedNotification(
    userId: number,
    companionName: string,
    sessionTitle: string,
    sessionId: number
  ) {
    return this.createNotification({
      recipientId: userId,
      title: 'Sesión completada',
      message: `Tu sesión con ${companionName}: "${sessionTitle}" ha sido completada`,
      type: 'session_completed',
      priority: 'medium',
      metadata: {
        sessionId,
        companionName,
        sessionTitle,
      },
    });
  }

  /**
   * Crear notificación de recordatorio de sesión
   */
  static async createSessionReminderNotification(
    recipientId: number,
    otherPartyName: string,
    sessionTitle: string,
    sessionId: number,
    startTime: string
  ) {
    const sessionTime = new Date(startTime);
    const timeString = sessionTime.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return this.createNotification({
      recipientId,
      title: 'Recordatorio de sesión',
      message: `Tu sesión con ${otherPartyName}: "${sessionTitle}" comienza en 30 minutos (${timeString})`,
      type: 'session_reminder',
      priority: 'high',
      metadata: {
        sessionId,
        otherPartyName,
        sessionTitle,
        startTime,
      },
    });
  }

  /**
   * Crear notificación de pago recibido
   */
  static async createPaymentReceivedNotification(
    recipientId: number,
    amount: number,
    fromUserName: string,
    sessionTitle?: string
  ) {
    return this.createNotification({
      recipientId,
      title: 'Pago recibido',
      message: `Has recibido $${amount} de ${fromUserName}${sessionTitle ? ` por la sesión: "${sessionTitle}"` : ''}`,
      type: 'payment_received',
      priority: 'medium',
      metadata: {
        amount,
        fromUserName,
        sessionTitle,
      },
    });
  }

  /**
   * Crear notificación de pago enviado
   */
  static async createPaymentSentNotification(
    recipientId: number,
    amount: number,
    toUserName: string,
    sessionTitle?: string
  ) {
    return this.createNotification({
      recipientId,
      title: 'Pago enviado',
      message: `Has enviado $${amount} a ${toUserName}${sessionTitle ? ` por la sesión: "${sessionTitle}"` : ''}`,
      type: 'payment_sent',
      priority: 'low',
      metadata: {
        amount,
        toUserName,
        sessionTitle,
      },
    });
  }

  /**
   * Crear notificación de perfil actualizado
   */
  static async createProfileUpdatedNotification(
    recipientId: number,
    profileType: 'user' | 'companion'
  ) {
    return this.createNotification({
      recipientId,
      title: 'Perfil actualizado',
      message: `Tu perfil de ${profileType === 'user' ? 'cliente' : 'acompañante'} ha sido actualizado exitosamente`,
      type: 'profile_updated',
      priority: 'low',
      metadata: {
        profileType,
      },
    });
  }

  /**
   * Crear notificación de reseña recibida
   */
  static async createReviewReceivedNotification(
    recipientId: number,
    reviewerName: string,
    rating: number,
    sessionTitle: string,
    sessionId: number
  ) {
    const stars = '⭐'.repeat(rating);
    return this.createNotification({
      recipientId,
      title: 'Nueva reseña recibida',
      message: `${reviewerName} te ha dejado una reseña: ${stars} por la sesión "${sessionTitle}"`,
      type: 'review_received',
      priority: 'medium',
      metadata: {
        sessionId,
        reviewerName,
        rating,
        sessionTitle,
      },
    });
  }

  /**
   * Crear notificación del sistema
   */
  static async createSystemNotification(
    recipientId: number,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) {
    return this.createNotification({
      recipientId,
      title,
      message,
      type: 'system_alert',
      priority,
      metadata: {
        systemNotification: true,
      },
    });
  }

  /**
   * Método base para crear notificaciones
   */
  private static async createNotification(data: CreateNotificationData) {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error al crear notificación: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Notificación creada:', result);
      return result;

    } catch (error) {
      console.error('Error en NotificationService:', error);
      throw error;
    }
  }

  /**
   * Crear múltiples notificaciones
   */
  static async createMultipleNotifications(notifications: CreateNotificationData[]) {
    const promises = notifications.map(notification => this.createNotification(notification));
    return Promise.all(promises);
  }

  /**
   * Crear notificación de bienvenida para nuevos usuarios
   */
  static async createWelcomeNotification(
    recipientId: number,
    userName: string,
    userRole: 'user' | 'companion'
  ) {
    const roleText = userRole === 'user' ? 'cliente' : 'acompañante';
    const welcomeMessage = userRole === 'user' 
      ? `¡Bienvenido a nuestra plataforma! Como ${roleText}, podrás reservar sesiones con acompañantes profesionales.`
      : `¡Bienvenido a nuestra plataforma! Como ${roleText}, podrás ofrecer tus servicios a clientes que necesiten compañía.`;

    return this.createNotification({
      recipientId,
      title: `¡Bienvenido, ${userName}!`,
      message: welcomeMessage,
      type: 'system_alert',
      priority: 'medium',
      metadata: {
        welcomeNotification: true,
        userRole,
      },
    });
  }
} 