export default {
    routes: [
        {
            method: 'GET',
            path: '/public/user-profile',
            handler: 'public.getUserProfile',
            config: {
                auth: false,
                policies: [],
                middlewares: []
            }
        },
        {
            method: 'POST',
            path: '/public/user-profile',
            handler: 'public.saveUserProfile',
            config: {
                auth: false,
                policies: [],
                middlewares: []
            }
        },
        {
            method: 'GET',
            path: '/public/offers',
            handler: 'public.getOffers',
            config: {
                auth: false,
                policies: [],
                middlewares: []
            }
        },
        {
            method: 'POST',
            path: '/public/offers',
            handler: 'public.createOffer',
            config: {
                auth: false,
                policies: [],
                middlewares: []
            }
        }
    ]
}; 