'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // ✅ add user_id
    await queryInterface.addColumn('refresh_tokens', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'id'
    });

    // ✅ add user_type
    await queryInterface.addColumn('refresh_tokens', 'user_type', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'user_id'
    });

    // ✅ (optional) remove old merchant_id if exists
    const table = await queryInterface.describeTable('refresh_tokens');

    if (table.merchant_id) {
      await queryInterface.removeColumn('refresh_tokens', 'merchant_id');
    }

    // ✅ add index (important for performance)
    await queryInterface.addIndex('refresh_tokens', ['user_id', 'user_type'], {
      name: 'idx_user_token'
    });

  },

  async down(queryInterface, Sequelize) {

    // rollback index
    await queryInterface.removeIndex('refresh_tokens', 'idx_user_token');

    // add merchant_id back (if needed)
    await queryInterface.addColumn('refresh_tokens', 'merchant_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // remove new columns
    await queryInterface.removeColumn('refresh_tokens', 'user_id');
    await queryInterface.removeColumn('refresh_tokens', 'user_type');

  }
};