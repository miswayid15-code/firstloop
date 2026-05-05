module.exports = (sequelize, DataTypes) => {

  const Branch = sequelize.define('Branch', {

    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },

    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,

    lat: DataTypes.STRING,
    lon: DataTypes.STRING,

    address: DataTypes.TEXT,

    merchant_id: DataTypes.BIGINT,

    status: DataTypes.INTEGER,
    del_status: DataTypes.INTEGER

  }, {
    tableName: 'branches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // ✅ association
  Branch.associate = (models) => {
    Branch.belongsTo(models.Merchant, {
      foreignKey: 'merchant_id'
    });
  };
Branch.associate = (models) => {
  Branch.hasMany(models.BranchImage, {
    foreignKey: 'branch_id'
  });
};
  return Branch;
};