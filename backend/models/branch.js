module.exports = (sequelize, DataTypes) => {

    const Branch = sequelize.define('Branch', {

        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },

        name: DataTypes.STRING,

        email: DataTypes.STRING,

        phone: DataTypes.STRING,

        profile_image: DataTypes.STRING,

        lat: DataTypes.STRING,

        lon: DataTypes.STRING,

        address: DataTypes.TEXT,
            country_code: DataTypes.STRING,

        // ✅ Added
        open_time: DataTypes.TIME,

        close_time: DataTypes.TIME,

        description: DataTypes.TEXT,

        merchant_id: DataTypes.BIGINT,

        status: DataTypes.INTEGER,

        del_status: DataTypes.INTEGER

    }, {

        tableName: 'branches',

        timestamps: true,

        createdAt: 'created_at',

        updatedAt: 'updated_at'

    });

    Branch.associate = (models) => {

        Branch.belongsTo(models.Merchant, {
            foreignKey: 'merchant_id'
        });

        Branch.hasMany(models.BranchImage, {
            foreignKey: 'branch_id'
        });

        Branch.hasMany(models.MenuImage, {
            foreignKey: 'branch_id'
        });
                Branch.hasMany(models.Appointment, {
            foreignKey: 'br_id'
        });
        Branch.hasMany(models.Coupon, {
            foreignKey: 'branch_id'
        });

    };

    return Branch;

};