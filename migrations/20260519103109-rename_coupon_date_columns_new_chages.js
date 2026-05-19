'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.changeColumn(
            'coupons',
            'start_time',
            {
                type: Sequelize.TIME,
                allowNull: true
            }
        );

        await queryInterface.changeColumn(
            'coupons',
            'end_time',
            {
                type: Sequelize.TIME,
                allowNull: true
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.changeColumn(
            'coupons',
            'start_time',
            {
                type: Sequelize.DATE
            }
        );

        await queryInterface.changeColumn(
            'coupons',
            'end_time',
            {
                type: Sequelize.DATE
            }
        );

    }

};