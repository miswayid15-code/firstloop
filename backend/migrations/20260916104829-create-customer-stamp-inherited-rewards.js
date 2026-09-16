'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customer_stamp_inherited_rewards', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      customer_card_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      source_stamp_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      target_stamp_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      inherited_from: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: false,
        defaultValue: [],
      },

      free_stamp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0 = No, 1 = Yes',
      },

      free_text: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        // 0 = Available
        // 1 = Used

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
    await queryInterface.dropTable('customer_stamp_inherited_rewards');
  },
};