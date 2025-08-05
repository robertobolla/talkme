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
    populate: ['client', 'professional', 'applicants']
  });
  
  if (!offer) {
    return false;
  }
  
  // El cliente puede acceder a su propia oferta
  if (offer.client?.id === profile.id) {
    return true;
  }
  
  // El profesional elegido puede acceder a la oferta
  if (offer.professional?.id === profile.id) {
    return true;
  }
  
  // Los postulantes pueden acceder a la oferta
  const isApplicant = offer.applicants?.some(applicant => applicant.id === profile.id);
  if (isApplicant) {
    return true;
  }
  
  // Los administradores pueden acceder a todas las ofertas
  if (profile.role === 'admin') {
    return true;
  }
  
  return false;
}; 