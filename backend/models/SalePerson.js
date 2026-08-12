'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SalePerson extends Model {
        static associate(models) {
            // Define associations here
        }
    }

    SalePerson.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },

            phone: {
                type: DataTypes.STRING,
                allowNull: false
            },

            country_code: {
                type: DataTypes.STRING,
                allowNull: true
            },

            email: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true
            },

            code: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false
            },

            address: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            city: {
                type: DataTypes.STRING,
                allowNull: true
            },

            state: {
                type: DataTypes.STRING,
                allowNull: true
            },

            country: {
                type: DataTypes.STRING,
                allowNull: true
            },

            gender: {
                type: DataTypes.INTEGER,
                defaultValue: 1,
                comment: '1 = Male, 2 = Female, 3 = Other'
            },

            dob: {
                type: DataTypes.DATEONLY,
                allowNull: true
            },

            lat: {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: true
            },

            lon: {
                type: DataTypes.DECIMAL(11, 8),
                allowNull: true
            },

            status: {
                type: DataTypes.INTEGER,
                defaultValue: 1
            },

            del_status: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            }
        },
        {
            sequelize,
            modelName: 'SalePerson',
            tableName: 'sale_person',
            timestamps: true
        }
    );

    SalePerson.associate = (models) => {
        // Add associations here if required
    };

    return SalePerson;
};