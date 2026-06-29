module.exports = (sequelize, DataTypes) => {
    const UserNotificationToken = sequelize.define(
        "UserNotificationToken",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            user_type: {
                type: DataTypes.STRING,
                defaultValue: "null",
                comment: '1 = Merchant, 2 = Receptionist, 3 = Customer'
            },
            token: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            platform: {
                type: DataTypes.STRING,
                defaultValue: "unknown",
            },
            device_name: {
                type: DataTypes.STRING,
                defaultValue: "Unknown",
            },
            app_version: {
                type: DataTypes.STRING,
                defaultValue: "1.0.0",
            },
            is_active: {
                type: DataTypes.INTEGER,
                defaultValue: 1,
            },
        },
        {
            tableName: "user_notification_tokens",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );
    UserNotificationToken.associate = (models) => {

        UserNotificationToken.belongsTo(models.Merchant, {
            foreignKey: "user_id",
            constraints: false,
        });

        UserNotificationToken.belongsTo(models.Receptionist, {
            foreignKey: "user_id",

            constraints: false,
        });

        UserNotificationToken.belongsTo(models.Customer, {
            foreignKey: "user_id",
            constraints: false,
        });

    };

    return UserNotificationToken;
};