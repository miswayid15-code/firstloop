// migrations/20260525000000-create-admins.js

'use strict';

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable('admins', {

            id: {

                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false

            },

            name: {

                type: Sequelize.STRING,
                allowNull: false

            },

            username: {

                type: Sequelize.STRING,
                allowNull: false,
                unique: true

            },

            email: {

                type: Sequelize.STRING,
                allowNull: true

            },

            phone: {

                type: Sequelize.STRING,
                allowNull: true

            },

            password: {

                type: Sequelize.STRING,
                allowNull: false

            },

            role: {

                type: Sequelize.STRING,
                defaultValue: 'admin'

            },

            image: {

                type: Sequelize.STRING,
                allowNull: true

            },

            last_login: {

                type: Sequelize.DATE,
                allowNull: true

            },

            status: {

                type: Sequelize.SMALLINT,
                defaultValue: 1
                // 1 = Active
                // 0 = Inactive

            },

            del_status: {

                type: Sequelize.SMALLINT,
                defaultValue: 0
                // 0 = Not Deleted
                // 1 = Deleted

            },

            createdAt: {

                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')

            },

            updatedAt: {

                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')

            }

        });

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.dropTable('admins');

    }

};