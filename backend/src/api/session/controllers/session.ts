import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::session.session', ({ strapi }) => ({
  // Crear una nueva sesión
  async create(ctx) {
    try {
      console.log('=== CREATE SESSION CALLED ===');
      console.log('Request body:', ctx.request.body);

      const { user: userId, companion: companionId, startTime, duration, sessionType, specialty, notes } = ctx.request.body;

      console.log('Creating session with data:', { userId, companionId, startTime, duration, sessionType, specialty, notes });

      // Validar que el usuario tenga suficiente balance
      console.log('Looking for user with ID:', userId);
      const user = await strapi.entityService.findOne('api::user-profile.user-profile', userId);

      if (!user) {
        console.log('User not found');
        return ctx.send({ error: 'Usuario no encontrado' }, 400);
      }

      console.log('User found:', user.fullName);

      // Calcular precio basado en la tarifa del acompañante
      console.log('Looking for companion with ID:', companionId);
      const companion = await strapi.entityService.findOne('api::user-profile.user-profile', companionId);

      if (!companion) {
        console.log('Companion not found');
        return ctx.send({ error: 'Acompañante no encontrado' }, 400);
      }

      console.log('Companion found:', companion.fullName);

      const price = companion.hourlyRate * (duration / 60);
      console.log('Calculated price:', price);

      if (user.balance < price) {
        console.log('Insufficient balance. User balance:', user.balance, 'Required:', price);
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
        session: (session as any).id
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
  async confirm(ctx) {
    try {
      const { id } = ctx.params;

      const session = await strapi.entityService.findOne('api::session.session', id);

      if (!session) {
        return ctx.send({ error: 'Sesión no encontrada' }, 404);
      }

      if (session.status !== 'pending') {
        return ctx.send({ error: 'La sesión no está pendiente de confirmación' }, 400);
      }

      // Confirmar la sesión
      await strapi.entityService.update('api::session.session', id, {
        data: { status: 'confirmed' as const }
      });

      return ctx.send({ message: 'Sesión confirmada exitosamente' });
    } catch (error) {
      console.error('Error confirming session:', error);
      return ctx.send({ error: 'Error al confirmar sesión' }, 500);
    }
  },

  // Rechazar una sesión (acompañante rechaza)
  async reject(ctx) {
    try {
      const { id } = ctx.params;
      console.log('=== REJECT SESSION CALLED ===');
      console.log('Session ID:', id);

      const session = await strapi.entityService.findOne('api::session.session', id, {
        populate: ['user', 'companion']
      });

      if (!session) {
        console.log('Session not found');
        return ctx.send({ error: 'Sesión no encontrada' }, 404);
      }

      console.log('Session found:', session);
      console.log('Session status:', session.status);

      if (session.status !== 'pending') {
        console.log('Session is not pending, current status:', session.status);
        return ctx.send({ error: 'La sesión no está pendiente de confirmación' }, 400);
      }

      // Obtener el usuario para devolver el saldo
      const user = await strapi.entityService.findOne('api::user-profile.user-profile', (session as any).user.id);

      if (!user) {
        return ctx.send({ error: 'Usuario no encontrado' }, 404);
      }

      // Actualizar el estado de la sesión a 'cancelled'
      await strapi.entityService.update('api::session.session', id, {
        data: { status: 'cancelled' as const }
      });

      // Devolver el saldo al usuario
      await strapi.entityService.update('api::user-profile.user-profile', (session as any).user.id, {
        data: { balance: user.balance + session.price }
      });

      // Crear un registro de pago de reembolso
      const refundPaymentData = {
        amount: session.price,
        type: 'refund' as const,
        status: 'completed' as const,
        currency: 'USDT',
        description: `Reembolso por sesión rechazada`,
        user: (session as any).user.id,
        session: session.id
      };

      await strapi.entityService.create('api::payment.payment', {
        data: refundPaymentData
      });

      console.log('Session rejected successfully');
      return ctx.send({ message: 'Sesión rechazada exitosamente' });
    } catch (error) {
      console.error('Error rejecting session:', error);
      return ctx.send({ error: 'Error al rechazar sesión' }, 500);
    }
  },

  // Obtener disponibilidad real de un acompañante
  async getCompanionAvailability(ctx) {
    try {
      const { companionId } = ctx.params;
      const { date } = ctx.query;

      if (!companionId || !date) {
        return ctx.send({ error: 'ID del acompañante y fecha son requeridos' }, 400);
      }

      // Obtener sesiones confirmadas del acompañante para la fecha
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);

      const confirmedSessions = await strapi.entityService.findMany('api::session.session', {
        filters: {
          companion: companionId,
          status: { $in: ['confirmed', 'in_progress'] },
          startTime: { $gte: startOfDay.toISOString() },
          endTime: { $lte: endOfDay.toISOString() }
        },
        sort: { startTime: 'asc' }
      });

      return ctx.send({
        confirmedSessions: confirmedSessions,
        date: date
      });
    } catch (error) {
      console.error('Error getting companion availability:', error);
      return ctx.send({ error: 'Error al obtener disponibilidad del acompañante' }, 500);
    }
  },

  // Obtener acompañantes disponibles
  async getAvailableCompanions(ctx) {
    try {
      console.log('=== GET AVAILABLE COMPANIONS ===');

      const companions = await strapi.entityService.findMany('api::user-profile.user-profile', {
        filters: {
          role: 'companion'
        },
        populate: '*'
      });

      console.log('Companions found:', companions.length);
      if (companions.length > 0) {
        console.log('First companion:', companions[0]);
      }

      // Transformar los datos para que sean compatibles con el frontend
      const transformedCompanions = companions.map(companion => ({
        id: companion.id,
        fullName: companion.fullName,
        hourlyRate: companion.hourlyRate || 0,
        specialties: Array.isArray(companion.specialties) ? companion.specialties : [],
        languages: Array.isArray(companion.languages) ? companion.languages : [],
        bio: companion.bio || '',
        averageRating: companion.averageRating || 0,
        isOnline: companion.isOnline || false
      }));

      return ctx.send(transformedCompanions);
    } catch (error) {
      console.error('Error getting available companions:', error);
      return ctx.send({ error: 'Error al obtener acompañantes disponibles' }, 500);
    }
  },

  // Obtener sesiones de un usuario
  async getUserSessions(ctx) {
    try {
      console.log('=== GET USER SESSIONS CALLED ===');
      const { userId } = ctx.params;
      console.log('User ID from params:', userId);

      console.log('Searching for sessions with user filter:', { user: userId });

      // Usar el método findMany con el filtro correcto
      const sessions = await strapi.entityService.findMany('api::session.session', {
        filters: {
          user: {
            id: userId
          }
        },
        populate: ['companion'],
        sort: { createdAt: 'desc' }
      });

      console.log('Sessions found:', sessions.length);
      if (sessions.length > 0) {
        console.log('First session:', sessions[0]);
      }

      return ctx.send(sessions);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return ctx.send({ error: 'Error al obtener sesiones del usuario' }, { status: 500 });
    }
  }
})); 