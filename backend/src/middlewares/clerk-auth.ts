import { verifyToken } from '@clerk/backend';

export default (config, { strapi }) => {
    return async (ctx, next) => {
        const authHeader = ctx.request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            ctx.state.user = null;
            return next();
        }

        const token = authHeader.substring(7);

        try {
            const payload = await verifyToken(token, {
                jwtKey: process.env.CLERK_JWT_KEY,
                audience: process.env.CLERK_AUDIENCE
            });

            ctx.state.user = {
                id: payload.sub,
                email: payload.email,
                firstName: payload.first_name,
                lastName: payload.last_name,
                emailAddresses: payload.email_addresses || [],
                role: (payload as any).public_metadata?.role || null
            };
        } catch (error) {
            console.error('Error verifying token:', error);
            ctx.state.user = null;
        }

        await next();
    };
}; 