'use strict';

module.exports = (sequelize, DataTypes) => {
    const CustomerCard = sequelize.define(
        'CustomerCard',
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

            customer_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },

            branch_id: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },

            // 1 = Stamp Card
            // 2 = Membership Card
            card_type: {
                type: DataTypes.SMALLINT,
                allowNull: false,
                defaultValue: 1,
            },

            // ==================================================
            // CARD SNAPSHOT
            // ==================================================

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

            // ==================================================
            // STAMP CARD SNAPSHOT
            // ==================================================

            number_of_stamps: {
                type: DataTypes.INTEGER,
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

            // ==================================================
            // MEMBERSHIP CARD SNAPSHOT
            // ==================================================

            month: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },

            // ==================================================
            // CUSTOMER CARD DETAILS
            // ==================================================

            card_number: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },

            qr_token: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },

            current_stamp: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            status: {
                type: DataTypes.SMALLINT,
                allowNull: false,
                defaultValue: 1,
            },

            issued_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },

            expires_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: 'customer_cards',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    CustomerCard.associate = (models) => {

        // ==================================================
        // CUSTOMER
        // ==================================================

        CustomerCard.belongsTo(models.Customer, {
            foreignKey: 'customer_id',
            as: 'Customer',
        });

        // ==================================================
        // BRANCH
        // ==================================================

        CustomerCard.belongsTo(models.Branch, {
            foreignKey: 'branch_id',
            as: 'Branch',
        });

        // ==================================================
        // CUSTOMER STAMP LEVELS
        // ==================================================

        CustomerCard.hasMany(models.CustomerStampLevel, {
            foreignKey: 'customer_card_id',
            as: 'CustomerStampLevels',
            onDelete: 'CASCADE',
        });
    };

    return CustomerCard;
};