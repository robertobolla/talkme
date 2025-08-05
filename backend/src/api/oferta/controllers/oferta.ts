import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::oferta.oferta', ({ strapi }) => ({
  async create(ctx: any) {
    try {
      const { data } = ctx.request.body;
      const { user } = ctx.state;

      if (!user) {
        return ctx.send({ error: 'Usuario no autenticado' }, 401);
      }

      // Buscar perfil del usuario
      const profile = await strapi.entityService.findOne('api::user-profile.user-profile', user.id);

      if (!profile || profile.role !== 'companion') {
        return ctx.send({ error: 'Solo los acompañantes pueden crear ofertas' }, 403);
      }

      const ofertaData = {
        title: data.title,
        description: data.description,
        price: data.price,
        status: 'published' as const,
        professional: profile.id // Usar 'professional' en lugar de 'companion'
      };

      const oferta = await strapi.entityService.create('api::oferta.oferta', {
        data: ofertaData as any
      });

      return ctx.send(oferta);
    } catch (error) {
      console.error('Error creating oferta:', error);
      return ctx.send({ error: 'Error al crear oferta' }, 500);
    }
  },

  async getAvailableOffers(ctx: any) {
    try {
      const ofertas = await strapi.entityService.findMany('api::oferta.oferta', {
        filters: { status: 'published' },
        populate: ['professional'],
        sort: { createdAt: 'desc' }
      });

      return ctx.send(ofertas);
    } catch (error) {
      console.error('Error getting available offers:', error);
      return ctx.send({ error: 'Error al obtener ofertas' }, 500);
    }
  },

  async getProfessionalOffers(ctx: any) {
    try {
      const { user } = ctx.state;

      if (!user) {
        return ctx.send({ error: 'Usuario no autenticado' }, 401);
      }

      // Buscar perfil del usuario
      const profile = await strapi.entityService.findOne('api::user-profile.user-profile', user.id);

      if (!profile || profile.role !== 'companion') {
        return ctx.send({ error: 'Solo los acompañantes pueden ver sus ofertas' }, 403);
      }

      const ofertas = await strapi.entityService.findMany('api::oferta.oferta', {
        filters: { professional: { id: { $eq: profile.id } } },
        sort: { createdAt: 'desc' }
      });

      return ctx.send(ofertas);
    } catch (error) {
      console.error('Error getting professional offers:', error);
      return ctx.send({ error: 'Error al obtener ofertas' }, 500);
    }
  },

  async update(ctx: any) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      const { user } = ctx.state;

      if (!user) {
        return ctx.send({ error: 'Usuario no autenticado' }, 401);
      }

      // Buscar perfil del usuario
      const profile = await strapi.entityService.findOne('api::user-profile.user-profile', user.id);

      if (!profile || profile.role !== 'companion') {
        return ctx.send({ error: 'Solo los acompañantes pueden actualizar ofertas' }, 403);
      }

      // Verificar que la oferta pertenece al usuario
      const oferta = await strapi.entityService.findOne('api::oferta.oferta', id) as any;

      if (!oferta) {
        return ctx.send({ error: 'Oferta no encontrada' }, 404);
      }

      if (oferta.professional !== profile.id) {
        return ctx.send({ error: 'No tienes permisos para actualizar esta oferta' }, 403);
      }

      const updatedOferta = await strapi.entityService.update('api::oferta.oferta', id, {
        data
      });

      return ctx.send(updatedOferta);
    } catch (error) {
      console.error('Error updating oferta:', error);
      return ctx.send({ error: 'Error al actualizar oferta' }, 500);
    }
  },

  async delete(ctx: any) {
    try {
      const { id } = ctx.params;
      const { user } = ctx.state;

      if (!user) {
        return ctx.send({ error: 'Usuario no autenticado' }, 401);
      }

      // Buscar perfil del usuario
      const profile = await strapi.entityService.findOne('api::user-profile.user-profile', user.id);

      if (!profile || profile.role !== 'companion') {
        return ctx.send({ error: 'Solo los acompañantes pueden eliminar ofertas' }, 403);
      }

      // Verificar que la oferta pertenece al usuario
      const oferta = await strapi.entityService.findOne('api::oferta.oferta', id) as any;

      if (!oferta) {
        return ctx.send({ error: 'Oferta no encontrada' }, 404);
      }

      if (oferta.professional !== profile.id) {
        return ctx.send({ error: 'No tienes permisos para eliminar esta oferta' }, 403);
      }

      await strapi.entityService.delete('api::oferta.oferta', id);

      return ctx.send({ message: 'Oferta eliminada exitosamente' });
    } catch (error) {
      console.error('Error deleting oferta:', error);
      return ctx.send({ error: 'Error al eliminar oferta' }, 500);
    }
  }
})); 