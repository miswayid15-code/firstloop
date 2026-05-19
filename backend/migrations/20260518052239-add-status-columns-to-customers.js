'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'status', {
      type: Sequelize.INTEGER,
      defaultValue: 1,
    });

    await queryInterface.addColumn('customers', 'del_status', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('customers', 'status');
    await queryInterface.removeColumn('customers', 'del_status');
  },
};