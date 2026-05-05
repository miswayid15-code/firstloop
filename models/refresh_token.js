module.exports = (sequelize, DataTypes) => {

  const RefreshToken = sequelize.define('RefreshToken', {

    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },

    user_type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },

    token: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }

  }, {
    tableName: 'refresh_tokens',
    timestamps: true,

    // 🔥 THIS IS THE FIX YOU MISSED
    createdAt: 'created_at',
    updatedAt: false
  });

  return RefreshToken;
};