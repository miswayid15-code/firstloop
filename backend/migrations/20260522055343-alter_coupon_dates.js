'use strict';

module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.sequelize.query(`
      ALTER TABLE coupons
      ALTER COLUMN start_date TYPE TIME
      USING start_date::TIME;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE coupons
      ALTER COLUMN end_date TYPE TIME
      USING end_date::TIME;
    `);

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.sequelize.query(`
      ALTER TABLE coupons
      ALTER COLUMN start_date TYPE VARCHAR(255)
      USING start_date::TEXT;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE coupons
      ALTER COLUMN end_date TYPE VARCHAR(255)
      USING end_date::TEXT;
    `);

  }

};