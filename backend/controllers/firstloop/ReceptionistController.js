const { Merchant, Coupon, RefreshToken, Branch, Receptionist, MerchantFp, BranchTiming, UserNotificationToken, CouponApplied, Notification, Stampcard, StampLevel, MembershipCards, CustomerCard, Customer,
    CustomerStampLevel, } = require('../../models');
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
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { sendPushNotification } = require("../../helpers/notificationHelper");



exports.login = async (req, res) => {
    try {
        const { rep_id, password } = req.body;

        const receptionist = await Receptionist.findOne({ where: { rep_id } });

        if (!receptionist) {
            return res.json({ status: 0, message: "Invalid Reception Id" });
        }

        const match = await bcrypt.compare(password, receptionist.password);

        if (!match) {
            return res.json({ status: 0, message: "Invalid password" });
        }
        const branch = await Branch.findOne({ where: { id: receptionist.branch_id } });

        const refreshToken = jwt.sign(
            {
                id: receptionist.id,
                user_type: "receptionist",
                token_type: "refresh",
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "30d" }
        );

        await RefreshToken.create({
            user_id: receptionist.id,
            user_type: "receptionist",
            token: refreshToken,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 2 minutes

        });

        // Access Token - 1 minute
        const accessToken = jwt.sign(
            {
                id: receptionist.id,
                rep_id: receptionist.rep_id,
                user_type: "receptionist",
                token_type: "access",
            },
            process.env.JWT_SECRET,
            { expiresIn: "10d" }
        );

        return res.json({
            status: 1,
            message: "Login successful",
            user_id: receptionist.id,
            user_repId: receptionist.rep_id,
            user_name: receptionist.name,
            user_branch: branch.name,
            user_branch_id: branch.id,
            access_token: accessToken,
            refresh_token: refreshToken,

        });
    } catch (err) {
        console.log(err);

        return res.json({
            status: 0,
            message: "Error",
        });
    }
};

exports.logout = async (req, res) => {
    try {

        await RefreshToken.destroy({
            where: {
                user_id: req.user.id,
                user_type: 'receptionist'
            }
        });


        return res.json({
            status: 1,
            message: "Logged out from all devices"
        });

    } catch (err) {
        return res.json({ status: 0, message: "Error" });
    }
};

exports.dashboard = async (req, res) => {
    try {
        const rep_id = req.user.id;

        // ---------------------------------
        // RECEPTIONIST
        // ---------------------------------

        const receptionist = await Receptionist.findOne({
            where: {
                id: rep_id
            }
        });

        if (!receptionist) {
            return res.json({
                status: 0,
                message: "Receptionist not found"
            });
        }

        const branch_id = receptionist.branch_id;

        // ---------------------------------
        // BRANCH
        // ---------------------------------

        const branch = await Branch.findOne({
            where: {
                id: branch_id
            }
        });

        if (!branch) {
            return res.json({
                status: 0,
                message: "Branch not found"
            });
        }

        // ---------------------------------
        // TOTAL CUSTOMERS
        // ---------------------------------

        const total_cus = await CustomerCard.count({
            where: {
                branch_id: branch_id
            },
            distinct: true,
            col: "customer_id"
        });

        // ---------------------------------
        // TOTAL STAMP CARDS
        // ---------------------------------

        const total_stamp_card = await CustomerCard.count({
            where: {
                card_type: 1,
                branch_id: branch_id
            }
        });

        
        // ---------------------------------
        // TOTAL MEMBERSHIP CARDS
        // ---------------------------------

        const total_membership_card = await CustomerCard.count({
            where: {
                card_type: 2,
                branch_id: branch_id
            }
        });

        // ---------------------------------
        // TODAY REPORT
        // ---------------------------------

const today_report_data = await CustomerCard.findAll({
    where: {
        branch_id: branch_id
    },

    attributes: [
        "id",
        "card_type",
        "title"
    ],

    include: [
        {
            model: Customer,
            as: "Customer",
            attributes: [
                "name",
                "email",
                "phone",
                "country_code"
            ]
        },
        {
            model: CustomerStampLevel,
            as: "CustomerStampLevels",
            attributes: [
                "payment_type",
                "paid_amt",
                "paid_date"
            ],
            where: {
                status: 1
            },
             required: true
        }
    ],

    order: [
        [
            { model: CustomerStampLevel, as: "CustomerStampLevels" },
            "paid_date",
            "DESC"
        ]
    ],

    limit: 10
});

// ---------------------------------
// FLAT TODAY REPORT
// ---------------------------------

const today_report = today_report_data.map(card => {

    const stampLevel = card.CustomerStampLevels?.[0];

    return {
        name: card.Customer?.name || null,
        email: card.Customer?.email || null,
        phone: card.Customer?.phone || null,
        country_code: card.Customer?.country_code || null,

        payment_type: stampLevel?.payment_type || null,
        time: stampLevel?.paid_date || null,
        amount: stampLevel?.paid_amt || 0,

        card_type: card.card_type,
        card_name: card.title
    };
});

        // ---------------------------------
        // RESPONSE
        // ---------------------------------

        return res.status(200).json({
            status: 1,
            message: "Dashboard data fetched successfully",

            name: receptionist.name,

            branch_id: branch.id,
            branch_name: branch.name,

            total_cus: total_cus || 0,
            total_stamp_card: total_stamp_card || 0,
            total_membership_card: total_membership_card || 0,

            today_report: today_report || []
        });

    } catch (err) {

        console.error("Dashboard Error:", err);

        return res.status(500).json({
            status: 0,
            message: "Error",
            error: err.message
        });
    }
};
exports.scan_qr = async (req, res) => {
    try {
        const { qr_code } = req.body;

        // ---------------------------------
        // VALIDATE QR CODE
        // ---------------------------------

        if (!qr_code) {
            return res.status(400).json({
                status: 0,
                message: "QR code is required"
            });
        }

        // ---------------------------------
        // FIND CUSTOMER CARD
        // ---------------------------------

        const customer_card = await CustomerCard.findOne({
            where: {
                qr_token: qr_code
            },

            attributes: [
                "id",
                "customer_id",
                "card_number",
                "card_type",
                "title",
                "current_stamp",
                "number_of_stamps",
                "is_completed"
            ],

            order: [
                ["id", "DESC"]
            ]
        });

        if (!customer_card) {
            return res.status(404).json({
                status: 0,
                message: "Customer card not found"
            });
        }

        // ---------------------------------
        // FIND CUSTOMER
        // ---------------------------------

        const customer = await Customer.findOne({
            where: {
                id: customer_card.customer_id,
                status: 1,
                del_status: 0
            },

            attributes: [
                "id",
                "name",
                "email",
                "phone",
                "country_code",
                "profile_image",
                "status",
                "del_status"
            ]
        });

        if (!customer) {
            return res.status(404).json({
                status: 0,
                message: "Customer not found"
            });
        }

        // ---------------------------------
        // CUSTOMER DATA
        // ---------------------------------

        const customerData = customer.toJSON();

        customerData.profile_image = customerData.profile_image
            ? baseUrl + '/' + customerData.profile_image
            : null;

        // ---------------------------------
        // CARD DATA
        // ---------------------------------

        customerData.cards = [customer_card.toJSON()];

        // ---------------------------------
        // RESPONSE
        // ---------------------------------

        return res.status(200).json({
            status: 1,
            message: "Customer card found successfully",
            data: customerData
        });

    } catch (err) {

        console.log("scan_qr Error:", err);

        return res.status(500).json({
            status: 0,
            message: "Something went wrong",
            error: err.message
        });
    }
};


