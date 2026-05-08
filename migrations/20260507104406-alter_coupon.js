'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('coupons', 'branch_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'merchant_id'
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn('coupons', 'branch_id');

  }

};