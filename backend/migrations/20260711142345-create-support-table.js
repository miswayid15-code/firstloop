'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('support', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      // 1 = Merchant, 2 = Receptionist, 3 = Customer
      type: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '1=Merchant, 2=Receptionist, 3=Customer',
      },

      // 1 = Website, 2 = App
      submit_type: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '1=Website, 2=App',
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // 0 = Pending, 1 = Resolved
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '0=Pending, 1=Resolved ,3 =reject',
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
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('support');
  },
};