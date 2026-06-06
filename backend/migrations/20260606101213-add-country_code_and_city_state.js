'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('customers', 'country_code', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'country'
    });

    await queryInterface.addColumn('customers', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'country_code'
    });

    await queryInterface.addColumn('customers', 'state', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'city'
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn('customers', 'country_code');
    await queryInterface.removeColumn('customers', 'city');
    await queryInterface.removeColumn('customers', 'state');

  }
};