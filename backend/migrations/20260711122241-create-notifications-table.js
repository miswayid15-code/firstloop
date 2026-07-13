'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Notifications', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },

            user_type: {
                type: Sequelize.ENUM('customer', 'merchant', 'receptionist', 'admin'),
                allowNull: false,
            },

            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },

            title: {
                type: Sequelize.STRING,
                allowNull: false,
            },

            body: {
                type: Sequelize.TEXT,
                allowNull: false,
            },

            type: {
                type: Sequelize.STRING,
                allowNull: true,
            },

            reference_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },

            data: {
                type: Sequelize.JSONB,
                allowNull: true,
            },

            is_read: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        await queryInterface.addIndex('Notifications', ['user_type', 'user_id']);
        await queryInterface.addIndex('Notifications', ['is_read']);
        await queryInterface.addIndex('Notifications', ['createdAt']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Notifications');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Notifications_user_type";');
    },
};