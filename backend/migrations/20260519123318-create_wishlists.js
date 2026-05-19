'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            'wishlists',
            {

                id: {
                    type: Sequelize.BIGINT,
                    autoIncrement: true,
                    primaryKey: true
                },

                customer_id: {
                    type: Sequelize.BIGINT,
                    allowNull: false
                },

                branch_id: {
                    type: Sequelize.BIGINT,
                    allowNull: false
                },

                status: {
                    type: Sequelize.INTEGER,
                    defaultValue: 1
                },

                del_status: {
                    type: Sequelize.INTEGER,
                    defaultValue: 0
                },

                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue:
                        Sequelize.literal(
                            'CURRENT_TIMESTAMP'
                        )
                },

                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue:
                        Sequelize.literal(
                            'CURRENT_TIMESTAMP'
                        )
                }

            }
        );

    },

    async down(queryInterface) {

        await queryInterface.dropTable(
            'wishlists'
        );

    }

};