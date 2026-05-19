'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.renameColumn(
            'coupons',
            'start_date',
            'start_time'
        );

        await queryInterface.renameColumn(
            'coupons',
            'end_date',
            'end_time'
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.renameColumn(
            'coupons',
            'start_time',
            'start_date'
        );

        await queryInterface.renameColumn(
            'coupons',
            'end_time',
            'end_date'
        );

    }

};