'use strict';

/**
 * This is a database migration.
 */

module.exports = {
  async up(knex) {
    // Eliminar la columna hourlyRate de la tabla ofertas
    await knex.schema.alterTable('ofertas', (table) => {
      table.dropColumn('hourly_rate');
    });
  },

  async down(knex) {
    // Recrear la columna hourlyRate en caso de rollback
    await knex.schema.alterTable('ofertas', (table) => {
      table.decimal('hourly_rate', 10, 2);
    });
  },
}; 