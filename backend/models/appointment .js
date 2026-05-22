module.exports = (sequelize, DataTypes) => {

    const Appointment = sequelize.define('Appointment', {

        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        cus_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        br_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        br_name: {
            type: DataTypes.STRING,
            allowNull: true
        },

        appointment_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },

        slot: {
            type: DataTypes.STRING,
            allowNull: false
        },

        status: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        cancel_by: {
            type: DataTypes.STRING,
            allowNull: true
        },

        cancel_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        }

    }, {

        tableName: 'appointments',

        timestamps: true,

        createdAt: 'created_at',

        updatedAt: 'updated_at'

    });

    Appointment.associate = (models) => {

        Appointment.belongsTo(models.Customer, {
            foreignKey: 'cus_id'
        });

        Appointment.belongsTo(models.Branch, {
            foreignKey: 'br_id'
        });

    };

    return Appointment;

};