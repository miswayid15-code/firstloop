'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('branches', 'pending_profile_image', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'profile_image'
    });

    await queryInterface.addColumn('branches', 'profile_image_status', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '0 = Pending, 1 = Approved, 2 = Rejected',
      after: 'pending_profile_image'
    });

    await queryInterface.addColumn('branches', 'rejected_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'profile_image_status'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('branches', 'rejected_reason');
    await queryInterface.removeColumn('branches', 'profile_image_status');
    await queryInterface.removeColumn('branches', 'pending_profile_image');
  }
};