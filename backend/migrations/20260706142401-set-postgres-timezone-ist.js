'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER DATABASE dealora
      SET timezone TO 'Asia/Kolkata';
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER DATABASE dealora
      SET timezone TO 'UTC';
    `);
  }
};