import { factories } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'GET',
      path: '/user-profiles',
      handler: 'user-profile.find',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/user-profiles/:id',
      handler: 'user-profile.findOne',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'POST',
      path: '/user-profiles',
      handler: 'user-profile.create',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'PUT',
      path: '/user-profiles/:id',
      handler: 'user-profile.update',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'DELETE',
      path: '/user-profiles/:id',
      handler: 'user-profile.delete',
      config: {
        auth: false,
        policies: []
      }
    },
    {
      method: 'GET',
      path: '/user-profiles/:id/availability',
      handler: 'user-profile.getAvailability',
      config: {
        auth: false,
        policies: []
      }
    }
  ]
}; 