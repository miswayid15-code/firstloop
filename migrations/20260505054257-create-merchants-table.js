'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Merchants', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

      name: {
        type: Sequelize.STRING
      },

      email: {
        type: Sequelize.STRING,
        unique: true
      },

      phone: {
        type: Sequelize.STRING // store international format (+91...)
      },

      bus_name: {
        type: Sequelize.STRING
      },

      bus_cat: {
        type: Sequelize.STRING
      },

      gst_no: {
        type: Sequelize.STRING
      },

      address: {
        type: Sequelize.TEXT
      },

      city: {
        type: Sequelize.STRING
      },

      state: {
        type: Sequelize.STRING
      },

      zip_code: {
        type: Sequelize.STRING
      },

      country: {
        type: Sequelize.STRING
      },

      document: {
        type: Sequelize.STRING // file path
      },

      password: {
        type: Sequelize.STRING
      },

      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },

      del_status: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },

      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },

      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Merchants');
  }
};