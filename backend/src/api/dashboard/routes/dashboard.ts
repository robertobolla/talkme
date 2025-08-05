export default {
  routes: [
    {
      method: 'GET',
      path: '/dashboard',
      handler: 'dashboard.getDashboard',
      config: {
        policies: ['global::is-authenticated']
      }
    },
    {
      method: 'GET',
      path: '/dashboard/notifications',
      handler: 'dashboard.getNotifications',
      config: {
        policies: ['global::is-authenticated']
      }
    }
  ]
}; 