'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn('receptionists', 'merchant_id', {
            type: Sequelize.BIGINT,
            allowNull: true,

            references: {
                model: 'Merchants',
                key: 'id'
            },

            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn('receptionists', 'merchant_id');

    }

};