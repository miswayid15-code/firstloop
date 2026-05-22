'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {

    }
  }

  Customer.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      password: DataTypes.STRING,
      dob: DataTypes.DATEONLY,
      gender: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '1 = Male, 2 = Female, 3 = Other'
},
      address: DataTypes.TEXT,
      lat: DataTypes.STRING,
      lon: DataTypes.STRING,
      profile_image: DataTypes.STRING,

      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },

      del_status: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'Customer',
      tableName: 'customers',
    }
  );
Customer.associate = (models) => {

    Customer.hasMany(models.RefreshToken, {
        foreignKey: 'user_id',
        constraints: false
    });

    Customer.hasMany(models.Appointment, {
        foreignKey: 'cus_id'
    });

};
  return Customer;
};