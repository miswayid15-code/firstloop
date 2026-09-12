'use strict';

module.exports = (sequelize, DataTypes) => {
    const Stampcard = sequelize.define(
        'Stampcard',
        {
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },

            merchant_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },

            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },

            brand_name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },

            brand_image: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },

            number_of_stamps: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },

            background_image: {
                type: DataTypes.STRING(500),
                allowNull: true,
            },

            background_color: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },

            text_color: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },

            border_color: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },

            stamp_radius: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 50,
            },

            stamp_background: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            stamp_border_color: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },

            stamp_text_color: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            branch_ids: {
                type: DataTypes.ARRAY(DataTypes.BIGINT),
                allowNull: true,
                defaultValue: [],
            },
            month: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            status: {
                type: DataTypes.SMALLINT,
                allowNull: false,
                defaultValue: 1,
            },
        },
        {
            tableName: 'stamp_cards',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    Stampcard.associate = (models) => {

        Stampcard.belongsTo(models.Merchant, {
            foreignKey: 'merchant_id',
            as: 'Merchant',
        });

        Stampcard.hasMany(models.StampLevel, {
            foreignKey: 'merchant_card_id',
            as: 'StampLevels',
            onDelete: 'CASCADE',
        });

        Stampcard.hasMany(models.CustomerCard, {
            foreignKey: 'merchant_card_id',
            as: 'CustomerCards',
            onDelete: 'CASCADE',
        });
    };
    return Stampcard;
};