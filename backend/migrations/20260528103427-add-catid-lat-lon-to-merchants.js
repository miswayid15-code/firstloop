'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn(
            'Merchants',
            'cat_id',
            {
                type: Sequelize.INTEGER,
                allowNull: true
            }
        );

        await queryInterface.addColumn(
            'Merchants',
            'lat',
            {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: true
            }
        );

        await queryInterface.addColumn(
            'Merchants',
            'lon',
            {
                type: Sequelize.DECIMAL(10, 7),
                allowNull: true
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn(
            'Merchants',
            'cat_id'
        );

        await queryInterface.removeColumn(
            'Merchants',
            'lat'
        );

        await queryInterface.removeColumn(
            'Merchants',
            'lon'
        );

    }
};