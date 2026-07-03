'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('receptionists', 'rep_id', {
      type: Sequelize.STRING(250),
      allowNull: true,
    });

    await queryInterface.changeColumn('receptionists', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('receptionists');

    if (table.rep_id) {
      await queryInterface.removeColumn('receptionists', 'rep_id');
    }

    await queryInterface.changeColumn('receptionists', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  }
};