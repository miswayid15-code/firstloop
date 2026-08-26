'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stamp_cards', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
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

      number_of_stamps: {
        type: Sequelize.INTEGER,
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
      branch_ids: {
        type: Sequelize.ARRAY(Sequelize.BIGINT),
        allowNull: true,
        defaultValue: [],
      },
      status: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 1,
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
    await queryInterface.dropTable('stamp_cards');



    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_merchant_cards_stamp_shape";'
    );
  },
};