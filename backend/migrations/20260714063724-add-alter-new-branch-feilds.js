'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('branches', 'passlock', {
      type: Sequelize.STRING(20),
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('branches', 'country_iso', {
      type: Sequelize.STRING(2),
      allowNull: true,
      comment: 'ISO country code (e.g. IN, US, AE)'
    });

  },

  async down(queryInterface) {

    await queryInterface.removeColumn('branches', 'country_iso');

    await queryInterface.removeColumn('branches', 'passlock');

  }
};