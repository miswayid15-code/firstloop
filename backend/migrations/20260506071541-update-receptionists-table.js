'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    // add status
    await queryInterface.addColumn('receptionists', 'status', {
      type: Sequelize.INTEGER,
      defaultValue: 1
    });

    // add del_status
    await queryInterface.addColumn('receptionists', 'del_status', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    // rename profile_img to profile_image
    await queryInterface.renameColumn(
      'receptionists',
      'profile_img',
      'profile_image'
    );

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn('receptionists', 'status');

    await queryInterface.removeColumn('receptionists', 'del_status');

    await queryInterface.renameColumn(
      'receptionists',
      'profile_image',
      'profile_img'
    );

  }

};