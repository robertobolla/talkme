import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::dashboard.dashboard', ({ strapi }) => ({
  async getDashboardData(ctx: any) {
    try {
      const { user } = ctx.state;

      if (!user) {
        return ctx.send({ error: 'Usuario no autenticado' }, 401);
      }

      // Buscar perfil del usuario
      const profile = await strapi.entityService.findOne('api::user-profile.user-profile', user.id);

      if (!profile) {
        return ctx.send({ error: 'Perfil no encontrado' }, 404);
      }

      let dashboardData;

      if (profile.role === 'user') {
        dashboardData = await this.getUserDashboard(profile);
      } else if (profile.role === 'companion') {
        dashboardData = await this.getCompanionDashboard(profile);
      } else {
        return ctx.send({ error: 'Rol no válido' }, 400);
      }

      // Agregar notificaciones
      const notifications = [];

      if (profile.role === 'user') {
        const pendingSessions = await strapi.entityService.findMany('api::session.session', {
          filters: {
            $or: [
              { user: { id: { $eq: profile.id } } },
              { companion: { id: { $eq: profile.id } } }
            ],
            status: 'pending'
          }
        });

        if (pendingSessions.length > 0) {
          notifications.push({
            type: 'info',
            message: `Tienes ${pendingSessions.length} sesión(es) pendiente(s) de confirmación`
          });
        }
      }

      return ctx.send({
        ...dashboardData,
        notifications,
        userRole: profile.role
      });

    } catch (error) {
      console.error('Error in getDashboardData:', error);
      return ctx.send({ error: 'Error interno del servidor' }, 500);
    }
  },

  async getUserDashboard(profile: any) {
    try {
      // Obtener sesiones del usuario
      const sessions = await strapi.entityService.findMany('api::session.session', {
        filters: { user: { id: { $eq: profile.id } } },
        sort: { startTime: 'desc' }
      });

      // Obtener pagos del usuario
      const payments = await strapi.entityService.findMany('api::payment.payment', {
        filters: { user: { id: { $eq: profile.id } } },
        sort: { createdAt: 'desc' }
      });

      // Calcular estadísticas
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter((s: any) => s.status === 'completed').length;
      const pendingSessions = sessions.filter((s: any) => s.status === 'pending').length;
      const balance = profile.balance || 0;

      // Calcular total gastado
      const totalSpent = payments
        .filter((p: any) => p.type === 'session_payment')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      return {
        stats: [
          {
            title: 'Saldo Disponible',
            value: `$${balance}`,
            icon: 'DollarSign',
            color: 'blue'
          },
          {
            title: 'Sesiones Activas',
            value: pendingSessions.toString(),
            icon: 'Calendar',
            color: 'purple'
          },
          {
            title: 'Sesiones Completadas',
            value: completedSessions.toString(),
            icon: 'Clock',
            color: 'orange'
          }
        ],
        recentSessions: sessions.slice(0, 5),
        totalSpent
      };
    } catch (error) {
      console.error('Error getting user dashboard:', error);
      throw error;
    }
  },

  async getCompanionDashboard(profile: any) {
    try {
      // Obtener sesiones del acompañante
      const sessions = await strapi.entityService.findMany('api::session.session', {
        filters: { companion: { id: { $eq: profile.id } } },
        sort: { startTime: 'desc' }
      });

      // Obtener pagos del acompañante
      const payments = await strapi.entityService.findMany('api::payment.payment', {
        filters: { user: { id: { $eq: profile.id } }, type: 'session_earning' },
        sort: { createdAt: 'desc' }
      });

      // Calcular estadísticas
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter((s: any) => s.status === 'completed').length;
      const pendingSessions = sessions.filter((s: any) => s.status === 'pending').length;
      const averageRating = profile.averageRating || 0;

      // Calcular ganancias totales
      const totalEarnings = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      return {
        stats: [
          {
            title: 'Ganancias Totales',
            value: `$${totalEarnings}`,
            icon: 'DollarSign',
            color: 'green'
          },
          {
            title: 'Sesiones Confirmadas',
            value: pendingSessions.toString(),
            icon: 'Calendar',
            color: 'purple'
          },
          {
            title: 'Calificación Promedio',
            value: `${averageRating}⭐`,
            icon: 'Star',
            color: 'yellow'
          }
        ],
        recentSessions: sessions.slice(0, 5),
        totalEarnings
      };
    } catch (error) {
      console.error('Error getting companion dashboard:', error);
      throw error;
    }
  }
})); 