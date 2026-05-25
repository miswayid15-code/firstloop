// models/admins.js

'use strict';

module.exports = (sequelize, DataTypes) => {

    const admins = sequelize.define('admins', {

        id: {

            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true

        },

        name: {

            type: DataTypes.STRING,
            allowNull: false

        },

        username: {

            type: DataTypes.STRING,
            allowNull: false,
            unique: true

        },

        email: {

            type: DataTypes.STRING,
            allowNull: true

        },

        phone: {

            type: DataTypes.STRING,
            allowNull: true

        },

        password: {

            type: DataTypes.STRING,
            allowNull: false

        },

        role: {

            type: DataTypes.STRING,
            defaultValue: 'admin'

        },

        image: {

            type: DataTypes.STRING,
            allowNull: true

        },

        last_login: {

            type: DataTypes.DATE,
            allowNull: true

        },

        status: {

            type: DataTypes.SMALLINT,
            defaultValue: 1

        },

        del_status: {

            type: DataTypes.SMALLINT,
            defaultValue: 0

        }

    }, {

        tableName: 'admins',

        timestamps: true

    });

    return admins;

};