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
        country_code: DataTypes.STRING,

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
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }

    }, {
        tableName: 'receptionists',
        timestamps: true
    });
     Receptionist.prototype.toJSON = function () {

        const values = Object.assign({}, this.get());

        if (values.createdAt) {
            values.createdAt = new Date(values.createdAt)
                .toLocaleString('en-US', {
                    month: 'long',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
        }

        if (values.updatedAt) {
            values.updatedAt = new Date(values.updatedAt)
                .toLocaleString('en-US', {
                    month: 'long',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
        }

        return values;
    };

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