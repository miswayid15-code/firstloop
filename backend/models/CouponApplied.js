module.exports = (sequelize, DataTypes) => {

    const CouponApplied = sequelize.define(
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
            branch_id: {
                type: DataTypes.INTEGER,
                allowNull: true
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

            approved_by: {
                type: DataTypes.STRING,
                allowNull: true
            },

            approved_by_id: {
                type: DataTypes.BIGINT,
                allowNull: true
            },

            cancel_by: {
                type: DataTypes.STRING,
                allowNull: true
            },

            cancel_reason: {
                type: DataTypes.TEXT,
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

            tableName: 'coupon_applieds',

            timestamps: true,

            createdAt: 'created_at',

            updatedAt: 'updated_at'

        }
    );

    CouponApplied.associate = (models) => {

        CouponApplied.belongsTo(models.Customer, {
            foreignKey: 'cus_id'
        });

        CouponApplied.belongsTo(models.Coupon, {
            foreignKey: 'coupon_id'
        });
        CouponApplied.belongsTo(models.Branch, {
            foreignKey: 'branch_id',
          
        });
    };

    return CouponApplied;

};