export default {
  routes: [
    {
      method: 'GET',
      path: '/reviews',
      handler: 'review.find',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/reviews/:id',
      handler: 'review.findOne',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'POST',
      path: '/reviews',
      handler: 'review.create',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'PUT',
      path: '/reviews/:id',
      handler: 'review.update',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'DELETE',
      path: '/reviews/:id',
      handler: 'review.delete',
      config: {
        auth: false,
        policies: []
      }
    }
  ]
}; 