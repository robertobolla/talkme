export default async (policyContext, config, { strapi }) => {
    const { user } = policyContext.state;
    const { id } = policyContext.params;

    if (!user) {
        return false;
    }

    // Obtener el perfil del usuario autenticado
    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
        filters: { clerkUserId: user.id }
    });

    if (userProfile.length === 0) {
        return false;
    }

    const profile = userProfile[0];

    // Los usuarios pueden editar su propio perfil
    if (profile.id.toString() === id) {
        return true;
    }

    // Los administradores pueden editar todos los perfiles
    if (profile.role === 'admin') {
        return true;
    }

    return false;
}; 