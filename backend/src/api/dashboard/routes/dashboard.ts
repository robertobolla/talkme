export default {
  routes: [
    {
      method: 'GET',
      path: '/dashboard',
      handler: 'dashboard.getDashboardData',
      config: {
        policies: ['global::is-authenticated']
      }
    }
  ]
}; 