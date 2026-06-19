'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn('customers', 'country', {
            type: Sequelize.STRING,
            allowNull: true,
            after: 'state' // MySQL only, ignored by PostgreSQL
        });

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn('customers', 'country');

    }
};