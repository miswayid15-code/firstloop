'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('sale_person', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },

            name: {
                type: Sequelize.STRING,
                allowNull: false
            },

            phone: {
                type: Sequelize.STRING,
                allowNull: false
            },

            country_code: {
                type: Sequelize.STRING(10),
                allowNull: true
            },

            email: {
                type: Sequelize.STRING,
                allowNull: true,
                unique: true
            },

            code: {
                type: Sequelize.STRING(20),
                allowNull: false,
                unique: true
            },

            address: {
                type: Sequelize.TEXT,
                allowNull: true
            },

            city: {
                type: Sequelize.STRING,
                allowNull: true
            },

            state: {
                type: Sequelize.STRING,
                allowNull: true
            },

            country: {
                type: Sequelize.STRING,
                allowNull: true
            },

            gender: {
                type: Sequelize.INTEGER,
                allowNull: true
            },

            dob: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },

            lat: {
                type: Sequelize.DECIMAL(10, 8),
                allowNull: true
            },

            lon: {
                type: Sequelize.DECIMAL(11, 8),
                allowNull: true
            },

            password: {
                type: Sequelize.STRING,
                allowNull: false
            },

            status: {
                type: Sequelize.SMALLINT,
                allowNull: false,
                defaultValue: 1
            },

            del_status: {
                type: Sequelize.SMALLINT,
                allowNull: false,
                defaultValue: 0
            },

            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },

            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('sale_person');
    }
};