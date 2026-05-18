'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // remove default
    await queryInterface.sequelize.query(`
      ALTER TABLE customers
      ALTER COLUMN gender DROP DEFAULT;
    `);

    // change enum to integer
    await queryInterface.sequelize.query(`
      ALTER TABLE customers
      ALTER COLUMN gender TYPE INTEGER
      USING (
        CASE
          WHEN gender = 'Male' THEN 1
          WHEN gender = 'Female' THEN 2
          ELSE 3
        END
      );
    `);

    // set default
    await queryInterface.sequelize.query(`
      ALTER TABLE customers
      ALTER COLUMN gender SET DEFAULT 1;
    `);

    // drop enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_customers_gender";
    `);

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_customers_gender"
      AS ENUM ('Male', 'Female', 'Other');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE customers
      ALTER COLUMN gender TYPE "enum_customers_gender"
      USING (
        CASE
          WHEN gender = 1 THEN 'Male'
          WHEN gender = 2 THEN 'Female'
          ELSE 'Other'
        END
      )::"enum_customers_gender";
    `);

  }
};