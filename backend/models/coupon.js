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

        start_time: {
            type: DataTypes.TIME
        },

        end_time: {
            type: DataTypes.TIME
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

    };

    return Coupon;
};