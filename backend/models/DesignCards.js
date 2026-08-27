'use strict';

module.exports = (sequelize, DataTypes) => {
    const DesignCards = sequelize.define(
        'DesignCards',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },

            name: {
                type: DataTypes.STRING(255),
                allowNull: false
            },

            image: {
                type: DataTypes.STRING(500),
                allowNull: true
            },

            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            },

            del_status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            }
        },
        {
            tableName: 'DesignCards',
            timestamps: true
        }
    );

    return DesignCards;
};