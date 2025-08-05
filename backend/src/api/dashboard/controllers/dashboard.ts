export default {
  async getDashboard(ctx) {
    const { user } = ctx.state;

    if (!user) {
      ctx.throw(401, 'No autorizado');
    }

    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: user.id }
    });

    if (userProfile.length === 0) {
      ctx.throw(400, 'Debe completar su perfil primero');
    }

    const profile = userProfile[0];

    // Datos específicos según el rol
    if (profile.role === 'client') {
      return await this.getClientDashboard(ctx, profile);
    } else if (profile.role === 'professional') {
      return await this.getProfessionalDashboard(ctx, profile);
    } else {
      ctx.throw(400, 'Rol no válido');
    }
  },

  async getClientDashboard(ctx, profile) {
    // Obtener ofertas del cliente
    const offers = await strapi.entityService.findMany('api::oferta.oferta', {
      filters: { client: { id: { $eq: profile.id } } },
      populate: ['professional', 'applicants'],
      sort: { createdAt: 'desc' }
    });

    // Estadísticas del cliente
    const stats = {
      totalOffers: offers.length,
      activeOffers: offers.filter(o => o.status === 'published').length,
      completedOffers: offers.filter(o => o.status === 'completed').length,
      pendingOffers: offers.filter(o => o.status === 'accepted').length
    };

    // Ofertas recientes
    const recentOffers = offers.slice(0, 5);

    // Profesionales favoritos (con más trabajos completados)
    const favoriteProfessionals = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: {
        role: 'professional',
        status: 'approved'
      },
      populate: ['reviewsReceived'],
      sort: { averageRating: 'desc' },
      limit: 5
    });

    return {
      role: 'client',
      profile: profile,
      stats: stats,
      recentOffers: recentOffers,
      favoriteProfessionals: favoriteProfessionals,
      quickActions: [
        { name: 'Crear Oferta', action: 'create-offer', icon: 'plus' },
        { name: 'Ver Ofertas', action: 'view-offers', icon: 'list' },
        { name: 'Buscar Profesionales', action: 'search-professionals', icon: 'search' },
        { name: 'Mis Pagos', action: 'payments', icon: 'credit-card' }
      ]
    };
  },

  async getProfessionalDashboard(ctx, profile) {
    // Verificar si el perfil está aprobado
    if (profile.status !== 'approved') {
      return {
        role: 'professional',
        profile: profile,
        needsApproval: true,
        message: 'Tu perfil está pendiente de aprobación. Recibirás una notificación cuando sea aprobado.'
      };
    }

    // Ofertas donde se ha postulado
    const appliedOffers = await strapi.entityService.findMany('api::oferta.oferta', {
      filters: {
        applicants: { id: { $eq: profile.id } }
      },
      populate: ['client'],
      sort: { createdAt: 'desc' }
    });

    // Ofertas donde ha sido aceptado
    const acceptedOffers = await strapi.entityService.findMany('api::oferta.oferta', {
      filters: {
        professional: { id: { $eq: profile.id } }
      },
      populate: ['client', 'professional'],
      sort: { createdAt: 'desc' }
    });

    // Ofertas disponibles (donde no se ha postulado)
    const availableOffers = await strapi.entityService.findMany('api::oferta.oferta', {
      filters: {
        status: 'published',
        applicants: { id: { $not: { $eq: profile.id } } }
      },
      populate: ['client'],
      sort: { createdAt: 'desc' },
      limit: 10
    });

    // Reseñas recibidas
    const reviews = await strapi.entityService.findMany('api::review.review', {
      filters: { professional: profile.id },
      populate: ['client'],
      sort: { createdAt: 'desc' },
      limit: 5
    });

    // Estadísticas del profesional
    const stats = {
      totalApplications: appliedOffers.length,
      acceptedJobs: acceptedOffers.length,
      completedJobs: acceptedOffers.filter(o => o.status === 'completed').length,
      averageRating: profile.averageRating || 0,
      totalHours: profile.totalHoursWorked || 0,
      totalEarnings: acceptedOffers
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => {
          // Calcular ganancias basadas en el profesional asignado
          const offer = o as any;
          if (offer.professional && offer.professional.hourlyRate) {
            return sum + (offer.professional.hourlyRate * o.duration);
          }
          return sum;
        }, 0)
    };

    return {
      role: 'professional',
      profile: profile,
      stats: stats,
      appliedOffers: appliedOffers.slice(0, 5),
      acceptedOffers: acceptedOffers.slice(0, 5),
      availableOffers: availableOffers,
      recentReviews: reviews,
      quickActions: [
        { name: 'Buscar Ofertas', action: 'search-offers', icon: 'search' },
        { name: 'Mis Postulaciones', action: 'my-applications', icon: 'list' },
        { name: 'Mis Trabajos', action: 'my-jobs', icon: 'briefcase' },
        { name: 'Mi Perfil', action: 'edit-profile', icon: 'user' },
        { name: 'Mis Ganancias', action: 'earnings', icon: 'dollar-sign' }
      ]
    };
  },

  async getNotifications(ctx) {
    const { user } = ctx.state;

    if (!user) {
      ctx.throw(401, 'No autorizado');
    }

    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: user.id }
    });

    if (userProfile.length === 0) {
      ctx.throw(400, 'Debe completar su perfil primero');
    }

    const profile = userProfile[0];

    // Obtener notificaciones según el rol
    let notifications = [];

    if (profile.role === 'client') {
      // Notificaciones para clientes
      const offers = await strapi.entityService.findMany('api::oferta.oferta', {
        filters: { client: { id: { $eq: profile.id } } },
        populate: ['applicants'],
        sort: { createdAt: 'desc' }
      });

      notifications = offers
        .filter(o => (o as any).applicants && (o as any).applicants.length > 0)
        .map(o => ({
          id: o.id,
          type: 'new_application',
          title: 'Nueva postulación',
          message: `Has recibido ${(o as any).applicants.length} nueva(s) postulación(es) para tu oferta "${o.title}"`,
          date: o.createdAt,
          read: false
        }));
    } else if (profile.role === 'professional') {
      // Notificaciones para profesionales
      const acceptedOffers = await strapi.entityService.findMany('api::oferta.oferta', {
        filters: {
          professional: { id: { $eq: profile.id } },
          status: 'accepted'
        },
        populate: ['client'],
        sort: { createdAt: 'desc' }
      });

      notifications = acceptedOffers.map(o => ({
        id: o.id,
        type: 'job_accepted',
        title: 'Trabajo aceptado',
        message: `Has sido aceptado para el trabajo "${o.title}"`,
        date: o.createdAt,
        read: false
      }));
    }

    return {
      notifications: notifications,
      unreadCount: notifications.filter(n => !n.read).length
    };
  }
}; 