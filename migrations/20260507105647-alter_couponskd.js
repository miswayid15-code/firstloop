'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.removeColumn('coupons', 'branch_id');

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.addColumn('coupons', 'branch_id', {
      type: Sequelize.STRING,
      allowNull: true
    });

  }

};