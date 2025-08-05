import Stripe from 'stripe';

let stripe: Stripe | null = null;

const getStripe = () => {
    if (!stripe) {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is required');
        }
        stripe = new Stripe(secretKey, {
            apiVersion: '2025-07-30.basil',
        });
    }
    return stripe;
};

export default {
    async createPaymentIntent(ctx) {
        const { offerId } = ctx.request.body;
        const { user } = ctx.state;

        if (!user) {
            ctx.throw(401, 'No autorizado');
        }

        const offer = await strapi.entityService.findOne('api::oferta.oferta', offerId, {
            populate: ['client', 'professional']
        });

        if (!offer) {
            ctx.throw(404, 'Oferta no encontrada');
        }

        // Verificar que el usuario sea el cliente de la oferta
        const userProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
            filters: { clerkUserId: user.id }
        });

        if (userProfile.length === 0 || userProfile[0].id !== (offer as any).client?.id) {
            ctx.throw(403, 'Solo el cliente puede pagar por esta oferta');
        }

        if (offer.status !== 'accepted') {
            ctx.throw(400, 'La oferta debe estar aceptada para realizar el pago');
        }

        if (offer.paymentCompleted) {
            ctx.throw(400, 'El pago ya ha sido realizado');
        }

        // Calcular el monto basado en el profesional asignado
        let amount = 0;
        const offerData = offer as any;
        if (offerData.professional && offerData.professional.hourlyRate) {
            amount = Math.round(offerData.professional.hourlyRate * offer.duration * 100); // Stripe usa centavos
        } else {
            ctx.throw(400, 'No hay profesional asignado para calcular el pago');
        }

        try {
            const stripeInstance = getStripe();
            const paymentIntent = await stripeInstance.paymentIntents.create({
                amount,
                currency: 'eur',
                metadata: {
                    offerId: offer.id.toString(),
                    clientId: (offer as any).client.id.toString(),
                    professionalId: (offer as any).professional.id.toString()
                }
            });

            // Actualizar la oferta con el ID del PaymentIntent
            await strapi.entityService.update('api::oferta.oferta', offerId, {
                data: {
                    stripePaymentIntentId: paymentIntent.id
                }
            });

            return {
                clientSecret: paymentIntent.client_secret,
                amount,
                currency: 'eur'
            };
        } catch (error) {
            ctx.throw(500, 'Error al crear el pago');
        }
    },

    async handleWebhook(ctx) {
        const sig = ctx.request.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;

        try {
            const stripeInstance = getStripe();
            event = stripeInstance.webhooks.constructEvent(ctx.request.body, sig, endpointSecret);
        } catch (err) {
            ctx.throw(400, `Webhook Error: ${err.message}`);
        }

        // Manejar el evento
        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentSuccess(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await this.handlePaymentFailure(event.data.object);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        ctx.send({ received: true });
    },

    async handlePaymentSuccess(paymentIntent) {
        const { offerId } = paymentIntent.metadata;

        // Marcar la oferta como pagada
        await strapi.entityService.update('api::oferta.oferta', offerId, {
            data: {
                paymentCompleted: true,
                status: 'completed'
            }
        });

        // Obtener información de la oferta
        const offer = await strapi.entityService.findOne('api::oferta.oferta', offerId, {
            populate: ['client', 'professional']
        });

        // Actualizar horas trabajadas del profesional
        if ((offer as any).professional) {
            const currentHours = (offer as any).professional.totalHoursWorked || 0;
            await strapi.entityService.update('api::user-profile.user-profile', (offer as any).professional.id, {
                data: {
                    totalHoursWorked: currentHours + offer.duration
                }
            });
        }

        // Enviar notificaciones
        if ((offer as any).client) {
            await strapi.plugins['email'].services.email.send({
                to: (offer as any).client.email,
                subject: 'Pago confirmado',
                text: `Tu pago por la oferta "${offer.title}" ha sido confirmado.`,
                html: `<h1>Pago Confirmado</h1><p>Tu pago por la oferta <strong>"${offer.title}"</strong> ha sido confirmado.</p>`
            });
        }

        if ((offer as any).professional) {
            await strapi.plugins['email'].services.email.send({
                to: (offer as any).professional.email,
                subject: 'Pago recibido',
                text: `Has recibido el pago por la oferta "${offer.title}".`,
                html: `<h1>Pago Recibido</h1><p>Has recibido el pago por la oferta <strong>"${offer.title}"</strong>.</p>`
            });
        }
    },

    async handlePaymentFailure(paymentIntent) {
        const { offerId } = paymentIntent.metadata;

        // Marcar la oferta como fallida
        await strapi.entityService.update('api::oferta.oferta', offerId, {
            data: {
                status: 'published' // Volver a publicar la oferta
            }
        });

        // Obtener información de la oferta
        const offer = await strapi.entityService.findOne('api::oferta.oferta', offerId, {
            populate: ['client']
        });

        // Notificar al cliente
        if ((offer as any).client) {
            await strapi.plugins['email'].services.email.send({
                to: (offer as any).client.email,
                subject: 'Pago fallido',
                text: `El pago por la oferta "${offer.title}" ha fallado.`,
                html: `<h1>Pago Fallido</h1><p>El pago por la oferta <strong>"${offer.title}"</strong> ha fallado.</p>`
            });
        }
    }
}; 