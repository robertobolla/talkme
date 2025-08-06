export default {
  routes: [
    {
      method: 'GET',
      path: '/sessions',
      handler: 'session.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/sessions/:id',
      handler: 'session.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/sessions',
      handler: 'session.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/sessions/:id',
      handler: 'session.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/sessions/:id',
      handler: 'session.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Rutas personalizadas
    {
      method: 'POST',
      path: '/sessions/:id/confirm',
      handler: 'session.confirm',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/sessions/:id/reject',
      handler: 'session.reject',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/sessions/:id/start',
      handler: 'session.start',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/sessions/:id/complete',
      handler: 'session.complete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/sessions/user/:userId',
      handler: 'session.getUserSessions',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/sessions/companions/available',
      handler: 'session.getAvailableCompanions',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/sessions/companion/:companionId/availability',
      handler: 'session.getCompanionAvailability',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
}; 