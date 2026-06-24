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

    return UserNotificationToken;
};