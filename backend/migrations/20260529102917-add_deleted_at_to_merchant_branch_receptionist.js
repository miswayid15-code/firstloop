'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {


        await queryInterface.addColumn(
            'branches',
            'deleted_at',
            {
                type: Sequelize.DATE,
                allowNull: true
            }
        );



    },

    async down(queryInterface, Sequelize) {



        await queryInterface.removeColumn(
            'branches',
            'deleted_at'
        );



    }
};