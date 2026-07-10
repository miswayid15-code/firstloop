'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('branch_images', 'pending_image', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('branch_images', 'image_status', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '0 = Pending, 1 = Approved, 2 = Rejected'
    });

    await queryInterface.addColumn('branch_images', 'rejected_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('branch_images', 'rejected_reason');
    await queryInterface.removeColumn('branch_images', 'image_status');
    await queryInterface.removeColumn('branch_images', 'pending_image');
  }
};