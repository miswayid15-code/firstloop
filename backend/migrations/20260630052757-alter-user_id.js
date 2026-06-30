'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('receptionists', 'rep_id', {
      type: Sequelize.STRING(250),
      allowNull: true,
      after: 'id',
    });
  },
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('receptionists', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('receptionists', 'rep_id');
    await queryInterface.changeColumn('receptionists', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  }
};