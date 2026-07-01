'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('appointments', 'ref_id', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'id' // Optional (works only in MySQL, ignored in PostgreSQL)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('appointments', 'ref_id');
  }
};