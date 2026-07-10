'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('menu_images', 'pending_image', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('menu_images', 'image_status', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '0 = Pending, 1 = Approved, 2 = Rejected'
    });

    await queryInterface.addColumn('menu_images', 'rejected_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });

  },

  async down(queryInterface) {

    await queryInterface.removeColumn('menu_images', 'rejected_reason');
    await queryInterface.removeColumn('menu_images', 'image_status');
    await queryInterface.removeColumn('menu_images', 'pending_image');

  }
};