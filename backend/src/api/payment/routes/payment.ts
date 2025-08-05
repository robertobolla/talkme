export default {
    routes: [
        {
            method: 'POST',
            path: '/payments/create-payment-intent',
            handler: 'payment.createPaymentIntent',
            config: {
                policies: ['global::is-authenticated']
            }
        },
        {
            method: 'POST',
            path: '/payments/webhook',
            handler: 'payment.handleWebhook',
            config: {
                auth: false
            }
        }
    ]
}; 