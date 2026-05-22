'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.sequelize.query(`
      ALTER TABLE coupons
      ALTER COLUMN start_date TYPE DATE
      USING CURRENT_DATE;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE coupons
      ALTER COLUMN end_date TYPE DATE
      USING CURRENT_DATE;
    `);

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.sequelize.query(`
      ALTER TABLE coupons
      ALTER COLUMN start_date TYPE TIME
      USING '00:00:00'::time;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE coupons
      ALTER COLUMN end_date TYPE TIME
      USING '00:00:00'::time;
    `);

  }

};