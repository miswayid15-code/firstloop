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
        CustomerCard.belongsTo(models.Stampcard, {
            foreignKey: 'merchant_card_id',
            as: 'Stampcard',
        });
        CustomerCard.belongsTo(models.MembershipCards, {
            foreignKey: 'merchant_card_id',
            as: 'MembershipCards',
        });

        CustomerCard.belongsTo(models.Customer, {
            foreignKey: 'customer_id',
            as: 'Customer',
        });
        CustomerCard.belongsTo(models.Branch, {
            foreignKey: 'branch_id',
            as: 'Branch',
        });
    };

    return CustomerCard;
};