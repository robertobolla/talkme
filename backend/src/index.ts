import type { Strapi } from '@strapi/strapi';
import setupPublicPermissions from './scripts/setup-public-permissions';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Strapi }) {
    // Configurar permisos públicos para desarrollo
    console.log('🔧 Configurando permisos públicos para desarrollo...');

    try {
      await setupPublicPermissions({ strapi });
      console.log('✅ Permisos públicos configurados exitosamente');
    } catch (error) {
      console.error('❌ Error configurando permisos públicos:', error);
    }

    // Nota: En producción, esto debería configurarse manualmente en el admin
    // o usar un script de migración más robusto
  },
};
