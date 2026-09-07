'use strict';

module.exports = (sequelize, DataTypes) => {
    const MembershipCards = sequelize.define(
        'MembershipCards',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },

            merchant_id: {
                type: DataTypes.BIGINT,
                allowNull: false
            },

            title: {
                type: DataTypes.STRING,
                allowNull: false
            },

            brand_name: {
                type: DataTypes.STRING,
                allowNull: true
            },

            branch_ids: {
                type: DataTypes.JSON,
                allowNull: true
            },

            background_image: {
                type: DataTypes.STRING,
                allowNull: true
            },

            background_color: {
                type: DataTypes.STRING,
                allowNull: true
            },

            text_color: {
                type: DataTypes.STRING,
                allowNull: true
            },

            border_color: {
                type: DataTypes.STRING,
                allowNull: true
            },

            month: {
                type: DataTypes.INTEGER,
                allowNull: true
            }
        },
        {
            tableName: 'membership_cards',
            timestamps: true,
            underscored: true
        }
    );

    return MembershipCards;
};