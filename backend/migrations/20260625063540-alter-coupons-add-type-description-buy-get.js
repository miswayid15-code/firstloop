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
    const table = await queryInterface.describeTable('coupons');

    if (table.get_item) {
      await queryInterface.removeColumn('coupons', 'get_item');
    }

    if (table.buy_item) {
      await queryInterface.removeColumn('coupons', 'buy_item');
    }

    if (table.type) {
      await queryInterface.removeColumn('coupons', 'type');
    }

    if (table.description) {
      await queryInterface.removeColumn('coupons', 'description');
    }
  }
};