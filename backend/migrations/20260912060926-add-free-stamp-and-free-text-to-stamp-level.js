'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('stamp_levels', 'free_stamp', {
            type: Sequelize.SMALLINT,
            allowNull: false,
            defaultValue: 0
        });

        await queryInterface.addColumn('stamp_levels', 'free_text', {
            type: Sequelize.STRING(255),
            allowNull: true,
            defaultValue: null
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('stamp_levels', 'free_text');
        await queryInterface.removeColumn('stamp_levels', 'free_stamp');
    }
};