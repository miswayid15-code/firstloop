'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('appointments', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      cus_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      br_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      br_name: {
        type: Sequelize.STRING,
        allowNull: true
      },

      appointment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },

      slot: {
        type: Sequelize.STRING,
        allowNull: false
      },

      status: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },

      cancel_by: {
        type: Sequelize.STRING,
        allowNull: true
      },

      cancel_reason: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.dropTable('appointments');

  }

};