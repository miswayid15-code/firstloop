module.exports = (sequelize, DataTypes) => {
    const Support = sequelize.define("Support", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        phone: {
            type: DataTypes.STRING,
            allowNull: false
        },

        email: {
            type: DataTypes.STRING,
            allowNull: false
        },

        // 1 = Merchant, 2 = Receptionist, 3 = Customer
        type: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        // 1 = Website, 2 = App
        submit_type: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        // 0 = Pending, 1 = Resolved
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
          reply: {
            type: DataTypes.TEXT,
            allowNull: true
        }

    }, {
        tableName: "support",
        underscored: true,
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
    });

    return Support;
};