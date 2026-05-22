'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn(
      'appointments',
      'approved_by',
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      'appointments',
      'approved_by_id',
      {
        type: Sequelize.INTEGER,
        allowNull: true
      }
    );

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn(
      'appointments',
      'approved_by'
    );

    await queryInterface.removeColumn(
      'appointments',
      'approved_by_id'
    );

  }

};