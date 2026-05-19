'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('branch_images', {

      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },

      image: {
        type: Sequelize.STRING
      },

      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1
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

  async down(queryInterface) {
    await queryInterface.dropTable('branch_images');
  }
};