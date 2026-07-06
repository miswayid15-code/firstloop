'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Remove unique constraint
        await queryInterface.changeColumn('coupons', 'code', {
            type: Sequelize.STRING,
            allowNull: false,
            unique: false
        });
    },

    async down(queryInterface, Sequelize) {
        // Restore unique constraint
        await queryInterface.changeColumn('coupons', 'code', {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        });
    }
};