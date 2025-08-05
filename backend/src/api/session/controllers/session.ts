import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::session.session', ({ strapi }) => ({
  // Crear una nueva sesión
  async create(ctx) {
    try {
      const { user: userId, companion: companionId, startTime, duration, sessionType, specialty, notes } = ctx.request.body;

      // Validar que el usuario tenga suficiente balance
      const user = await strapi.entityService.findOne('api::user-profile.user-profile', userId, {
        populate: ['balance']
      });

      if (!user) {
        return ctx.badRequest('Usuario no encontrado');
      }

      // Calcular precio basado en la tarifa del acompañante
      const companion = await strapi.entityService.findOne('api::user-profile.user-profile', companionId, {
        populate: ['hourlyRate']
      });

      if (!companion) {
        return ctx.badRequest('Acompañante no encontrado');
      }

      const price = (companion.hourlyRate * duration) / 60; // Convertir minutos a horas

      // Verificar balance suficiente
      if (user.balance < price) {
        return ctx.badRequest('Balance insuficiente para esta sesión');
      }

      // Calcular endTime
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000); // duration en minutos

      // Crear la sesión
      const session = await strapi.entityService.create('api::session.session', {
        data: {
          title: `Sesión con ${companion.fullName}`,
          description: notes || `Sesión de ${sessionType} con ${companion.fullName}`,
          startTime: startDateTime,
          endTime: endDateTime,
          duration,
          price,
          sessionType,
          specialty,
          notes,
          status: 'pending',
          user: userId,
          companion: companionId
        }
      });

      // Descontar balance del usuario
      await strapi.entityService.update('api::user-profile.user-profile', userId, {
        data: {
          balance: user.balance - price
        }
      });

      // Crear registro de pago
      await strapi.entityService.create('api::payment.payment', {
        data: {
          amount: price,
          type: 'session_payment',
          status: 'completed',
          currency: 'USDT',
          description: `Pago por sesión de ${duration} minutos`,
          user: userId,
          session: session.id
        }
      });

      return ctx.created(session);
    } catch (error) {
      console.error('Error creating session:', error);
      return ctx.internalServerError('Error al crear la sesión');
    }
  },

  // Confirmar una sesión (por el acompañante)
  async confirm(ctx) {
    try {
      const { id } = ctx.params;

      const session = await strapi.entityService.findOne('api::session.session', id, {
        populate: ['companion', 'user']
      });

      if (!session) {
        return ctx.notFound('Sesión no encontrada');
      }

      if (session.status !== 'pending') {
        return ctx.badRequest('La sesión ya no está pendiente');
      }

      // Actualizar estado de la sesión
      const updatedSession = await strapi.entityService.update('api::session.session', id, {
        data: {
          status: 'confirmed'
        }
      });

      return ctx.ok(updatedSession);
    } catch (error) {
      console.error('Error confirming session:', error);
      return ctx.internalServerError('Error al confirmar la sesión');
    }
  },

  // Iniciar una sesión (crear sala de Daily.co)
  async start(ctx) {
    try {
      const { id } = ctx.params;

      const session = await strapi.entityService.findOne('api::session.session', id, {
        populate: ['companion', 'user']
      });

      if (!session) {
        return ctx.notFound('Sesión no encontrada');
      }

      if (session.status !== 'confirmed') {
        return ctx.badRequest('La sesión debe estar confirmada para iniciar');
      }

      const now = new Date();
      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);

      // Verificar que esté en el horario de la sesión
      if (now < startTime || now > endTime) {
        return ctx.badRequest('La sesión no está en su horario programado');
      }

      // Aquí integrarías Daily.co para crear la sala
      // Por ahora simulamos la creación
      const dailyRoomUrl = `https://daily.co/room/${session.id}`;
      const dailyRoomToken = `token_${session.id}`;
      const dailyRoomExpiresAt = endTime;

      // Actualizar sesión con información de la sala
      const updatedSession = await strapi.entityService.update('api::session.session', id, {
        data: {
          status: 'in_progress',
          dailyRoomUrl,
          dailyRoomToken,
          dailyRoomExpiresAt
        }
      });

      return ctx.ok(updatedSession);
    } catch (error) {
      console.error('Error starting session:', error);
      return ctx.internalServerError('Error al iniciar la sesión');
    }
  },

  // Finalizar una sesión
  async complete(ctx) {
    try {
      const { id } = ctx.params;

      const session = await strapi.entityService.findOne('api::session.session', id, {
        populate: ['companion', 'user']
      });

      if (!session) {
        return ctx.notFound('Sesión no encontrada');
      }

      if (session.status !== 'in_progress') {
        return ctx.badRequest('La sesión debe estar en progreso para finalizar');
      }

      // Calcular ganancias del acompañante (ejemplo: 80% del precio)
      const companionEarnings = session.price * 0.8;
      const platformFee = session.price * 0.2;

      // Actualizar balance del acompañante
      const companion = await strapi.entityService.findOne('api::user-profile.user-profile', session.companion.id);
      await strapi.entityService.update('api::user-profile.user-profile', session.companion.id, {
        data: {
          balance: companion.balance + companionEarnings,
          totalEarnings: companion.totalEarnings + companionEarnings
        }
      });

      // Crear registro de ganancia para el acompañante
      await strapi.entityService.create('api::payment.payment', {
        data: {
          amount: companionEarnings,
          type: 'session_earning',
          status: 'completed',
          currency: 'USDT',
          description: `Ganancia por sesión de ${session.duration} minutos`,
          user: session.companion.id,
          session: session.id
        }
      });

      // Actualizar estado de la sesión
      const updatedSession = await strapi.entityService.update('api::session.session', id, {
        data: {
          status: 'completed'
        }
      });

      return ctx.ok(updatedSession);
    } catch (error) {
      console.error('Error completing session:', error);
      return ctx.internalServerError('Error al finalizar la sesión');
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

      return ctx.ok(sessions);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return ctx.internalServerError('Error al obtener las sesiones');
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
        populate: ['profilePhoto'],
        sort: { averageRating: 'desc' }
      });

      return ctx.ok(companions);
    } catch (error) {
      console.error('Error getting available companions:', error);
      return ctx.internalServerError('Error al obtener acompañantes disponibles');
    }
  }
})); 