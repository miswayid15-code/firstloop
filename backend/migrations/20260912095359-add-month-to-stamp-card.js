'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('stamp_cards', 'month', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });

        await queryInterface.addColumn('stamp_cards', 'qr_color', {
            type: Sequelize.STRING(255),
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('stamp_cards');

        if (table.month) {
            await queryInterface.removeColumn('stamp_cards', 'month');
        }

        if (table.qr_color) {
            await queryInterface.removeColumn('stamp_cards', 'qr_color');
        }
    },
};