'use strict';

module.exports = (sequelize, DataTypes) => {

    const CustomerStampLevel = sequelize.define(
        'CustomerStampLevel',
        {
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },

            customer_card_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },

            stamp_number: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            amt: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },

            discount: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0,
                comment: 'Discount percentage',
            },

            reward_type: {
                type: DataTypes.ENUM('1', '2', '3'),
                allowNull: false,
                defaultValue: '1',
            },

            reward_text: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            icon: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            category_id: {
                type: DataTypes.BIGINT,
                allowNull: true,
            },

            status: {
                type: DataTypes.SMALLINT,
                allowNull: false,
                defaultValue: 1,
            },
        },
        {
            tableName: 'customer_stamp_levels',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    CustomerStampLevel.associate = (models) => {

        CustomerStampLevel.belongsTo(models.CustomerCard, {
            foreignKey: 'customer_card_id',
            as: 'CustomerCard',
        });

        CustomerStampLevel.belongsTo(models.Category, {
            foreignKey: 'category_id',
            as: 'Category',
        });
    };

    return CustomerStampLevel;
};