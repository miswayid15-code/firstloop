'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('branches', {

      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

      name: {
        type: Sequelize.STRING
      },

      email: {
        type: Sequelize.STRING
      },

      phone: {
        type: Sequelize.STRING
      },

      lat: {
        type: Sequelize.STRING
      },

      lon: {
        type: Sequelize.STRING
      },

      address: {
        type: Sequelize.TEXT
      },

      merchant_id: {
        type: Sequelize.BIGINT,
        allowNull: false
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
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }

    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('branches');
  }
};