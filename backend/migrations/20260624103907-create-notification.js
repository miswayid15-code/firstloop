"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_notification_tokens", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      token: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      platform: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "unknown",
      },

      device_name: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Unknown",
      },

      app_version: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "1.0.0",
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("user_notification_tokens");
  },
};