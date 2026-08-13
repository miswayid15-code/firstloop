'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('MembershipCards', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },

            name: {
                type: Sequelize.STRING(255),
                allowNull: false
            },

            image: {
                type: Sequelize.STRING(500),
                allowNull: true
            },

            status: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
                comment: '1 = Active, 0 = Inactive'
            },

            del_status: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: '0 = Not Deleted, 1 = Deleted'
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

    async down(queryInterface) {
        await queryInterface.dropTable('MembershipCards');
    }
};