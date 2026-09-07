'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('stamp_levels', 'discount', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Discount percentage for this stamp level'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('stamp_levels', 'discount');
  }
};