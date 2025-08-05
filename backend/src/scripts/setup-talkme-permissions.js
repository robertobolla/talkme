module.exports = async ({ strapi }) => {
  console.log('🔧 Configurando permisos para TalkMe...');

  try {
    // Obtener todos los roles
    const roles = await strapi.query('plugin::users-permissions.role').findMany({
      populate: ['permissions']
    });

    // Configurar permisos para cada rol
    for (const role of roles) {
      console.log(`📝 Configurando permisos para rol: ${role.name}`);

      // Permisos para User Profile
      await strapi.query('plugin::users-permissions.role').update({
        where: { id: role.id },
        data: {
          permissions: {
            ...role.permissions,
            'api::user-profile.user-profile': {
              controllers: {
                'user-profile': {
                  find: { enabled: true, policy: '' },
                  findOne: { enabled: true, policy: '' },
                  create: { enabled: true, policy: '' },
                  update: { enabled: true, policy: '' },
                  delete: { enabled: true, policy: '' }
                }
              }
            },
            'api::session.session': {
              controllers: {
                'session': {
                  find: { enabled: true, policy: '' },
                  findOne: { enabled: true, policy: '' },
                  create: { enabled: true, policy: '' },
                  update: { enabled: true, policy: '' },
                  delete: { enabled: true, policy: '' },
                  confirm: { enabled: true, policy: '' },
                  start: { enabled: true, policy: '' },
                  complete: { enabled: true, policy: '' },
                  getUserSessions: { enabled: true, policy: '' },
                  getAvailableCompanions: { enabled: true, policy: '' }
                }
              }
            },
            'api::payment.payment': {
              controllers: {
                'payment': {
                  find: { enabled: true, policy: '' },
                  findOne: { enabled: true, policy: '' },
                  create: { enabled: true, policy: '' },
                  update: { enabled: true, policy: '' },
                  delete: { enabled: true, policy: '' },
                  deposit: { enabled: true, policy: '' },
                  withdraw: { enabled: true, policy: '' },
                  getUserPayments: { enabled: true, policy: '' },
                  getUserBalance: { enabled: true, policy: '' },
                  confirmTransaction: { enabled: true, policy: '' }
                }
              }
            }
          }
        }
      });
    }

    console.log('✅ Permisos configurados exitosamente');
  } catch (error) {
    console.error('❌ Error configurando permisos:', error);
  }
}; 