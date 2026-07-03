'use strict';

module.exports = (sequelize, DataTypes) => {
    const AppSetting = sequelize.define(
        'AppSetting',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            app_status: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true, // true = ON, false = OFF
            },
        },
        {
            tableName: 'app_settings',
            timestamps: true,
            underscored: true,
        }
    );

    return AppSetting;
};