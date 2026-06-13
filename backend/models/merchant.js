module.exports = (sequelize, DataTypes) => {

  const Merchant = sequelize.define('Merchant', {

    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },

    name: DataTypes.STRING,

    email: {
      type: DataTypes.STRING,
      unique: true
    },

    phone: DataTypes.STRING,

    password: DataTypes.STRING,

    bus_name: DataTypes.STRING,
    bus_cat: DataTypes.STRING,

    cat_id: DataTypes.BIGINT,

    gst_no: DataTypes.STRING,

    address: DataTypes.TEXT,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    zip_code: DataTypes.STRING,
    country_code: DataTypes.STRING,
    country: DataTypes.STRING,

    lat: DataTypes.STRING,
    lon: DataTypes.STRING,

    document: DataTypes.STRING,
    profile_image: DataTypes.STRING,
    brand_image: DataTypes.STRING,

    status: DataTypes.INTEGER,
    del_status: DataTypes.INTEGER,
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }


  }, {
    tableName: 'Merchants',
    timestamps: true
  });

  Merchant.associate = (models) => {

    Merchant.hasMany(models.RefreshToken, {
      foreignKey: 'user_id',
      constraints: false
    });

    Merchant.hasMany(models.Branch, {
      foreignKey: 'merchant_id'
    });

    Merchant.hasMany(models.Receptionist, {
      foreignKey: 'merchant_id'
    });

    Merchant.hasMany(models.Coupon, {
      foreignKey: 'merchant_id'
    });

    Merchant.belongsTo(models.Category, {
      foreignKey: 'cat_id',
      targetKey: 'id'
    });
  };

  return Merchant;

};