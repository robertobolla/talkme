export default (policyContext, config, { strapi }) => {
  const { user } = policyContext.state;
  return !!user;
}; 