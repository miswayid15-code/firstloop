'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Merchants', 'profile_image', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Merchants', 'brand_image', {
      type: Sequelize.STRING
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Merchants', 'profile_image');
    await queryInterface.removeColumn('Merchants', 'brand_image');
  }
};