export default {
  async getSystemStatus(ctx) {
    // Endpoint público para verificar el estado del sistema
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'connected',
        email: 'configured',
        auth: 'ready'
      }
    };
  },

  async getPublicStatus(ctx) {
    // Endpoint público simple para health check
    return {
      status: 'ok',
      message: 'Backend funcionando correctamente',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  },

  async getOnboardingStatus(ctx) {
    const { clerkUserId } = ctx.query;

    if (!clerkUserId) {
      ctx.throw(400, 'clerkUserId es requerido');
    }

    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: clerkUserId }
    });

    return {
      needsOnboarding: userProfile.length === 0,
      hasProfile: userProfile.length > 0,
      profile: userProfile.length > 0 ? userProfile[0] : null
    };
  },

  async selectRole(ctx) {
    const { role, clerkUserId, fullName, email } = ctx.request.body;

    if (!clerkUserId) {
      ctx.throw(400, 'clerkUserId es requerido');
    }

    if (!role || !['client', 'professional'].includes(role)) {
      ctx.throw(400, 'Rol inválido. Debe ser "client" o "professional"');
    }

    // Verificar si ya existe un perfil
    const existingProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: clerkUserId }
    });

    if (existingProfile.length > 0) {
      // Si ya existe un perfil, devolverlo en lugar de lanzar error
      return {
        message: 'El usuario ya tiene un perfil creado',
        profile: existingProfile[0],
        nextStep: existingProfile[0].role === 'professional' ? 'complete-profile' : 'dashboard'
      };
    }

    // Usar la información del usuario enviada desde el frontend
    const userEmail = email || 'usuario@example.com';
    const userFullName = fullName || 'Usuario';

    console.log('Información del usuario procesada:', { userEmail, userFullName });

    // Crear el perfil del usuario
    const profile = await strapi.entityService.create('api::user-profile.user-profile', {
      data: {
        clerkUserId: clerkUserId,
        role: role,
        fullName: userFullName,
        email: userEmail,
        status: role === 'professional' ? 'pending' : 'approved',
        phone: '',
        address: '',
        bio: '',
        skills: role === 'professional' ? [] : [],
        hourlyRate: role === 'professional' ? 0 : 0
      }
    });

    return {
      message: 'Rol seleccionado exitosamente',
      profile: profile,
      nextStep: role === 'professional' ? 'complete-profile' : 'dashboard'
    };
  },

  async getProfileForm(ctx) {
    const { clerkUserId } = ctx.query;

    if (!clerkUserId) {
      ctx.throw(400, 'clerkUserId es requerido');
    }

    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: clerkUserId }
    });

    if (userProfile.length === 0) {
      ctx.throw(404, 'Perfil no encontrado');
    }

    const profile = userProfile[0];

    // Definir campos según el rol
    const fields = {
      client: [
        { name: 'fullName', label: 'Nombre completo', type: 'text', required: true },
        { name: 'phone', label: 'Teléfono', type: 'tel', required: false },
        { name: 'address', label: 'Dirección', type: 'text', required: true },
        { name: 'bio', label: 'Biografía', type: 'textarea', required: false }
      ],
      professional: [
        { name: 'fullName', label: 'Nombre completo', type: 'text', required: true },
        { name: 'phone', label: 'Teléfono', type: 'tel', required: true },
        { name: 'address', label: 'Dirección', type: 'text', required: true },
        { name: 'bio', label: 'Biografía', type: 'textarea', required: true },
        { name: 'skills', label: 'Habilidades', type: 'array', required: true },
        { name: 'certifications', label: 'Certificaciones', type: 'array', required: false },
        { name: 'availability', label: 'Disponibilidad', type: 'select', required: true },
        { name: 'hourlyRate', label: 'Tarifa por hora', type: 'number', required: true }
      ]
    };

    return {
      profile: profile,
      fields: fields[profile.role] || fields.client,
      role: profile.role
    };
  },

  async completeProfile(ctx) {
    const { clerkUserId, ...profileData } = ctx.request.body;

    if (!clerkUserId) {
      ctx.throw(400, 'clerkUserId es requerido');
    }

    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: clerkUserId }
    });

    if (userProfile.length === 0) {
      ctx.throw(404, 'Perfil no encontrado');
    }

    const profile = userProfile[0];

    // Actualizar el perfil
    const updatedProfile = await strapi.entityService.update('api::user-profile.user-profile', profile.id, {
      data: {
        ...profileData,
        status: 'approved'
      }
    });

    return {
      message: 'Perfil completado exitosamente',
      profile: updatedProfile
    };
  }
}; 