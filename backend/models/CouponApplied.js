module.exports = (sequelize, DataTypes) => {

    const CouponApplied =
        sequelize.define(
            'CouponApplied',
            {

                id: {
                    type: DataTypes.BIGINT,
                    autoIncrement: true,
                    primaryKey: true
                },

                cus_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false
                },

                coupon_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false
                },

                coupon_code: {
                    type: DataTypes.STRING,
                    allowNull: true
                },

                percentage: {
                    type: DataTypes.FLOAT,
                    defaultValue: 0
                },

                used_at: {
                    type: DataTypes.DATE,
                    allowNull: true
                },

                status: {
                    type: DataTypes.INTEGER,
                    defaultValue: 1
                },

                del_status: {
                    type: DataTypes.INTEGER,
                    defaultValue: 0
                }

            },
            {

                tableName:
                    'coupon_applieds',

                timestamps: true,

                createdAt:
                    'created_at',

                updatedAt:
                    'updated_at'

            }
        );

    CouponApplied.associate = (models) => {

        CouponApplied.belongsTo(
            models.Customer,
            {
                foreignKey: 'cus_id'
            }
        );

        CouponApplied.belongsTo(
            models.Coupon,
            {
                foreignKey: 'coupon_id'
            }
        );

    };

    return CouponApplied;

};