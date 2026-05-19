'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.changeColumn('coupons', 'branch_id', {
      type: Sequelize.STRING,
      allowNull: true
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.changeColumn('coupons', 'branch_id', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
      defaultValue: []
    });

  }

};