'use strict';

/**
 * This is a database migration.
 */

module.exports = {
  /**
   * Run the migrations
   */
  async up(knex) {
    // Verificar si la columna ya existe
    const hasColumn = await knex.schema.hasColumn('ofertas', 'payment_completed');
    
    if (!hasColumn) {
      await knex.schema.table('ofertas', (table) => {
        table.boolean('payment_completed').defaultTo(false).notNullable();
      });
    }
  },

  /**
   * Revert the migrations
   */
  async down(knex) {
    await knex.schema.table('ofertas', (table) => {
      table.dropColumn('payment_completed');
    });
  },
}; 