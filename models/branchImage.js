module.exports = (sequelize, DataTypes) => {

  const BranchImage = sequelize.define('BranchImage', {

    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },

    branch_id: DataTypes.BIGINT,
    image: DataTypes.STRING,
    status: DataTypes.INTEGER

  }, {
    tableName: 'branch_images',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  BranchImage.associate = (models) => {
    BranchImage.belongsTo(models.Branch, {
      foreignKey: 'branch_id'
    });
  };

  return BranchImage;
};