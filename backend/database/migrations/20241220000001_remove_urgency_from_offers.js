'use strict';

/**
 * This is a database migration.
 */
module.exports = {
  async up(knex) {
    await knex.schema.alterTable('ofertas', (table) => {
      table.dropColumn('urgency');
    });
  },

  async down(knex) {
    await knex.schema.alterTable('ofertas', (table) => {
      table.enum('urgency', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    });
  },
}; 