import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::payment.payment', ({ strapi }) => ({
  // Depositar saldo (recarga con criptomonedas)
  async deposit(ctx) {
    try {
      const { userId, amount, transactionHash, cryptoAddress } = ctx.request.body;

      // Validar que el usuario existe
      const user = await strapi.entityService.findOne('api::user-profile.user-profile', userId);
      if (!user) {
        return ctx.badRequest('Usuario no encontrado');
      }

      // Crear registro de depósito
      const payment = await strapi.entityService.create('api::payment.payment', {
        data: {
          amount,
          type: 'deposit',
          status: 'pending',
          currency: 'USDT',
          transactionHash,
          cryptoAddress,
          description: `Depósito de ${amount} USDT`,
          user: userId
        }
      });

      // Por ahora marcamos como completado automáticamente
      // En producción, esto se haría después de confirmar la transacción
      const completedPayment = await strapi.entityService.update('api::payment.payment', payment.id, {
        data: {
          status: 'completed',
          processedAt: new Date()
        }
      });

      // Actualizar balance del usuario
      await strapi.entityService.update('api::user-profile.user-profile', userId, {
        data: {
          balance: user.balance + amount
        }
      });

      return ctx.created(completedPayment);
    } catch (error) {
      console.error('Error processing deposit:', error);
      return ctx.internalServerError('Error al procesar el depósito');
    }
  },

  // Retirar saldo
  async withdraw(ctx) {
    try {
      const { userId, amount, cryptoAddress } = ctx.request.body;

      // Validar que el usuario existe y tiene suficiente balance
      const user = await strapi.entityService.findOne('api::user-profile.user-profile', userId);
      if (!user) {
        return ctx.badRequest('Usuario no encontrado');
      }

      if (user.balance < amount) {
        return ctx.badRequest('Balance insuficiente para el retiro');
      }

      // Crear registro de retiro
      const payment = await strapi.entityService.create('api::payment.payment', {
        data: {
          amount: -amount, // Negativo para indicar retiro
          type: 'withdrawal',
          status: 'pending',
          currency: 'USDT',
          cryptoAddress,
          description: `Retiro de ${amount} USDT`,
          user: userId
        }
      });

      // Actualizar balance del usuario
      await strapi.entityService.update('api::user-profile.user-profile', userId, {
        data: {
          balance: user.balance - amount
        }
      });

      return ctx.created(payment);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      return ctx.internalServerError('Error al procesar el retiro');
    }
  },

  // Obtener historial de pagos de un usuario
  async getUserPayments(ctx) {
    try {
      const { userId } = ctx.params;

      const payments = await strapi.entityService.findMany('api::payment.payment', {
        filters: {
          user: userId
        },
        populate: ['user', 'session'],
        sort: { createdAt: 'desc' }
      });

      return ctx.ok(payments);
    } catch (error) {
      console.error('Error getting user payments:', error);
      return ctx.internalServerError('Error al obtener el historial de pagos');
    }
  },

  // Obtener balance actual de un usuario
  async getUserBalance(ctx) {
    try {
      const { userId } = ctx.params;

      const user = await strapi.entityService.findOne('api::user-profile.user-profile', userId, {
        populate: ['balance', 'totalEarnings']
      });

      if (!user) {
        return ctx.notFound('Usuario no encontrado');
      }

      return ctx.ok({
        balance: user.balance,
        totalEarnings: user.totalEarnings
      });
    } catch (error) {
      console.error('Error getting user balance:', error);
      return ctx.internalServerError('Error al obtener el balance');
    }
  },

  // Confirmar transacción de criptomonedas (webhook)
  async confirmTransaction(ctx) {
    try {
      const { transactionHash, status } = ctx.request.body;

      // Buscar el pago por hash de transacción
      const payment = await strapi.entityService.findMany('api::payment.payment', {
        filters: {
          transactionHash,
          type: 'deposit'
        }
      });

      if (payment.length === 0) {
        return ctx.notFound('Transacción no encontrada');
      }

      const paymentRecord = payment[0];

      if (status === 'confirmed') {
        // Marcar como completado
        await strapi.entityService.update('api::payment.payment', paymentRecord.id, {
          data: {
            status: 'completed',
            processedAt: new Date()
          }
        });

        // Actualizar balance del usuario
        const user = await strapi.entityService.findOne('api::user-profile.user-profile', paymentRecord.user.id);
        await strapi.entityService.update('api::user-profile.user-profile', paymentRecord.user.id, {
          data: {
            balance: user.balance + paymentRecord.amount
          }
        });
      } else if (status === 'failed') {
        // Marcar como fallido
        await strapi.entityService.update('api::payment.payment', paymentRecord.id, {
          data: {
            status: 'failed',
            processedAt: new Date()
          }
        });
      }

      return ctx.ok({ message: 'Transacción procesada' });
    } catch (error) {
      console.error('Error confirming transaction:', error);
      return ctx.internalServerError('Error al confirmar la transacción');
    }
  }
})); 