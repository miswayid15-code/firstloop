'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('branches', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'address' // Optional (MySQL only)
    });

    await queryInterface.addColumn('branches', 'state', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'city' // Optional (MySQL only)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('branches', 'city');
    await queryInterface.removeColumn('branches', 'state');
  }
};