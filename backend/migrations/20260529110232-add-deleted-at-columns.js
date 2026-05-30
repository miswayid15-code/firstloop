'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn(
      'receptionists',
      'deleted_at',
      {
        type: Sequelize.DATE,
        allowNull: true
      }
    );

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn(
      'receptionists',
      'deleted_at'
    );

  }
};