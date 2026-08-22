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

exports.refreshAccessToken = async (req, res) => {
    try {

        let refresh_token = null;

        const authHeader = req.headers.authorization;

        // =========================
        // CHECK HEADER
        // =========================
        if (authHeader && authHeader.startsWith("Bearer ")) {
            refresh_token = authHeader.split(" ")[1];
        }
        // =========================
        // CHECK BODY
        // =========================
        else if (req.body.refresh_token) {
            refresh_token = req.body.refresh_token;
        }

        if (!refresh_token) {
            return res.status(401).json({
                status: 0,
                message: "Refresh token required"
            });
        }

        console.log("refresh token:", refresh_token);

        const stored = await RefreshToken.findOne({
            where: { token: refresh_token }
        });

        console.log("stored:", stored);

        if (!stored) {
            return res.status(401).json({
                status: 0,
                message: "Invalid refresh token"
            });
        }

        const decoded = jwt.verify(
            refresh_token,
            process.env.JWT_REFRESH_SECRET
        );

        const merchant = await Merchant.findOne({
            where: {
                id: decoded.id,
                del_status: 0
            }
        });

        if (!merchant) {
            return res.status(401).json({
                status: 0,
                message: "Merchant is not available"
            });
        }

        const newAccessToken = jwt.sign(
            {
                id: merchant.id,
                email: merchant.email,
                user_type: "merchant",
                token_type: "access"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "10d"
            }
        );

        return res.json({
            status: 1,
            access_token: newAccessToken
        });

    } catch (err) {
        console.log("err:", err);

        return res.status(401).json({
            status: 0,
            message: "Token expired or invalid"
        });
    }
};
exports.login = async (req, res) => {
    // console.log("Body", req.body);
    try {
        const { email, password } = req.body;
        const merchant = await Merchant.findOne({ where: { email } })
        if (!merchant) {
            return res.json({ status: 0, message: "Invalid email " });
        }
        const match = await bcrypt.compare(password, merchant.password);

        if (!match) {
            return res.json({ status: 0, message: "Invalid password" });
        }
        // =========================
        // REFRESH TOKEN
        // =========================

        const refreshToken = jwt.sign(
            {
                id: merchant.id,
                user_type: 'merchant',
                token_type: 'refresh'
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: '30d'
            }
        );

        await RefreshToken.create({
            user_id: merchant.id,
            user_type: 'merchant',
            token: refreshToken,
            expires_at: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            )
        });

        // =========================
        // ACCESS TOKEN
        // =========================

        const accessToken = jwt.sign(
            {
                id: merchant.id,
                email: merchant.email,
                user_type: 'merchant',
                token_type: 'access'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '10d'
            }
        );


        return res.json({
            status: 1,
            message: "Login successful",
            user_id: merchant.id,
            user_name: merchant.bus_name || merchant.name || "merchant",
            access_token: accessToken,
            refresh_token: refreshToken
        });
    } catch (err) {
        console.log(err);
        return res.json({ status: 0, message: "Error" });
    }
}

exports.logout = async (req, res) => {
    try {

        const refreshDeleted = await RefreshToken.destroy({
            where: {
                user_id: req.user.id,
                user_type: "merchant"
            }
        });



        // console.log("========== LOGOUT SUCCESS ==========");

        return res.json({
            status: 1,
            message: "Logged out from all devices"
        });

    } catch (err) {

        console.log("========== LOGOUT ERROR ==========");
        console.error(err);

        return res.json({
            status: 0,
            message: err.message || "Logout failed"
        });

    }
};
exports.dashboard = async (req, res) => {
    try {

        const merchant_id = req.user?.id;
        

        /* ---------------------------------------
           Validate Merchant ID
        --------------------------------------- */

        if (!merchant_id) {
            return res.status(400).json({
                status: 0,
                message: "Merchant id is required"
            });
        }


        /* ---------------------------------------
           Find Merchant
        --------------------------------------- */

        const merchant = await Merchant.findOne({
            where: {
                id: merchant_id,
                del_status: 0
            },

            include: [
                {
                    model: Branch,
                    attributes: ["id"],
                    where: {
                        del_status: 0
                    },
                    required: false
                }
            ]
        });


        /* ---------------------------------------
           Merchant Not Found
        --------------------------------------- */

        if (!merchant) {
            return res.status(404).json({
                status: 0,
                message: "Merchant not found"
            });
        }


        /* ---------------------------------------
           Dashboard Response
        --------------------------------------- */

        return res.status(200).json({
            status: 1,
            message: "Successfully fetched",

            data: {
                id: merchant.id,

                name:
                    merchant.bus_name ||
                    merchant.name ||
                    "Merchant",

                active_br:
                    merchant.Branch?.length || 0,

                active_mem_cr: 0,

                active_st_cr: 0,

                active_cus: 0
            }
        });

    }

    catch (err) {

        console.error(
            "Merchant Dashboard Error:",
            err
        );

        return res.status(500).json({
            status: 0,
            message: err.message
        });
    }
};  
exports.fetch_list = async (req, res) => {

    try {

        const merchant_id = req.user.id;

        const baseUrl = process.env.APP_URL;

        const branches = await Branch.findAll({

            where: {
                merchant_id,
                del_status: 0
            },

            include: [{
                model: Receptionist,
                attributes: ['id', 'name','email','country_code','phone','rep_id','ref_name']
            }],

            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'profile_image',
                'lat',
                'lon',
                'address',
                'address_line_2',
                'merchant_id',
                'open_time',
                'close_time',
            ],

            order: [['id', 'DESC']]

        });

        if (!branches || branches.length === 0) {

            return res.json({
                status: 0,
                message: "Branch list not found"
            });

        }

        const data = branches.map(branch => {

            const branchData = branch.toJSON();

            // ✅ profile image url
            branchData.profile_image = branchData.profile_image
                ? baseUrl + '/' + branchData.profile_image.replace(/\\/g, '/')
                : null;

            // ✅ branch images
            if (branchData.BranchImages && branchData.BranchImages.length > 0) {

                branchData.BranchImages = branchData.BranchImages.map(img => ({
                    ...img,
                    image: img.image
                        ? baseUrl + '/' + img.image.replace(/\\/g, '/')
                        : null
                }));

            }

            return branchData;

        });

        return res.json({
            status: 1,
            data
        });

    } catch (err) {

        console.log("FETCH ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

exports.branch_id = async (req, res) => {
    try {
        const branch_id = req.params.id;

        if (!branch_id) {
            return res.json({
                status: 0,
                message: "Branch ID required"
            });
        }

        const [
            branch,

        ] = await Promise.all([
            Branch.findOne({
                where: {
                    id: branch_id,
                    del_status: 0
                },
                include: [
                    {
                        model: Receptionist,
                        attributes: ['id', 'name']
                    }, {
                        model: BranchTiming,
                        attributes: ['id', 'day', 'open_time', 'close_time', 'is_closed']
                    }
                ],
                attributes: [
                    'id',
                    'name',
                    'email',
                    'phone',
                    'profile_image',
                    'pending_profile_image',
                    'profile_image_status',
                    'lat',
                    'lon',
                    'address',
                    'address_line_2',
                    'merchant_id',
                    'description',
                    'country_code',
                    'passlock',
                    'visibility',
                    'age_group',
                    'lat', 'lon', 'city', 'state', 'country'
                ]

            }),


        ]);

        if (!branch) {
            return res.json({
                status: 0,
                message: "Branch not found"
            });
        }

        const baseUrl = process.env.APP_URL;
        const data = branch.toJSON();

        const profileImagePath =
            data.profile_image_status === 1
                ? data.profile_image
                : data.pending_profile_image;

        data.profile_image = profileImagePath
            ? `${baseUrl}/${profileImagePath.replace(/\\/g, '/')}`
            : null;


        // Counts
        return res.json({
            status: 1,
            data
        });

    } catch (err) {
        console.log("BRANCH FETCH ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });
    }
};
