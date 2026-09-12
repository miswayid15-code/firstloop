'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('customer_stamp_levels', 'free_stamp', {
            type: Sequelize.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        });

        await queryInterface.addColumn('customer_stamp_levels', 'free_text', {
            type: Sequelize.STRING(255),
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn(
            'customer_stamp_levels',
            'free_text'
        );

        await queryInterface.removeColumn(
            'customer_stamp_levels',
            'free_stamp'
        );
    },
};