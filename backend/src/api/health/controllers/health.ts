export default {
    async getHealth(ctx) {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            services: {
                database: 'connected',
                email: 'configured',
                auth: 'ready'
            }
        };
    }
}; 