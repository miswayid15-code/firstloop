'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('banners', {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      image: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },

      del_status: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }

    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.dropTable('banners');

  }
};