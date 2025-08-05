import { factories } from '@strapi/strapi';

export default {
    routes: [
        {
            method: 'GET',
            path: '/ofertas',
            handler: 'oferta.getAvailableOffers',
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
            method: 'GET',
            path: '/ofertas/professional/offers',
            handler: 'oferta.getProfessionalOffers',
            config: {
                auth: false,
                policies: []
            }
        }
    ]
}; 