'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            'coupon_applieds',
            {

                id: {
                    type: Sequelize.BIGINT,
                    autoIncrement: true,
                    primaryKey: true
                },

                cus_id: {
                    type: Sequelize.BIGINT,
                    allowNull: false
                },

                coupon_id: {
                    type: Sequelize.BIGINT,
                    allowNull: false
                },

                coupon_code: {
                    type: Sequelize.STRING,
                    allowNull: true
                },

                percentage: {
                    type: Sequelize.FLOAT,
                    defaultValue: 0
                },

                status: {
                    type: Sequelize.INTEGER,
                    defaultValue: 1
                },

                del_status: {
                    type: Sequelize.INTEGER,
                    defaultValue: 0
                },

                used_at: {
                    type: Sequelize.DATE,
                    allowNull: true
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

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable(
            'coupon_applieds'
        );

    }

};