'use strict';

module.exports = (sequelize, DataTypes) => {
    const StampLevel = sequelize.define(
        'StampLevel',
        {
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },

            merchant_card_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },

            stamp_number: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            amt: {
                type: DataTypes.DECIMAL(10,2),
                allowNull: false,
            },
            // 1 = Free
            // 2 = Discount
            // 3 = Paid
            reward_type: {
                type: DataTypes.ENUM('1', '2', '3'),
                allowNull: false,
                defaultValue: '1',
            },

            // Free     -> NULL
            // Discount -> "10%", "20%", etc.
            // Paid     -> "Coffee", "Burger", "₹99 Coffee", etc.
            reward_text: {
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
            tableName: 'stamp_levels',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    StampLevel.associate = (models) => {
        StampLevel.belongsTo(models.Stampcard, {
            foreignKey: 'merchant_card_id',
            as: 'Stampcard',
        });

        StampLevel.belongsTo(models.Category, {
            foreignKey: 'category_id',
            as: 'Category',
        });
    };

    return StampLevel;
};