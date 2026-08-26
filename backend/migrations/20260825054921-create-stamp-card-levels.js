'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stamp_levels', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      merchant_card_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'stamp_cards',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      stamp_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },


      // 1 = Free
      // 2 = Discount
      // 3 = Paid
      reward_type: {
        type: Sequelize.ENUM('1', '2', '3'),
        allowNull: false,
        defaultValue: '1',
      },

      reward_text: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      amt: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      category_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addConstraint(
      'stamp_levels',
      {
        fields: ['merchant_card_id', 'stamp_number'],
        type: 'unique',
        name: 'merchant_card_stamp_levels_card_stamp_unique',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stamp_levels');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_merchant_card_stamp_levels_reward_type";'
    );
  },
};