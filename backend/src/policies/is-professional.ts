export default async (policyContext, config, { strapi }) => {
  const { user } = policyContext.state;
  
  if (!user) {
    return false;
  }
  
  const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
    filters: { clerkUserId: user.id }
  });
  
  if (userProfile.length === 0) {
    return false;
  }
  
  return userProfile[0].role === 'professional';
}; 