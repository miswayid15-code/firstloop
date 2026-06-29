'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_notification_tokens', 'user_type', {
      type: Sequelize.STRING(250),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_notification_tokens', 'user_type');
  }
};