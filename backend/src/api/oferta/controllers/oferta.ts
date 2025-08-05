import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::oferta.oferta', ({ strapi }) => ({
  async find(ctx) {
    const { user } = ctx.state;
    const { query } = ctx;

    // Filtros públicos - solo aplicar filtro de status si no se especifica otro
    const filters = {
      ...(query.filters as any)
    };

    // Solo aplicar filtro de status 'published' si no hay filtros específicos de status
    if (!(query.filters as any)?.status) {
      filters.status = 'published';
    }

    // Si es un cliente, mostrar solo sus ofertas
    if (user && user.role === 'client') {
      const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
        filters: { clerkUserId: user.id }
      });

      if (userProfile.length > 0) {
        filters.client = userProfile[0].id;
      }
    }

    // Si es un profesional, mostrar ofertas donde se ha postulado
    if (user && user.role === 'professional') {
      const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
        filters: { clerkUserId: user.id }
      });

      if (userProfile.length > 0) {
        filters.applicants = userProfile[0].id;
      }
    }

    const result = await strapi.entityService.findPage('api::oferta.oferta', {
      filters,
      populate: ['client', 'professional', 'applicants'],
      ...query
    });

    return result;
  },

  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.entityService.findOne('api::oferta.oferta', id, {
      populate: ['client', 'professional', 'applicants']
    });

    if (!entity) {
      ctx.throw(404, 'Oferta no encontrada');
    }

    // Devolver todos los datos de la oferta
    return { data: entity };
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body;

    // Verificar que la oferta existe
    const existingOffer = await strapi.entityService.findOne('api::oferta.oferta', id);
    if (!existingOffer) {
      ctx.throw(404, 'Oferta no encontrada');
    }

    // Actualizar la oferta
    const result = await strapi.entityService.update('api::oferta.oferta', id, {
      data: data
    });

    return { data: result };
  },

  async create(ctx) {
    // Obtener clerkUserId del body de la request
    const requestBody = ctx.request.body.data || ctx.request.body;
    const { clerkUserId, ...offerData } = requestBody;

    if (!clerkUserId) {
      ctx.throw(400, 'clerkUserId es requerido');
    }

    // Buscar el perfil del usuario por clerkUserId
    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: clerkUserId }
    });

    if (userProfile.length === 0) {
      ctx.throw(400, 'Debes crear un perfil primero');
    }

    const profile = userProfile[0];
    if (profile.role !== 'client') {
      ctx.throw(403, 'Solo clientes pueden crear ofertas');
    }

    // Crear la oferta con los datos limpios (sin clerkUserId)
    const result = await strapi.entityService.create('api::oferta.oferta', {
      data: {
        ...offerData,
        client: profile.id,
        status: 'published'
      }
    });

    return { data: result };
  },

  async apply(ctx) {
    const { id } = ctx.params;
    const { clerkUserId } = ctx.request.body;

    if (!clerkUserId) {
      ctx.throw(400, 'clerkUserId es requerido');
    }

    // Buscar el perfil del usuario por clerkUserId
    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: clerkUserId }
    });

    if (userProfile.length === 0) {
      ctx.throw(400, 'Debes crear un perfil primero');
    }

    const profile = userProfile[0];
    if (profile.role !== 'professional') {
      ctx.throw(403, 'Solo profesionales pueden postularse');
    }

    if (profile.status !== 'approved') {
      ctx.throw(403, 'Tu perfil debe estar aprobado para postularte');
    }

    const offer = await strapi.entityService.findOne('api::oferta.oferta', id);
    if (!offer) {
      ctx.throw(404, 'Oferta no encontrada');
    }

    if (offer.status !== 'published') {
      ctx.throw(400, 'Esta oferta ya no está disponible');
    }

    // Verificar si las postulaciones están abiertas (2 horas antes de la cita)
    const offerDate = new Date(offer.dateTime);
    const now = new Date();
    const twoHoursBefore = new Date(offerDate.getTime() - (2 * 60 * 60 * 1000)); // 2 horas antes

    if (now >= twoHoursBefore) {
      ctx.throw(400, 'Las postulaciones para esta oferta ya están cerradas (se cierran 2 horas antes de la cita)');
    }

    // Verificar si ya se postuló
    const existingApplication = await strapi.entityService.findMany('api::oferta.oferta', {
      filters: {
        id: offer.id,
        applicants: { id: { $eq: profile.id } }
      }
    });

    if (existingApplication.length > 0) {
      ctx.throw(400, 'Ya te has postulado a esta oferta');
    }

    // Agregar postulación
    await strapi.entityService.update('api::oferta.oferta', id, {
      data: {
        applicants: {
          connect: [profile.id]
        }
      } as any
    });

    // Enviar notificación al cliente (comentado por ahora)
    // if ((offer as any).client) {
    //   await strapi.plugins['email'].services.email.send({
    //     to: (offer as any).client.email,
    //     subject: 'Nueva postulación a tu oferta',
    //     text: `Has recibido una nueva postulación para tu oferta: ${offer.title}`,
    //     html: `<h1>Nueva Postulación</h1><p>Has recibido una nueva postulación para tu oferta: <strong>${offer.title}</strong></p>`
    //   });
    // }

    return { message: 'Postulación enviada exitosamente' };
  },

  async acceptProfessional(ctx) {
    const { id } = ctx.params;
    const { professionalId, clerkUserId } = ctx.request.body;

    if (!clerkUserId) {
      ctx.throw(400, 'clerkUserId es requerido');
    }

    if (!professionalId) {
      ctx.throw(400, 'professionalId es requerido');
    }

    // Buscar el perfil del cliente por clerkUserId
    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: clerkUserId }
    });

    if (userProfile.length === 0) {
      ctx.throw(400, 'Debes crear un perfil primero');
    }

    const profile = userProfile[0];
    if (profile.role !== 'client') {
      ctx.throw(403, 'Solo clientes pueden aceptar profesionales');
    }

    const offer = await strapi.entityService.findOne('api::oferta.oferta', id, {
      populate: ['client', 'applicants']
    });

    if (!offer) {
      ctx.throw(404, 'Oferta no encontrada');
    }

    if ((offer as any).client?.id !== profile.id) {
      ctx.throw(403, 'Solo puedes aceptar profesionales en tus propias ofertas');
    }

    if (offer.status !== 'published') {
      ctx.throw(400, 'Esta oferta ya no está disponible');
    }

    // Verificar que el profesional se haya postulado
    const isApplicant = (offer as any).applicants?.some((applicant: any) => applicant.id === parseInt(professionalId));
    if (!isApplicant) {
      ctx.throw(400, 'Este profesional no se ha postulado a esta oferta');
    }

    // Aceptar al profesional
    await strapi.entityService.update('api::oferta.oferta', id, {
      data: {
        professional: professionalId,
        status: 'accepted'
      }
    });

    // Enviar notificación al profesional (comentado por ahora)
    // const professional = await strapi.entityService.findOne('api::user-profile.user-profile', professionalId);
    // if (professional) {
    //   await strapi.plugins['email'].services.email.send({
    //     to: professional.email,
    //     subject: 'Has sido aceptado para un trabajo',
    //     text: `Has sido aceptado para la oferta: ${offer.title}`,
    //     html: `<h1>¡Trabajo Aceptado!</h1><p>Has sido aceptado para la oferta: <strong>${offer.title}</strong></p>`
    //   });
    // }

    return { message: 'Profesional aceptado exitosamente' };
  },

  async cancel(ctx) {
    const { id } = ctx.params;
    const { clerkUserId } = ctx.request.body;

    if (!clerkUserId) {
      ctx.throw(400, 'clerkUserId es requerido');
    }

    // Buscar el perfil del usuario por clerkUserId
    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: clerkUserId }
    });

    if (userProfile.length === 0) {
      ctx.throw(400, 'Debes crear un perfil primero');
    }

    const profile = userProfile[0];

    const offer = await strapi.entityService.findOne('api::oferta.oferta', id, {
      populate: ['client', 'professional']
    });

    if (!offer) {
      ctx.throw(404, 'Oferta no encontrada');
    }

    // Solo el cliente puede cancelar su oferta
    if ((offer as any).client?.id !== profile.id && profile.role !== 'admin') {
      ctx.throw(403, 'Solo puedes cancelar tus propias ofertas');
    }

    if (offer.status === 'cancelled') {
      ctx.throw(400, 'Esta oferta ya está cancelada');
    }

    await strapi.entityService.update('api::oferta.oferta', id, {
      data: { status: 'cancelled' }
    });

    // Notificar al profesional si ya fue aceptado
    if ((offer as any).professional) {
      await strapi.plugins['email'].services.email.send({
        to: (offer as any).professional.email,
        subject: 'Oferta cancelada',
        text: `La oferta "${offer.title}" ha sido cancelada`,
        html: `<h1>Oferta Cancelada</h1><p>La oferta <strong>"${offer.title}"</strong> ha sido cancelada.</p>`
      });
    }

    return { message: 'Oferta cancelada exitosamente' };
  },

  async cancelApplication(ctx) {
    const { id } = ctx.params;
    const { clerkUserId } = ctx.request.body;

    if (!clerkUserId) {
      ctx.throw(400, 'clerkUserId es requerido');
    }

    // Buscar el perfil del usuario por clerkUserId
    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: clerkUserId }
    });

    if (userProfile.length === 0) {
      ctx.throw(400, 'Debes crear un perfil primero');
    }

    const profile = userProfile[0];
    if (profile.role !== 'professional') {
      ctx.throw(403, 'Solo profesionales pueden cancelar postulaciones');
    }

    const offer = await strapi.entityService.findOne('api::oferta.oferta', id, {
      populate: ['applicants']
    });

    if (!offer) {
      ctx.throw(404, 'Oferta no encontrada');
    }

    // Verificar si se postuló
    const isApplicant = (offer as any).applicants?.some((applicant: any) => applicant.id === profile.id);
    if (!isApplicant) {
      ctx.throw(400, 'No te has postulado a esta oferta');
    }

    // Remover postulación
    await strapi.entityService.update('api::oferta.oferta', id, {
      data: {
        applicants: {
          disconnect: [profile.id]
        }
      } as any
    });

    return { message: 'Postulación cancelada exitosamente' };
  }
})); 