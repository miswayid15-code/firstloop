'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('branches', 'visibility', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
        await queryInterface.addColumn('branches', 'age_group', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn('branches', 'description');
    await queryInterface.removeColumn('branches', 'age_group');
  }
};