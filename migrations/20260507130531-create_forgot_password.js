'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.changeColumn('merchant_fps', 'status', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '0 = Pending, 1 = Complete, 2 = Rejected'
        });

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.changeColumn('merchant_fps', 'status', {
            type: Sequelize.INTEGER,
            allowNull: true
        });

    }

};