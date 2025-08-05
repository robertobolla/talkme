export default (config, { strapi }) => {
  return async (ctx, next) => {
    const { user } = ctx.state;
    
    if (!user) {
      return next();
    }
    
    // Verificar si el usuario ya tiene un perfil
    const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
      filters: { clerkUserId: user.id }
    });
    
    // Si no tiene perfil, agregar información de onboarding al contexto
    if (userProfile.length === 0) {
      ctx.state.needsOnboarding = true;
      ctx.state.userId = user.id;
    } else {
      ctx.state.userProfile = userProfile[0];
      ctx.state.needsOnboarding = false;
    }
    
    return next();
  };
}; 