'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.changeColumn('coupons', 'start_date', {
      type: Sequelize.TIME,
      allowNull: true
    });

    await queryInterface.changeColumn('coupons', 'end_date', {
      type: Sequelize.TIME,
      allowNull: true
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.changeColumn('coupons', 'start_date', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn('coupons', 'end_date', {
      type: Sequelize.STRING,
      allowNull: true
    });

  }

};