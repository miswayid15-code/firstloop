'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('customerotpverify', {
            id: {
                type: Sequelize.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
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
        await queryInterface.dropTable('customerotpverify');
    }
};