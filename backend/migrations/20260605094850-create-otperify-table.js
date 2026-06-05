'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('otperify', {
            id: {
                type: Sequelize.BIGINT,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },

            mail: {
                type: Sequelize.STRING,
                allowNull: false
            },

            otp: {
                type: Sequelize.STRING,
                allowNull: false
            },

            status: {
                type: Sequelize.SMALLINT,
                allowNull: false,
                defaultValue: 1
            },

            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },

            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('otperify');
    }
};