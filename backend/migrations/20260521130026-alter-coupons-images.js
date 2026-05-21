'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn(
            'coupons',
            'banner_image',
            {
                type: Sequelize.STRING,
                allowNull: true,
                after: 'branch_ids'
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn(
            'coupons',
            'banner_image'
        );

    }

};