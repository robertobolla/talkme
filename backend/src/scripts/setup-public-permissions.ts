import type { Strapi } from '@strapi/strapi';

// Configura permisos públicos para varios content-types en desarrollo
export default async function setupPublicPermissions({ strapi }: { strapi: Strapi }) {
	console.log('🔧 Configurando permisos públicos...');

	try {
		// Obtener el rol público
		const publicRole = await (strapi as any).query('plugin::users-permissions.role').findOne({
			where: { type: 'public' },
		});

		if (!publicRole) {
			console.log('❌ No se encontró el rol público');
			return;
		}

		console.log('📋 Rol público encontrado:', publicRole.type);

		// Construir permisos deseados
		const permissions = {
			'api::user-profile.user-profile': {
				controllers: {
					'api::user-profile.user-profile': {
						find: { enabled: true, policy: '' },
						findOne: { enabled: true, policy: '' },
						create: { enabled: true, policy: '' },
						update: { enabled: true, policy: '' },
						delete: { enabled: true, policy: '' },
					},
				},
			},
			'api::oferta.oferta': {
				controllers: {
					'api::oferta.oferta': {
						find: { enabled: true, policy: '' },
						findOne: { enabled: true, policy: '' },
						create: { enabled: true, policy: '' },
						update: { enabled: true, policy: '' },
						delete: { enabled: true, policy: '' },
					},
				},
			},
			'api::review.review': {
				controllers: {
					'api::review.review': {
						find: { enabled: true, policy: '' },
						findOne: { enabled: true, policy: '' },
						create: { enabled: true, policy: '' },
						update: { enabled: true, policy: '' },
						delete: { enabled: true, policy: '' },
					},
				},
			},
			'api::session.session': {
				controllers: {
					'api::session.session': {
						find: { enabled: true, policy: '' },
						findOne: { enabled: true, policy: '' },
						create: { enabled: true, policy: '' },
						update: { enabled: true, policy: '' },
						delete: { enabled: true, policy: '' },
						confirm: { enabled: true, policy: '' },
						reject: { enabled: true, policy: '' },
						getCompanionAvailability: { enabled: true, policy: '' },
						getAvailableCompanions: { enabled: true, policy: '' },
						getUserSessions: { enabled: true, policy: '' },
					},
				},
			},
			'api::availability-slot.availability-slot': {
				controllers: {
					'api::availability-slot.availability-slot': {
						find: { enabled: true, policy: '' },
						findOne: { enabled: true, policy: '' },
						create: { enabled: true, policy: '' },
						update: { enabled: true, policy: '' },
						delete: { enabled: true, policy: '' },
					},
				},
			},
			'api::payment.payment': {
				controllers: {
					'api::payment.payment': {
						find: { enabled: true, policy: '' },
						findOne: { enabled: true, policy: '' },
						create: { enabled: true, policy: '' },
						update: { enabled: true, policy: '' },
						delete: { enabled: true, policy: '' },
					},
				},
			},
			'api::simple-notification.simple-notification': {
				controllers: {
					'api::simple-notification.simple-notification': {
						find: { enabled: true, policy: '' },
						findOne: { enabled: true, policy: '' },
						create: { enabled: true, policy: '' },
						update: { enabled: true, policy: '' },
						delete: { enabled: true, policy: '' },
					},
				},
			},
		} as Record<string, any>;

		// Aplicar permisos
		const updatedRole = await (strapi as any).query('plugin::users-permissions.role').update({
			where: { type: 'public' },
			data: { permissions },
		});

		console.log('✅ Permisos públicos configurados correctamente');
		console.log('📋 Rol actualizado:', updatedRole.type);

		// Verificar que los permisos se aplicaron
		const verifyRole = await (strapi as any).query('plugin::users-permissions.role').findOne({
			where: { type: 'public' },
		});

		console.log('🔍 Verificando permisos...');
		console.log('📊 Permisos configurados:', Object.keys(verifyRole.permissions || {}));
	} catch (error: any) {
		console.error('❌ Error configurando permisos:', error?.message || error);
		if (error?.stack) {
			console.error('📋 Stack trace:', error.stack);
		}
	}
}