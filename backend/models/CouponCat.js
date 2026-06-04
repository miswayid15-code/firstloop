module.exports = (sequelize, DataTypes) => {

    const CouponCat = sequelize.define('CouponCat', {

        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
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

        tableName: 'coupon_cat',

        timestamps: true,

        createdAt: 'created_at',

        updatedAt: 'updated_at'

    });

    CouponCat.associate = (models) => {

        CouponCat.hasMany(models.Coupon, {
            foreignKey: 'cat_id'
        });

    };

    return CouponCat;

};