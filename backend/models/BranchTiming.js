'use strict';

module.exports = (sequelize, DataTypes) => {

    const BranchTiming = sequelize.define('BranchTiming', {

        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        branch_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        // 1 = Monday
        // 2 = Tuesday
        // 3 = Wednesday
        // 4 = Thursday
        // 5 = Friday
        // 6 = Saturday
        // 7 = Sunday
        day: {
            type: DataTypes.SMALLINT,
            allowNull: false
        },

        open_time: {
            type: DataTypes.TIME,
            allowNull: true
        },

        close_time: {
            type: DataTypes.TIME,
            allowNull: true
        },

        is_closed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }

    }, {

        tableName: 'branch_timings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'

    });

    BranchTiming.associate = (models) => {

        BranchTiming.belongsTo(models.Branch, {
            foreignKey: 'branch_id',
            as: 'branch'
        });

    };

    return BranchTiming;

};