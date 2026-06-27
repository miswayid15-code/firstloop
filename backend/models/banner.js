'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class Banner extends Model {

    static associate(models) {

    }

  }

  Banner.init({

    title: DataTypes.STRING,

    image: DataTypes.STRING,
    country_code: DataTypes.STRING,

    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },

    del_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }

  }, {

    sequelize,
    modelName: 'Banner',
    tableName: 'banners',
    freezeTableName: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'

  });

  return Banner;

};