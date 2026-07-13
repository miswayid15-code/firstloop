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

        // 0 = Pending
        // 1 = Approved
        // 2 = Completed
        // 3 = Cancelled
        // 4 = Rejected
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        // customer
        // merchant
        // receptionist
        // admin
        created_by: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 1,
            comment: "merchant,Receptionist,Customer"
        },
        cancel_by: {
            type: DataTypes.STRING,
            allowNull: true
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        cancel_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        ref_id: {
            type: DataTypes.STRING,
            allowNull: true
        },

        // admin
        // merchant
        // receptionist
        approved_by: {
            type: DataTypes.STRING,
            allowNull: true
        },

        approved_by_id: {
            type: DataTypes.INTEGER,
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