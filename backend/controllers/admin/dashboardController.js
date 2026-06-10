const { Merchant, Coupon, RefreshToken, Branch, Receptionist, MerchantFp, Category, BranchImage, MenuImage, Appointment, CouponApplied, Customer } = require('../../models');
const bcrypt = require('bcryptjs');
const { parsePhoneNumber } = require('libphonenumber-js');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const admin = require('../../config/firebase');
const crypto = require('crypto');
const sendMail = require('../../helpers/sendMail');
const { otpTemplate } = require('../../helpers/mailTemplate');
const ResetsTemplate = require('../../helpers/ResetsTemplate');
const RegisterTemplate = require('../../helpers/RegisterTemplate');
// const mapFiles = require('../../helpers/merchantFileMapper');
const baseUrl = process.env.APP_URL;
// const { Op, Sequelize, where,fn, col, literal  } = require('sequelize');
const fs = require('fs');
const path = require('path');





const {
    Op,
    fn,
    col,
    literal
} = require('sequelize');

exports.dashboard = async (req, res) => {

    try {

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            activeMerchants,
            activeCustomers,
            totalCoupons,
            redeemedCoupons,
            pendingBookings,
            newMerchantsThisWeek,
            newCustomersThisWeek,
            redeemedToday
        ] = await Promise.all([

            Merchant.count({
                where: {
                    status: 1,
                    del_status: 0
                }
            }),

            Customer.count({
                where: {
                    status: 1,
                    del_status: 0
                }
            }),

            Coupon.count({
                where: {
                    status: 1,
                    del_status: 0
                }
            }),

            CouponApplied.count({
                where: {
                    del_status: 0
                }
            }),

            Appointment.count({
                where: {
                    status: 0
                }
            }),

            Merchant.count({
                where: {
                    createdAt: {
                        [Op.gte]: startOfWeek
                    }
                }
            }),

            Customer.count({
                where: {
                    createdAt: {
                        [Op.gte]: startOfWeek
                    }
                }
            }),

            CouponApplied.count({
                where: {
                    created_at: {
                        [Op.gte]: today
                    },
                    del_status: 0
                }
            })

        ]);

        // Weekly Coupon Redemptions

        const weeklyRedemptions = await CouponApplied.findAll({

            attributes: [
                [fn('DATE', col('created_at')), 'date'],
                [fn('COUNT', col('id')), 'count']
            ],

            where: {
                created_at: {
                    [Op.gte]: startOfWeek
                },
                del_status: 0
            },

            group: [
                fn('DATE', col('created_at'))
            ],

            order: [
                [literal('date'), 'ASC']
            ],

            raw: true

        });

        // Monthly Coupon Usage Trend

        const monthlyTrend = await CouponApplied.findAll({

            attributes: [
                [
                    fn(
                        'DATE_TRUNC',
                        'month',
                        col('created_at')
                    ),
                    'month'
                ],
                [
                    fn('COUNT', col('id')),
                    'count'
                ]
            ],

            where: {
                del_status: 0
            },

            group: [
                fn(
                    'DATE_TRUNC',
                    'month',
                    col('created_at')
                )
            ],

            order: [
                [literal('month'), 'ASC']
            ],

            raw: true

        });

        // Top Performing Merchants

        const topMerchants = await CouponApplied.findAll({

            attributes: [
                'branch_id',
                [
                    fn('COUNT', col('CouponApplied.id')),
                    'redeemed_count'
                ]
            ],

            where: {
                del_status: 0
            },

            include: [
                {
                    model: Branch,
                    attributes: [
                        'id',
                        'name'
                    ]
                }
            ],

            group: [
                'branch_id',
                'Branch.id'
            ],

            order: [
                [literal('redeemed_count'), 'DESC']
            ],

            limit: 5

        });

        return res.json({
            status: 1,
            message: 'Dashboard data fetched successfully',

            data: {

                cards: {

                    active_merchants: activeMerchants,
                    new_merchants_this_week: newMerchantsThisWeek,

                    active_customers: activeCustomers,
                    new_customers_this_week: newCustomersThisWeek,

                    total_coupons: totalCoupons,

                    redeemed_coupons: redeemedCoupons,
                    redeemed_today: redeemedToday,

                    pending_bookings: pendingBookings

                },

                coupon_redemptions_weekly: weeklyRedemptions,

                coupon_usage_monthly: monthlyTrend,

                top_performing_merchants: topMerchants

            }
        });

    } catch (err) {

        console.log('Dashboard Error:', err);

        return res.status(500).json({
            status: 0,
            message: err.message
        });

    }

};