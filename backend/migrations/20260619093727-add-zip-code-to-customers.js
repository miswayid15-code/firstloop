'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn('customers', 'zip_code', {
            type: Sequelize.STRING(20),
            allowNull: true
        });

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn('customers', 'zip_code');

    }
};