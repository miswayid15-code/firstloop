'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customer_cards', 'qr_color', {
        type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
  
    await queryInterface.removeColumn('customer_cards', 'qr_color');
  },
};