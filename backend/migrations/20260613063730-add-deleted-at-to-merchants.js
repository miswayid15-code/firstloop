'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Merchants');

    if (!table.deleted_at) {
      await queryInterface.addColumn('Merchants', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('Merchants');

    if (table.deleted_at) {
      await queryInterface.removeColumn('Merchants', 'deleted_at');
    }
  }
};