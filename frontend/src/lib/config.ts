// Configuración del sistema
export const config = {
    // Strapi Configuration
    STRAPI_URL: process.env.STRAPI_URL || 'http://localhost:1337',
    STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN || 'your_strapi_api_token_here',

    // Clerk Configuration
    CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_c2luY2VyZS1jYXQtNjQuY2xlcmsuYWNjb3VudHMuZGV2JA',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'sk_test_FrPNWbLWC5wo6hQsUPsKYj5H0ICrXxP2ABLEuNLs4Z',

    // Next.js Configuration
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3001',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your_nextauth_secret_here',
};

// Función para verificar si la configuración es válida
export const isConfigValid = () => {
    return config.STRAPI_API_TOKEN !== 'your_strapi_api_token_here';
};

// Función para obtener la configuración de Strapi
export const getStrapiConfig = () => {
    if (!isConfigValid()) {
        console.warn('⚠️ STRAPI_API_TOKEN no está configurado. Usa el valor real de Strapi.');
    }

    return {
        url: config.STRAPI_URL,
        token: config.STRAPI_API_TOKEN,
    };
}; 