'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn('Merchants', 'providerId', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null
        });

        await queryInterface.addColumn('Merchants', 'idToken', {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null
        });

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn('Merchants', 'providerId');

        await queryInterface.removeColumn('Merchants', 'idToken');

    }

};