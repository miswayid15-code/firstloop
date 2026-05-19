module.exports = (sequelize, DataTypes) => {

    const MerchantFp = sequelize.define('MerchantFp', {

        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        mer_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        otp: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        status: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '0 = Pending, 1 = Complete, 2 = Rejected'
        }

    }, {
        tableName: 'merchant_fp',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    MerchantFp.associate = (models) => {
        MerchantFp.belongsTo(models.Merchant, {
            foreignKey: 'mer_id'
        });

    };
    return MerchantFp;
};