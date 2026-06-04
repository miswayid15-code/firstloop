'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable('coupon_cat', {

            id: {
                type: Sequelize.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },

            name: {
                type: Sequelize.STRING,
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

        await queryInterface.bulkInsert('coupon_cat', [
            {
                name: 'Birthday',
                status: 1,
                del_status: 0,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                name: 'Festival',
                status: 1,
                del_status: 0,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                name: 'Others',
                status: 1,
                del_status: 0,
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);

        await queryInterface.addColumn(
            'coupons',
            'cat_id',
            {
                type: Sequelize.BIGINT,
                allowNull: true
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn(
            'coupons',
            'cat_id'
        );

        await queryInterface.dropTable(
            'coupon_cat'
        );

    }

};