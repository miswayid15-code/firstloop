module.exports = (sequelize, DataTypes) => {

    const Notification = sequelize.define("Notification", {

        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },

        user_type: {
            type: DataTypes.ENUM(
                "customer",
                "merchant",
                "receptionist",
                "admin"
            ),
            allowNull: false
        },

        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },

        title: {
            type: DataTypes.STRING,
            allowNull: false
        },

        body: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        type: {
            type: DataTypes.STRING,
            allowNull: true
        },

        reference_id: {
            type: DataTypes.BIGINT,
            allowNull: true
        },

        data: {
            type: DataTypes.JSONB,
            allowNull: true
        },

        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }

    }, {
        tableName: "Notifications",
        timestamps: true
    });

    Notification.associate = (models) => {
        // No associations required.
    };

    return Notification;

};