import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::user-profile.user-profile', ({ strapi }) => ({
    async find(ctx) {
        try {
            const results = await strapi.entityService.findMany('api::user-profile.user-profile', {
                ...ctx.query,
                populate: '*'
            });

            // Convertir a formato Strapi estándar
            const data = Array.isArray(results) ? results : [];
            const meta = {
                pagination: {
                    page: 1,
                    pageSize: 10,
                    pageCount: Math.ceil(data.length / 10),
                    total: data.length
                }
            };

            return { data, meta };
        } catch (error) {
            console.error('Error in user-profile.find:', error);
            return {
                data: [],
                meta: {
                    pagination: {
                        page: 1,
                        pageSize: 10,
                        pageCount: 0,
                        total: 0
                    }
                }
            };
        }
    },

    async findOne(ctx) {
        try {
            const { id } = ctx.params;
            const data = await strapi.entityService.findOne('api::user-profile.user-profile', id, {
                populate: '*'
            });
            return { data };
        } catch (error) {
            console.error('Error in user-profile.findOne:', error);
            ctx.throw(404, 'Perfil no encontrado');
        }
    },

    async create(ctx) {
        try {
            const data = await strapi.entityService.create('api::user-profile.user-profile', {
                data: ctx.request.body.data || ctx.request.body,
                populate: '*'
            });
            return { data };
        } catch (error) {
            console.error('Error in user-profile.create:', error);
            ctx.throw(400, 'Error al crear el perfil');
        }
    },

    async update(ctx) {
        try {
            const { id } = ctx.params;
            const data = await strapi.entityService.update('api::user-profile.user-profile', id, {
                data: ctx.request.body.data || ctx.request.body,
                populate: '*'
            });
            return { data };
        } catch (error) {
            console.error('Error in user-profile.update:', error);
            ctx.throw(400, 'Error al actualizar el perfil');
        }
    },

    async delete(ctx) {
        try {
            const { id } = ctx.params;
            const data = await strapi.entityService.delete('api::user-profile.user-profile', id);
            return { data };
        } catch (error) {
            console.error('Error in user-profile.delete:', error);
            ctx.throw(400, 'Error al eliminar el perfil');
        }
    },

    // Obtener disponibilidad de un acompañante
    async getAvailability(ctx) {
        try {
            const { id } = ctx.params;
            
            // Obtener los slots de disponibilidad del acompañante
            const availabilitySlots = await strapi.entityService.findMany('api::availability-slot.availability-slot', {
                filters: {
                    companion: id,
                    isActive: true
                },
                sort: { dayOfWeek: 'asc', startTime: 'asc' }
            });

            return { data: availabilitySlots };
        } catch (error) {
            console.error('Error getting companion availability:', error);
            ctx.throw(500, 'Error al obtener disponibilidad del acompañante');
        }
    }
})); 