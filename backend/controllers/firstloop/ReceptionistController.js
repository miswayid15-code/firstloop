const { Merchant, Coupon, RefreshToken, Branch, Receptionist, MerchantFp, BranchTiming, UserNotificationToken, CouponApplied, Notification } = require('../../models');
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

        // Refresh Token - 2 minutes
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
            user_repId:receptionist.rep_id,
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