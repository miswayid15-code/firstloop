'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('branches', 'address_line_2', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'address', 
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('branches', 'address_line_2');
  }
};