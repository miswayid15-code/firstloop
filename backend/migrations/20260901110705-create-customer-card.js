'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customer_cards', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // Original merchant card ID.
      // This is intentionally NOT a foreign key because
      // it can refer to either stamp_cards or membership_cards.
      merchant_card_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },

      customer_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      branch_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      card_type: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 1,
        comment: '1 = Stamp Card, 2 = Membership Card',
      },

      // ==================================================
      // CARD SNAPSHOT
      // ==================================================

      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      brand_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      brand_image: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },

      background_image: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },

      background_color: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },

      text_color: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },

      border_color: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },

      // ==================================================
      // STAMP CARD SNAPSHOT
      // ==================================================

      number_of_stamps: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      stamp_radius: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 50,
      },

      stamp_background: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      stamp_border_color: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },

      stamp_text_color: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },

      // ==================================================
      // MEMBERSHIP CARD SNAPSHOT
      // ==================================================

      month: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      // ==================================================
      // CUSTOMER CARD DETAILS
      // ==================================================

      card_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },

      qr_token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },

      current_stamp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      status: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 1,
      },
      is_completed: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0,
      },

      issued_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      expires_at: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('customer_cards');
  },
};