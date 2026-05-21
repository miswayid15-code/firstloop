'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.removeColumn(
            'coupons',
            'branch_ids'
        );

        await queryInterface.addColumn(
            'coupons',
            'branch_ids',
            {
                type: Sequelize.ARRAY(Sequelize.INTEGER),
                allowNull: true
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn(
            'coupons',
            'branch_ids'
        );

        await queryInterface.addColumn(
            'coupons',
            'branch_ids',
            {
                type: Sequelize.STRING,
                allowNull: true
            }
        );

    }

};