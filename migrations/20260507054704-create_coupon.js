'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('coupons', {

      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },

      merchant_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      percentage: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },

      min_amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },

      usage_limit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      start_date: {
        type: Sequelize.DATE,
        allowNull: true
      },

      end_date: {
        type: Sequelize.DATE,
        allowNull: true
      },

      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },

      del_status: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }

    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.dropTable('coupons');

  }
};