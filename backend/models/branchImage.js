module.exports = (sequelize, DataTypes) => {

  const BranchImage = sequelize.define('BranchImage', {

    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },

    branch_id: DataTypes.BIGINT,
    image: DataTypes.STRING,
    pending_image: DataTypes.STRING,
        image_status: {
            type: DataTypes.INTEGER,
            defaultValue: 0 // 0 = Pending, 1 = Approved, 2 = Rejected
        },
    rejected_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: DataTypes.INTEGER,
    image_status: DataTypes.INTEGER

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