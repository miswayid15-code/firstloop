'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('branches', 'profile_image', {
      type: Sequelize.STRING,
      allowNull: true
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn('branches', 'profile_image');

  }

};