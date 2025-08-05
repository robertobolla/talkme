export default {
  async getSystemStatus(ctx) {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  },

  async getPublicStatus(ctx) {
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
      return ctx.send({ error: 'clerkUserId es requerido' }, 400);
    }

    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: clerkUserId }
    });

    return ctx.send({
      needsOnboarding: userProfile.length === 0,
      hasProfile: userProfile.length > 0,
      profile: userProfile.length > 0 ? userProfile[0] : null
    });
  },

  async selectRole(ctx) {
    try {
      console.log('selectRole called with body:', ctx.request.body);

      const { role, clerkUserId, fullName, email } = ctx.request.body;

      if (!clerkUserId) {
        return ctx.send({ error: 'clerkUserId es requerido' }, 400);
      }

      if (!role || !['user', 'companion'].includes(role)) {
        return ctx.send({ error: 'Rol inválido. Debe ser "user" o "companion"' }, 400);
      }

      // Verificar si ya existe un perfil
      const existingProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
        filters: { clerkUserId: clerkUserId }
      });

      if (existingProfile.length > 0) {
        return ctx.send({
          message: 'El usuario ya tiene un perfil creado',
          profile: existingProfile[0],
          nextStep: existingProfile[0].role === 'companion' ? 'complete-profile' : 'dashboard'
        });
      }

      // Usar la información del usuario enviada desde el frontend
      const userEmail = email || 'usuario@example.com';
      const userFullName = fullName || 'Usuario';

      console.log('Creando perfil con datos:', { clerkUserId, role, userFullName, userEmail });

      // Crear el perfil del usuario
      const profile = await strapi.entityService.create('api::user-profile.user-profile', {
        data: {
          clerkUserId,
          role,
          fullName: userFullName,
          email: userEmail,
          status: role === 'companion' ? 'approved' : 'pending',
          phone: '',
          address: '',
          bio: '',
          skills: role === 'companion' ? [] : [],
          hourlyRate: role === 'companion' ? 25 : 0,
          balance: role === 'user' ? 100 : 0,
          totalEarnings: 0,
          averageRating: 0,
          isOnline: role === 'companion' ? true : false,
          specialties: role === 'companion' ? ['Escucha activa', 'Acompañamiento emocional'] : [],
          languages: role === 'companion' ? ['Español'] : []
        }
      });

      console.log('Perfil creado exitosamente:', profile);

      return ctx.send({
        message: 'Rol seleccionado exitosamente',
        profile: profile,
        nextStep: role === 'companion' ? 'complete-profile' : 'dashboard'
      });
    } catch (error) {
      console.error('Error in selectRole:', error);
      return ctx.send({ error: 'Error interno del servidor: ' + error.message }, 500);
    }
  },

  async getProfileForm(ctx) {
    try {
      const { clerkUserId } = ctx.query;

      if (!clerkUserId) {
        return ctx.send({ error: 'clerkUserId es requerido' }, 400);
      }

      const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
        filters: { clerkUserId: clerkUserId }
      });

      if (userProfile.length === 0) {
        return ctx.send({ error: 'Perfil no encontrado' }, 404);
      }

      const profile = userProfile[0];

      // Definir campos según el rol
      const fields = {
        user: [
          { name: 'fullName', label: 'Nombre completo', type: 'text', required: true },
          { name: 'phone', label: 'Teléfono', type: 'tel', required: false },
          { name: 'address', label: 'Dirección', type: 'text', required: false },
          { name: 'bio', label: 'Biografía', type: 'textarea', required: false }
        ],
        companion: [
          { name: 'fullName', label: 'Nombre completo', type: 'text', required: true },
          { name: 'phone', label: 'Teléfono', type: 'tel', required: true },
          { name: 'address', label: 'Dirección', type: 'text', required: true },
          { name: 'bio', label: 'Biografía', type: 'textarea', required: true },
          { name: 'specialties', label: 'Especialidades', type: 'array', required: true },
          { name: 'languages', label: 'Idiomas', type: 'array', required: true },
          { name: 'availability', label: 'Disponibilidad', type: 'select', required: true },
          { name: 'hourlyRate', label: 'Tarifa por hora', type: 'number', required: true }
        ]
      };

      return ctx.send({
        profile: profile,
        fields: fields[profile.role] || fields.user,
        role: profile.role
      });
    } catch (error) {
      console.error('Error in getProfileForm:', error);
      return ctx.send({ error: 'Error interno del servidor' }, 500);
    }
  },

  async completeProfile(ctx) {
    try {
      const { clerkUserId, profileData } = ctx.request.body;

      if (!clerkUserId) {
        return ctx.send({ error: 'clerkUserId es requerido' }, 400);
      }

      const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
        filters: { clerkUserId: clerkUserId }
      });

      if (userProfile.length === 0) {
        return ctx.send({ error: 'Perfil no encontrado' }, 404);
      }

      const profile = userProfile[0];

      // Actualizar el perfil con los datos proporcionados
      const updatedProfile = await strapi.entityService.update('api::user-profile.user-profile', profile.id, {
        data: {
          ...profileData,
          status: profile.role === 'companion' ? 'approved' : 'approved'
        }
      });

      return ctx.send({
        message: 'Perfil completado exitosamente',
        profile: updatedProfile,
        nextStep: 'dashboard'
      });
    } catch (error) {
      console.error('Error in completeProfile:', error);
      return ctx.send({ error: 'Error interno del servidor' }, 500);
    }
  }
}; 