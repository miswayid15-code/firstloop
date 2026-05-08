'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('merchant_fp', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      mer_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      otp: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      status: {
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

    await queryInterface.dropTable('merchant_fp');

  }

};