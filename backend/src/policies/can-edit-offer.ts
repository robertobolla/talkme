export default async (policyContext, config, { strapi }) => {
  const { user } = policyContext.state;
  const { id } = policyContext.params;
  
  if (!user) {
    return false;
  }
  
  // Obtener el perfil del usuario
  const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
    filters: { clerkUserId: user.id }
  });
  
  if (userProfile.length === 0) {
    return false;
  }
  
  const profile = userProfile[0];
  
  // Obtener la oferta
  const offer = await strapi.entityService.findOne('api::oferta.oferta', id, {
    populate: ['client']
  });
  
  if (!offer) {
    return false;
  }
  
  // Solo el cliente que creó la oferta puede editarla
  if (offer.client?.id === profile.id) {
    return true;
  }
  
  // Los administradores pueden editar todas las ofertas
  if (profile.role === 'admin') {
    return true;
  }
  
  return false;
}; 