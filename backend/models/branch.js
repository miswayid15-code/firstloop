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
        passlock: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true
        },

        profile_image: DataTypes.STRING,
        pending_profile_image: DataTypes.STRING,
        profile_image_status: {
            type: DataTypes.INTEGER,
            defaultValue: 0 // 0 = Pending, 1 = Approved, 2 = Rejected
        },
        rejected_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        lat: DataTypes.STRING,

        lon: DataTypes.STRING,

        address: DataTypes.TEXT,
        address_line_2: DataTypes.STRING,
        country_code: DataTypes.STRING,
        country_iso: DataTypes.STRING,

        // ✅ Added
        open_time: {
            type: DataTypes.TIME,
            allowNull: true,
            defaultValue: null
        },

        close_time: {
            type: DataTypes.TIME,
            allowNull: true,
            defaultValue: null
        },
        description: DataTypes.TEXT,
        visibility: {
            type: DataTypes.TEXT,
            defaultValue: 1,
            comment: '0=all,1 = Male, 2 = Female, 3 = children'
        },
        age_group: DataTypes.TEXT,
        description: DataTypes.TEXT,

        merchant_id: DataTypes.BIGINT,

        status: DataTypes.INTEGER,
        country: {
            type: DataTypes.STRING,
            allowNull: true
        },

        zip_code: {
            type: DataTypes.STRING,
            allowNull: true
        },

        del_status: DataTypes.INTEGER,
        city: DataTypes.STRING,
        state: DataTypes.STRING,
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }

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
            foreignKey: 'branch_ids'
        });
        Branch.hasMany(models.Receptionist, {
            foreignKey: 'branch_id'
        });
        Branch.hasMany(models.BranchTiming, {
            foreignKey: 'branch_id'
        });
        Branch.hasMany(models.CouponApplied, {
            foreignKey: 'branch_id',
            as: 'coupon_applieds'
        });
    };

    return Branch;

};