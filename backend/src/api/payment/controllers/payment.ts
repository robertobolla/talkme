import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::payment.payment', ({ strapi }) => ({
  // Depositar fondos en la cuenta del usuario
  async deposit(ctx) {
    try {
      const { userId, amount, currency = 'USDT', transactionHash, cryptoAddress } = ctx.request.body;

      if (!userId || !amount) {
        return ctx.send({ error: 'userId y amount son requeridos' }, 400);
      }

      // Verificar que el usuario existe
      const user = await strapi.entityService.findOne('api::user-profile.user-profile', userId);
      if (!user) {
        return ctx.send({ error: 'Usuario no encontrado' }, 404);
      }

      // Crear registro de depósito
      const payment = await strapi.entityService.create('api::payment.payment', {
        data: {
          amount,
          type: 'deposit',
          status: 'pending',
          currency,
          transactionHash,
          cryptoAddress,
          description: `Depósito de ${amount} ${currency}`,
          user: userId
        }
      });

      return ctx.send(payment, 201);
    } catch (error) {
      console.error('Error creating deposit:', error);
      return ctx.send({ error: 'Error al crear el depósito' }, 500);
    }
  },

  // Retirar fondos de la cuenta del usuario
  async withdraw(ctx) {
    try {
      const { userId, amount, currency = 'USDT', cryptoAddress } = ctx.request.body;

      if (!userId || !amount) {
        return ctx.send({ error: 'userId y amount son requeridos' }, 400);
      }

      // Verificar que el usuario existe y tiene suficiente balance
      const user = await strapi.entityService.findOne('api::user-profile.user-profile', userId);
      if (!user) {
        return ctx.send({ error: 'Usuario no encontrado' }, 404);
      }

      if (user.balance < amount) {
        return ctx.send({ error: 'Balance insuficiente para el retiro' }, 400);
      }

      // Crear registro de retiro
      const payment = await strapi.entityService.create('api::payment.payment', {
        data: {
          amount,
          type: 'withdrawal',
          status: 'pending',
          currency,
          cryptoAddress,
          description: `Retiro de ${amount} ${currency}`,
          user: userId
        }
      });

      return ctx.send(payment, 201);
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      return ctx.send({ error: 'Error al crear el retiro' }, 500);
    }
  },

  // Obtener pagos de un usuario
  async getUserPayments(ctx) {
    try {
      const { userId } = ctx.params;

      const payments = await strapi.entityService.findMany('api::payment.payment', {
        filters: { user: userId },
        sort: { createdAt: 'desc' }
      });

      return ctx.send(payments);
    } catch (error) {
      console.error('Error getting user payments:', error);
      return ctx.send({ error: 'Error al obtener los pagos' }, 500);
    }
  },

  // Obtener balance de un usuario
  async getUserBalance(ctx) {
    try {
      const { userId } = ctx.params;

      const user = await strapi.entityService.findOne('api::user-profile.user-profile', userId);
      if (!user) {
        return ctx.send({ error: 'Usuario no encontrado' }, 404);
      }

      return ctx.send({
        balance: user.balance || 0,
        totalEarnings: user.totalEarnings || 0
      });
    } catch (error) {
      console.error('Error getting user balance:', error);
      return ctx.send({ error: 'Error al obtener el balance' }, 500);
    }
  },

  // Confirmar una transacción
  async confirmTransaction(ctx: any) {
    try {
      const { id } = ctx.params;

      // Obtener el pago
      const paymentRecord = await strapi.entityService.findOne('api::payment.payment', id);

      if (!paymentRecord) {
        return ctx.send({ error: 'Pago no encontrado' }, 404);
      }

      if (paymentRecord.status === 'completed') {
        return ctx.send({ error: 'El pago ya está completado' }, 400);
      }

      // Actualizar el estado del pago
      await strapi.entityService.update('api::payment.payment', id, {
        data: { status: 'completed' as const }
      });

      // Si es un depósito, actualizar el saldo del usuario
      if (paymentRecord.type === 'deposit') {
        const userId = (paymentRecord as any).user;
        const user = await strapi.entityService.findOne('api::user-profile.user-profile', userId);

        if (user) {
          await strapi.entityService.update('api::user-profile.user-profile', userId, {
            data: { balance: user.balance + paymentRecord.amount }
          });
        }
      }

      return ctx.send({ message: 'Transacción confirmada exitosamente' });
    } catch (error) {
      console.error('Error confirming transaction:', error);
      return ctx.send({ error: 'Error al confirmar transacción' }, 500);
    }
  }
})); 