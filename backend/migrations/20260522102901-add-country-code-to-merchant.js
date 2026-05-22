'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn(
      'Merchants', // table name
      'country_code', // new column
      {
        type: Sequelize.STRING(10),
        allowNull: true,
        after: 'phone' // optional
      }
    );

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn(
      'Merchants',
      'country_code'
    );

  }
};