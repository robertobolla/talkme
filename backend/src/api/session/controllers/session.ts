import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::session.session', ({ strapi }) => ({
  // Crear una nueva sesión
  async create(ctx) {
    try {
      const { user: userId, companion: companionId, startTime, duration, sessionType, specialty, notes } = ctx.request.body;

      console.log('Creating session with data:', { userId, companionId, startTime, duration, sessionType, specialty, notes });

      // Validar que el usuario tenga suficiente balance
      const user = await strapi.entityService.findOne('api::user-profile.user-profile', userId);

      if (!user) {
        return ctx.send({ error: 'Usuario no encontrado' }, 400);
      }

      // Calcular precio basado en la tarifa del acompañante
      const companion = await strapi.entityService.findOne('api::user-profile.user-profile', companionId);

      if (!companion) {
        return ctx.send({ error: 'Acompañante no encontrado' }, 400);
      }

      const price = companion.hourlyRate * (duration / 60);

      if (user.balance < price) {
        return ctx.send({ error: 'Saldo insuficiente' }, 400);
      }

      // Crear la sesión
      const sessionData = {
        title: `Sesión con ${companion.fullName}`,
        description: notes || `Sesión de ${sessionType} con ${companion.fullName}`,
        startTime: new Date(startTime),
        endTime: new Date(new Date(startTime).getTime() + duration * 60000),
        duration,
        price,
        sessionType,
        specialty: specialty || 'general',
        notes,
        status: 'pending' as const,
        user: userId,
        companion: companionId
      };

      console.log('Creating session with data:', sessionData);

      const session = await strapi.entityService.create('api::session.session', {
        data: sessionData
      });

      console.log('Session created successfully:', session);

      // Crear el pago
      const paymentData = {
        amount: price,
        type: 'session_payment' as const,
        status: 'completed' as const,
        currency: 'USDT',
        description: `Pago por sesión de ${duration} minutos`,
        user: userId,
        session: session.id
      };

      console.log('Creating payment with data:', paymentData);

      const payment = await strapi.entityService.create('api::payment.payment', {
        data: paymentData
      });

      // Actualizar el balance del usuario
      await strapi.entityService.update('api::user-profile.user-profile', userId, {
        data: { balance: user.balance - price }
      });

      return ctx.send(session, 201);
    } catch (error) {
      console.error('Error creating session:', error);
      return ctx.send({ error: 'Error al crear la sesión' }, 500);
    }
  },

  // Confirmar una sesión (acompañante acepta)
  async confirm(ctx: any) {
    try {
      const { id } = ctx.params;

      // Obtener la sesión
      const session = await strapi.entityService.findOne('api::session.session', id);

      if (!session) {
        return ctx.send({ error: 'Sesión no encontrada' }, 404);
      }

      if (session.status !== 'pending') {
        return ctx.send({ error: 'La sesión no está pendiente de confirmación' }, 400);
      }

      // Obtener el acompañante usando el ID de la sesión
      const sessionWithCompanion = await strapi.entityService.findOne('api::session.session', id, {
        populate: ['companion']
      }) as any;

      if (!sessionWithCompanion || !sessionWithCompanion.companion) {
        return ctx.send({ error: 'Acompañante no encontrado' }, 404);
      }

      const companionId = sessionWithCompanion.companion.id;
      const companion = await strapi.entityService.findOne('api::user-profile.user-profile', companionId);

      if (!companion) {
        return ctx.send({ error: 'Acompañante no encontrado' }, 404);
      }

      // Confirmar la sesión
      await strapi.entityService.update('api::session.session', id, {
        data: { status: 'confirmed' as const }
      });

      // Actualizar ganancias del acompañante (80% del precio de la sesión)
      await strapi.entityService.update('api::user-profile.user-profile', companionId, {
        data: {
          totalEarnings: companion.totalEarnings + session.price * 0.8 // 80% para el acompañante
        }
      });

      return ctx.send({ message: 'Sesión confirmada exitosamente' });
    } catch (error) {
      console.error('Error confirming session:', error);
      return ctx.send({ error: 'Error al confirmar sesión' }, 500);
    }
  },

  // Rechazar una sesión (acompañante rechaza)
  async reject(ctx: any) {
    try {
      const { id } = ctx.params;

      // Obtener la sesión
      const session = await strapi.entityService.findOne('api::session.session', id);

      if (!session) {
        return ctx.send({ error: 'Sesión no encontrada' }, 404);
      }

      if (session.status !== 'pending') {
        return ctx.send({ error: 'La sesión no está pendiente de confirmación' }, 400);
      }

      // Obtener el usuario para devolver el saldo
      const user = await strapi.entityService.findOne('api::user-profile.user-profile', session.user);

      if (!user) {
        return ctx.send({ error: 'Usuario no encontrado' }, 404);
      }

      // Actualizar el estado de la sesión a 'cancelled'
      await strapi.entityService.update('api::session.session', id, {
        data: { status: 'cancelled' as const }
      });

      // Devolver el saldo al usuario
      await strapi.entityService.update('api::user-profile.user-profile', session.user, {
        data: { balance: user.balance + session.price }
      });

      // Crear un registro de pago de reembolso
      const refundPaymentData = {
        amount: session.price,
        type: 'refund' as const,
        status: 'completed' as const,
        currency: 'USDT',
        description: `Reembolso por sesión rechazada`,
        user: session.user,
        session: session.id
      };

      await strapi.entityService.create('api::payment.payment', {
        data: refundPaymentData
      });

      return ctx.send({ message: 'Sesión rechazada exitosamente' });
    } catch (error) {
      console.error('Error rejecting session:', error);
      return ctx.send({ error: 'Error al rechazar sesión' }, 500);
    }
  },

  // Iniciar una sesión
  async start(ctx) {
    try {
      const { id } = ctx.params;

      const session = await strapi.entityService.findOne('api::session.session', id);

      if (!session) {
        return ctx.send({ error: 'Sesión no encontrada' }, 404);
      }

      // Verificar que sea hora de iniciar (5 minutos antes o después)
      const now = new Date();
      const sessionStart = new Date(session.startTime);
      const timeDiff = Math.abs(now.getTime() - sessionStart.getTime()) / 60000; // en minutos

      if (timeDiff > 5) {
        return ctx.send({ error: 'La sesión no puede iniciarse aún' }, 400);
      }

      // Actualizar el estado de la sesión
      await strapi.entityService.update('api::session.session', id, {
        data: {
          status: 'in_progress' as const,
          actualStartTime: now
        }
      });

      return ctx.send({
        message: 'Sesión iniciada',
        dailyRoomUrl: `https://daily.co/room/${session.id}`,
        dailyRoomToken: 'token_placeholder'
      });
    } catch (error) {
      console.error('Error starting session:', error);
      return ctx.send({ error: 'Error al iniciar la sesión' }, 500);
    }
  },

  // Completar una sesión
  async complete(ctx) {
    try {
      const { id } = ctx.params;
      const { rating, review } = ctx.request.body;

      const session = await strapi.entityService.findOne('api::session.session', id);

      if (!session) {
        return ctx.send({ error: 'Sesión no encontrada' }, 404);
      }

      const now = new Date();

      // Actualizar el estado de la sesión
      await strapi.entityService.update('api::session.session', id, {
        data: {
          status: 'completed' as const,
          actualEndTime: now,
          rating,
          review
        }
      });

      return ctx.send({ message: 'Sesión completada exitosamente' });
    } catch (error) {
      console.error('Error completing session:', error);
      return ctx.send({ error: 'Error al completar la sesión' }, 500);
    }
  },

  // Obtener sesiones de un usuario
  async getUserSessions(ctx) {
    try {
      const { userId } = ctx.params;

      const sessions = await strapi.entityService.findMany('api::session.session', {
        filters: {
          $or: [
            { user: userId },
            { companion: userId }
          ]
        },
        populate: ['user', 'companion'],
        sort: { startTime: 'desc' }
      });

      return ctx.send(sessions);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return ctx.send({ error: 'Error al obtener las sesiones' }, 500);
    }
  },

  // Obtener acompañantes disponibles
  async getAvailableCompanions(ctx) {
    try {
      const companions = await strapi.entityService.findMany('api::user-profile.user-profile', {
        filters: {
          role: 'companion',
          status: 'approved',
          isOnline: true
        },
        sort: { fullName: 'asc' }
      });

      console.log('Companions found:', companions.length);
      return ctx.send(companions);
    } catch (error) {
      console.error('Error getting available companions:', error);
      return ctx.send({ error: 'Error al obtener acompañantes disponibles' }, 500);
    }
  }
})); 