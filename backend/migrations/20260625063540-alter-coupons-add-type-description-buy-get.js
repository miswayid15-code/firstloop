'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('coupons', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('coupons', 'type', {
      type: Sequelize.SMALLINT,
      allowNull: false,
      defaultValue: 1,
      comment: '1=Discount, 2=Fixed, 3=Buy X Get Y',
    });

    await queryInterface.addColumn('coupons', 'buy_item', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('coupons', 'get_item', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('coupons', 'get_item');
    await queryInterface.removeColumn('coupons', 'buy_item');
    await queryInterface.removeColumn('coupons', 'type');
    await queryInterface.removeColumn('coupons', 'description');
  }
};