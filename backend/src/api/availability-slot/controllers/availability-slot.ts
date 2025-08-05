import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::availability-slot.availability-slot', ({ strapi }) => ({
  // Obtener todos los slots de disponibilidad
  async find(ctx) {
    try {
      const result = await strapi.entityService.findMany('api::availability-slot.availability-slot', {
        populate: ['companion']
      });
      return { data: result };
    } catch (error) {
      console.error('Error in availability-slot find:', error);
      return ctx.send({ error: 'Error al obtener horarios de disponibilidad' }, 500);
    }
  },

  // Obtener un slot específico
  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      const result = await strapi.entityService.findOne('api::availability-slot.availability-slot', id, {
        populate: ['companion']
      });
      return { data: result };
    } catch (error) {
      console.error('Error in availability-slot findOne:', error);
      return ctx.send({ error: 'Error al obtener horario de disponibilidad' }, 500);
    }
  },

  // Crear un nuevo slot
  async create(ctx) {
    try {
      console.log('Creating availability slot with data:', ctx.request.body);
      const result = await strapi.entityService.create('api::availability-slot.availability-slot', {
        data: ctx.request.body.data
      });
      console.log('Availability slot created successfully:', result);
      return { data: result };
    } catch (error) {
      console.error('Error in availability-slot create:', error);
      return ctx.send({
        error: 'Error al crear horario de disponibilidad',
        details: error.message
      }, 500);
    }
  },

  // Actualizar un slot
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const result = await strapi.entityService.update('api::availability-slot.availability-slot', id, {
        data: ctx.request.body.data
      });
      return { data: result };
    } catch (error) {
      console.error('Error in availability-slot update:', error);
      return ctx.send({ error: 'Error al actualizar horario de disponibilidad' }, 500);
    }
  },

  // Eliminar un slot
  async delete(ctx) {
    try {
      const { id } = ctx.params;
      const result = await strapi.entityService.delete('api::availability-slot.availability-slot', id);
      return { data: result };
    } catch (error) {
      console.error('Error in availability-slot delete:', error);
      return ctx.send({ error: 'Error al eliminar horario de disponibilidad' }, 500);
    }
  }
})); 