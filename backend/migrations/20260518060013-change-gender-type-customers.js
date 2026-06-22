'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.sequelize.query(`
      ALTER TABLE customers
      ALTER COLUMN gender DROP DEFAULT;
    `);

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

    await queryInterface.sequelize.query(`
      ALTER TABLE customers
      ALTER COLUMN gender SET DEFAULT 1;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_customers_gender";
    `);

  },

  async down(queryInterface, Sequelize) {

    // Drop if exists
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_customers_gender" CASCADE;
    `);

    // Create enum
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_customers_gender"
      AS ENUM ('Male', 'Female', 'Other');
    `);

    // Remove default
    await queryInterface.sequelize.query(`
      ALTER TABLE customers
      ALTER COLUMN gender DROP DEFAULT;
    `);

    // Convert integer to enum
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

    // Set default
    await queryInterface.sequelize.query(`
      ALTER TABLE customers
      ALTER COLUMN gender SET DEFAULT 'Male';
    `);

  }
};