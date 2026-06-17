'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {

        await queryInterface.createTable('pages', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },

            page_type: {
                type: Sequelize.STRING(50),
                allowNull: false
            },

            title: {
                type: Sequelize.STRING(255),
                allowNull: false
            },

            content: {
                type: Sequelize.TEXT('long'),
                allowNull: false
            },

            status: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },

            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },

            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable('pages');
    }
};