'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {

  async up(queryInterface, Sequelize) {

    await queryInterface.changeColumn('coupons', 'branch_id', {
      type: Sequelize.STRING,
      allowNull: true
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.sequelize.query(`
      ALTER TABLE coupons
      ALTER COLUMN branch_id
      TYPE INTEGER[]
      USING (
        CASE
          WHEN branch_id IS NULL OR branch_id = '' THEN ARRAY[]::INTEGER[]
          ELSE string_to_array(branch_id, ',')::INTEGER[]
        END
      );
    `);

    await queryInterface.changeColumn('coupons', 'branch_id', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
      defaultValue: []
    });

  }

};