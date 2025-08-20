/**
 * notification controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::notification.notification', ({ strapi }) => ({
    // Método personalizado para obtener notificaciones de un usuario
    async getUserNotifications(ctx) {
        try {
            const { userId } = ctx.params;

            const notifications = await strapi.entityService.findMany('api::notification.notification', {
                filters: { recipientId: userId },
                sort: { createdAt: 'desc' },
                populate: '*'
            });

            return { data: notifications };
        } catch (error) {
            ctx.throw(500, error);
        }
    },

    // Método personalizado para marcar como leída
    async markAsRead(ctx) {
        try {
            const { id } = ctx.params;

            const notification = await strapi.entityService.update('api::notification.notification', id, {
                data: {
                    status: 'read',
                    readAt: new Date().toISOString()
                }
            });

            return { data: notification };
        } catch (error) {
            ctx.throw(500, error);
        }
    }
})); 