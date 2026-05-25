module.exports = (sequelize, DataTypes) => {

    const Coupon = sequelize.define('Coupon', {

        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        merchant_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        branch_ids: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: true
        },

        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },

        percentage: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },

        min_amount: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },

        usage_limit: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        banner_image: {
            type: DataTypes.STRING,
            allowNull: true
        },

        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },

        end_date: {
            type: DataTypes.DATEONLY,
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

    }, {
        tableName: 'coupons',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Coupon.associate = (models) => {

        Coupon.belongsTo(models.Merchant, {
            foreignKey: 'merchant_id'
        });
        Coupon.hasMany(models.CouponApplied, {
        foreignKey: 'coupon_id'
    });


    };

    return Coupon;
};