'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customer_stamp_levels', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      customer_card_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'customer_cards',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      // Stamp number
      stamp_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      // Amount required for this stamp
      amt: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      // Discount percentage
      discount: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Discount percentage',
      },

      // 1 = Free
      // 2 = Discount
      // 3 = Paid
      reward_type: {
        type: Sequelize.ENUM('1', '2', '3'),
        allowNull: false,
        defaultValue: '1',
      },

      // Free     -> NULL
      // Discount -> "10%", "20%", etc.
      // Paid     -> "Coffee", "Burger", "₹99 Coffee", etc.
      reward_text: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      icon: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      category_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
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
    await queryInterface.dropTable('customer_stamp_levels');
  },
};