'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
 

    await queryInterface.addColumn('branches', 'zip_code', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'country'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('branches', 'zip_code');
   
  }
};