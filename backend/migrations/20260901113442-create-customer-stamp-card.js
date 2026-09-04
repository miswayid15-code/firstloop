'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {

        // =======================================
        // CREATE ENUM TYPES
        // =======================================

        await queryInterface.sequelize.query(`
            DO $$
            BEGIN

                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname = 'enum_customer_stamp_levels_reward_type'
                ) THEN

                    CREATE TYPE public.enum_customer_stamp_levels_reward_type
                    AS ENUM ('1', '2', '3');

                END IF;

            END
            $$;
        `);

        await queryInterface.sequelize.query(`
            DO $$
            BEGIN

                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname = 'enum_customer_stamp_levels_payment_type'
                ) THEN

                    CREATE TYPE public.enum_customer_stamp_levels_payment_type
                    AS ENUM ('1', '2');

                END IF;

            END
            $$;
        `);

        await queryInterface.sequelize.query(`
            DO $$
            BEGIN

                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname = 'enum_customer_stamp_levels_payment_status'
                ) THEN

                    CREATE TYPE public.enum_customer_stamp_levels_payment_status
                    AS ENUM ('1', '2');

                END IF;

            END
            $$;
        `);

        // =======================================
        // CREATE TABLE
        // =======================================

        await queryInterface.createTable('customer_stamp_levels', {

            id: {
                type: Sequelize.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },

            customer_card_id: {
                type: Sequelize.BIGINT,
                allowNull: false,

                references: {
                    model: 'customer_cards',
                    key: 'id',
                },

                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },

            // ===================================
            // STAMP NUMBER
            // ===================================

            stamp_number: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },

            // ===================================
            // AMOUNT REQUIRED FOR STAMP
            // ===================================

            amt: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },

            // ===================================
            // DISCOUNT PERCENTAGE
            // ===================================

            discount: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0,

                comment: 'Discount percentage',
            },

            // ===================================
            // REWARD TYPE
            // ===================================
            // 1 = Free
            // 2 = Discount
            // 3 = Paid

            reward_type: {
                type: Sequelize.ENUM('1', '2', '3'),
                allowNull: false,
                defaultValue: '1',
            },

            // ===================================
            // REWARD TEXT
            // ===================================

            reward_text: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            // ===================================
            // ICON
            // ===================================

            icon: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            // ===================================
            // CATEGORY
            // ===================================

            category_id: {
                type: Sequelize.BIGINT,
                allowNull: true,
            },

            // ===================================
            // ROLE
            // ===================================

            role: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },

            role_id: {
                type: Sequelize.BIGINT,
                allowNull: true,
            },

            // ===================================
            // PAID REWARD AMOUNT
            // ===================================

            paid_amt: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,

                comment: 'Amount to be paid for paid reward',
            },

            // ===================================
            // PAYMENT TYPE
            // ===================================
            // 1 = Cash
            // 2 = Online

            payment_type: {
                type: Sequelize.ENUM('1', '2'),
                allowNull: true,

                comment: '1 = Cash, 2 = Online',
            },

            // ===================================
            // PAYMENT STATUS
            // ===================================
            // 1 = Paid
            // 2 = Unpaid

            payment_status: {
                type: Sequelize.ENUM('1', '2'),
                allowNull: true,

                comment: '1 = Paid, 2 = Unpaid',
            },
            paid_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            // ===================================
            // STATUS
            // ===================================

            status: {
                type: Sequelize.SMALLINT,
                allowNull: false,
                defaultValue: 0,
            },

            // ===================================
            // CREATED AT
            // ===================================

            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

            // ===================================
            // UPDATED AT
            // ===================================

            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

        });
    },

    async down(queryInterface) {

        // Drop table first
        await queryInterface.dropTable('customer_stamp_levels');

        // Drop ENUM types
        await queryInterface.sequelize.query(`
            DROP TYPE IF EXISTS public.enum_customer_stamp_levels_reward_type;
        `);

        await queryInterface.sequelize.query(`
            DROP TYPE IF EXISTS public.enum_customer_stamp_levels_payment_type;
        `);

        await queryInterface.sequelize.query(`
            DROP TYPE IF EXISTS public.enum_customer_stamp_levels_payment_status;
        `);
    },
};