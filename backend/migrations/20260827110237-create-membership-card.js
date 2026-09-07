'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('membership_cards', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      merchant_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Merchants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      brand_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      branch_ids: {
        type: Sequelize.JSONB,
        allowNull: true,
      },

      background_image: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      background_color: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      text_color: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      border_color: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      month: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('membership_cards');
  },
};