import { factories } from '@strapi/strapi';

export default {
    routes: [
        {
            method: 'GET',
            path: '/ofertas',
            handler: 'oferta.find',
            config: {
                auth: false,
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/ofertas/:id',
            handler: 'oferta.findOne',
            config: {
                auth: false,
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/ofertas',
            handler: 'oferta.create',
            config: {
                auth: false,
                policies: []
            }
        },
        {
            method: 'PUT',
            path: '/ofertas/:id',
            handler: 'oferta.update',
            config: {
                auth: false,
                policies: []
            }
        },
        {
            method: 'DELETE',
            path: '/ofertas/:id',
            handler: 'oferta.delete',
            config: {
                auth: false,
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/ofertas/:id/apply',
            handler: 'oferta.apply',
            config: {
                auth: false,
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/ofertas/:id/cancel-application',
            handler: 'oferta.cancelApplication',
            config: {
                auth: false,
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/ofertas/:id/accept-professional',
            handler: 'oferta.acceptProfessional',
            config: {
                auth: false,
                policies: []
            }
        },
        {
            method: 'POST',
            path: '/ofertas/:id/cancel',
            handler: 'oferta.cancel',
            config: {
                auth: false,
                policies: []
            }
        }
    ]
}; 