'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn(
            'coupon_applieds',
            'approved_by',
            {
                type: Sequelize.STRING,
                allowNull: true
            }
        );

        await queryInterface.addColumn(
            'coupon_applieds',
            'approved_by_id',
            {
                type: Sequelize.BIGINT,
                allowNull: true
            }
        );

        await queryInterface.addColumn(
            'coupon_applieds',
            'cancel_by',
            {
                type: Sequelize.STRING,
                allowNull: true
            }
        );

        await queryInterface.addColumn(
            'coupon_applieds',
            'cancel_reason',
            {
                type: Sequelize.TEXT,
                allowNull: true
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn(
            'coupon_applieds',
            'approved_by'
        );

        await queryInterface.removeColumn(
            'coupon_applieds',
            'approved_by_id'
        );

        await queryInterface.removeColumn(
            'coupon_applieds',
            'cancel_by'
        );

        await queryInterface.removeColumn(
            'coupon_applieds',
            'cancel_reason'
        );

    }

};