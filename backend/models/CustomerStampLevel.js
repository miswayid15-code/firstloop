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
                defaultValue: 0,
            },

            discount: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0,
                comment: 'Discount percentage',
            },

            // 1 = Free
            // 2 = Discount
            // 3 = Paid
            reward_type: {
                type: DataTypes.ENUM('1', '2', '3'),
                allowNull: false,
                defaultValue: '1',
            },

            // Amount customer needs to pay
            paid_amt: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
                comment: 'Paid reward amount',
            },

            // 1 = Cash
            // 2 = Online
            payment_type: {
                type: DataTypes.ENUM('1', '2'),
                allowNull: true,
                comment: '1 = Cash, 2 = Online',
            },
            paid_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            reward_text: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            free_stamp: {
                type: DataTypes.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '0',
            },
            free_text: {
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

            role: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            role_id: {
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