'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('appointments', 'created_by', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'customer',
      comment: 'merchant, receptionist, customer'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('appointments', 'created_by');
  }
};