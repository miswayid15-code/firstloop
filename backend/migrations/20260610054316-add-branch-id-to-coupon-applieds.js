'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('coupon_applieds', 'branch_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'coupon_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('coupon_applieds', 'branch_id');
  }
};