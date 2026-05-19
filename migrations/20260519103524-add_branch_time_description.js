'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn(
            'branches',
            'open_time',
            {
                type: Sequelize.TIME,
                allowNull: true
            }
        );

        await queryInterface.addColumn(
            'branches',
            'close_time',
            {
                type: Sequelize.TIME,
                allowNull: true
            }
        );

        await queryInterface.addColumn(
            'branches',
            'description',
            {
                type: Sequelize.TEXT,
                allowNull: true
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn(
            'branches',
            'open_time'
        );

        await queryInterface.removeColumn(
            'branches',
            'close_time'
        );

        await queryInterface.removeColumn(
            'branches',
            'description'
        );

    }

};