'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn('Merchants', 'doc_verify', {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 0
        });

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn('Merchants', 'doc_verify');

    }
};