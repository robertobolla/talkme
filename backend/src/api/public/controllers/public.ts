export default {
  async getUserProfile(ctx) {
    const { clerkUserId } = ctx.query;

    if (!clerkUserId) {
      ctx.throw(400, 'clerkUserId es requerido');
    }

    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId },
      populate: '*'
    });

    if (userProfile.length === 0) {
      return { data: null };
    }

    return { data: userProfile[0] };
  },

  async saveUserProfile(ctx) {
    const profileData = ctx.request.body;

    if (!profileData.clerkUserId) {
      ctx.throw(400, 'clerkUserId es requerido');
    }

    // Buscar perfil existente
    const existingProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: profileData.clerkUserId }
    });

    let result;
    if (existingProfile.length > 0) {
      // Actualizar perfil existente
      result = await strapi.entityService.update('api::user-profile.user-profile', existingProfile[0].id, {
        data: profileData
      });
    } else {
      // Crear nuevo perfil
      result = await strapi.entityService.create('api::user-profile.user-profile', {
        data: profileData
      });
    }

    return { data: result };
  },

  async getOffers(ctx) {
    const { userRole, userId } = ctx.query;

    let filters = {};
    if (userRole === 'client' && userId) {
      filters = { client: { clerkUserId: userId } };
    }

    const offers = await strapi.entityService.findMany('api::oferta.oferta', {
      filters,
      populate: '*'
    });

    return { data: offers };
  },

  async createOffer(ctx) {
    const offerData = ctx.request.body;
    const { clerkUserId } = ctx.query;

    if (!clerkUserId) {
      ctx.throw(400, 'clerkUserId es requerido');
    }

    // Buscar perfil del cliente
    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId }
    });

    if (userProfile.length === 0) {
      ctx.throw(404, 'Perfil de usuario no encontrado');
    }

    const result = await strapi.entityService.create('api::oferta.oferta', {
      data: {
        ...offerData,
        client: userProfile[0].id
      }
    });

    return { data: result };
  }
}; 