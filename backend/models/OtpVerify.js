module.exports = (sequelize, DataTypes) => {

    const OtpVerify = sequelize.define(
        'OtpVerify',
        {
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true
            },

            mail: {
                type: DataTypes.STRING,
                allowNull: false
            },

            otp: {
                type: DataTypes.STRING,
                allowNull: false
            },

            status: {
                type: DataTypes.SMALLINT,
                allowNull: false,
                defaultValue: 1
            }
        },
        {
            tableName: 'otperify',
            timestamps: true
        }
    );

    return OtpVerify;
};