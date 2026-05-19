'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class CustomerFp extends Model {

    static associate(models) {

    }

  }

  CustomerFp.init({

    cus_id: DataTypes.INTEGER,

    otp: DataTypes.STRING,

    status: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }

  }, {

    sequelize,
    modelName: 'CustomerFp',
    tableName: 'customer_fp',
    createdAt: 'created_at',
    updatedAt: 'updated_at'

  });

  return CustomerFp;

};