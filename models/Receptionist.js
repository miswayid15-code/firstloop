module.exports = (sequelize, DataTypes) => {

    const Receptionist = sequelize.define('Receptionist', {

        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },

        name: DataTypes.STRING,

        email: {
            type: DataTypes.STRING,
            unique: true
        },

        phone: DataTypes.STRING,

        password: DataTypes.STRING,

        profile_image: DataTypes.STRING,

        branch_id: DataTypes.BIGINT,
        merchant_id: DataTypes.BIGINT,
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },

        del_status: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }

    }, {
        tableName: 'receptionists',
        timestamps: true
    });

    Receptionist.associate = (models) => {

        Receptionist.hasMany(models.RefreshToken, {
            foreignKey: 'user_id',
            constraints: false
        });

        Receptionist.belongsTo(models.Branch, {
            foreignKey: 'branch_id'
        });
        Receptionist.belongsTo(models.Merchant, {
            foreignKey: 'merchant_id'
        });
    };

    return Receptionist;

};