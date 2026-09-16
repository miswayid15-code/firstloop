'use strict';

module.exports = (sequelize, DataTypes) => {
    const CustomerStampInheritedReward = sequelize.define(
        'CustomerStampInheritedReward',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },

            customer_card_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'customer_cards',
                    key: 'id',
                },
            },

            source_stamp_number: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            target_stamp_number: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            inherited_from: {
                type: DataTypes.ARRAY(DataTypes.INTEGER),
                allowNull: false,
                defaultValue: [],
            },

            free_stamp: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            free_text: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },

            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'customer_stamp_inherited_rewards',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    CustomerStampInheritedReward.associate = (models) => {

        // Customer Card
        CustomerStampInheritedReward.belongsTo(models.CustomerCard, {
            foreignKey: 'customer_card_id',
            as: 'CustomerCard',
        });

        // Target Stamp Level
        CustomerStampInheritedReward.belongsTo(models.CustomerStampLevel, {
            foreignKey: 'target_stamp_number',
            targetKey: 'stamp_number',
            as: 'TargetStampLevel',
        });
    };

    return CustomerStampInheritedReward;
};