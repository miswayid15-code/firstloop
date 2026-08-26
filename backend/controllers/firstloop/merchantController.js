const { Merchant, Coupon, RefreshToken, Branch, Receptionist, MerchantFp, BranchTiming, UserNotificationToken, CouponApplied, Notification, Stampcard, StampLevel, customerCard } = require('../../models');
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



        const branches = await Branch.findAll({

            where: {
                merchant_id,
                del_status: 0
            },

            include: [{
                model: Receptionist,
                attributes: ['id', 'name', 'email', 'country_code', 'phone', 'rep_id', 'ref_name']
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


        const data = branch.toJSON();

        const profileImagePath =
            data.profile_image_status === 1
                ? data.profile_image
                : data.pending_profile_image;

        data.profile_image = profileImagePath
            ? `${baseUrl}/${profileImagePath.replace(/\\/g, '/')}`
            : null;
data.stamp_card=0;
data.member_card=0;

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


exports.stamp_card = async (req, res) => {
    try {
        console.log("========== STAMP CARD API START ==========");
        console.log("[STAMP CARD] Method:", req.method);
        console.log("[STAMP CARD] URL:", req.originalUrl);
        console.log("[STAMP CARD] Merchant ID:", req.body?.merchant_id);
        console.log("[STAMP CARD] Card ID:", req.body?.id);

        console.log("[STAMP CARD] Request body:", {
            ...req.body,
            stamp_levels:
                typeof req.body?.stamp_levels === "string"
                    ? req.body.stamp_levels
                    : req.body?.stamp_levels
        });

        console.log(
            "[STAMP CARD] Uploaded files:",
            Array.isArray(req.files)
                ? req.files.map(file => ({
                    fieldname: file.fieldname,
                    originalname: file.originalname,
                    filename: file.filename,
                    path: file.path,
                    mimetype: file.mimetype,
                    size: file.size
                }))
                : req.files
        );
        let {
            id,
            title,
            brand_name,
            branch_ids,
            number_of_stamps,
            background_image,
            background_color,
            text_color,
            border_color,
            stamp_radius,
            stamp_background,
            stamp_border_color,
            stamp_text_color,
            stamp_levels
        } = req.body;

        const merchant_id = req.body.merchant_id;

        if (!merchant_id) {
            return res.status(401).json({
                status: 0,
                msg: "Merchant authentication required"
            });
        }

        // ---------------------------------------
        // BASIC VALIDATION
        // ---------------------------------------
        // ---------------------------------------


        if (typeof branch_ids === "string") {
            try {
                branch_ids = JSON.parse(branch_ids);
            } catch (error) {
                return res.status(400).json({
                    status: 0,
                    msg: "Invalid branch_ids JSON"
                });
            }
        }

        if (!Array.isArray(branch_ids)) {
            return res.status(400).json({
                status: 0,
                msg: "Branch IDs are required"
            });
        }

        branch_ids = branch_ids
            .map(Number)
            .filter(id => Number.isInteger(id) && id > 0);

        if (!branch_ids.length) {
            return res.status(400).json({
                status: 0,
                msg: "At least one valid branch ID is required"
            });
        }
        if (!title || !String(title).trim()) {
            return res.status(400).json({
                status: 0,
                msg: "Card title is required"
            });
        }

        if (
            !number_of_stamps ||
            Number(number_of_stamps) <= 0
        ) {
            return res.status(400).json({
                status: 0,
                msg: "Number of stamps is required"
            });
        }

        number_of_stamps = Number(number_of_stamps);

        // ---------------------------------------
        // PARSE STAMP LEVELS
        // ---------------------------------------

        if (typeof stamp_levels === "string") {
            try {
                stamp_levels = JSON.parse(stamp_levels);
            } catch (error) {
                return res.status(400).json({
                    status: 0,
                    msg: "Invalid stamp_levels JSON"
                });
            }
        }

        if (!Array.isArray(stamp_levels)) {
            return res.status(400).json({
                status: 0,
                msg: "Stamp levels are required"
            });
        }

        if (stamp_levels.length !== number_of_stamps) {
            return res.status(400).json({
                status: 0,
                msg: "Stamp levels must match the number of stamps"
            });
        }

        // ---------------------------------------
        // FIND EXISTING CARD IF ID PROVIDED
        // ---------------------------------------

        let stampcard = null;

        if (id) {

            stampcard = await Stampcard.findOne({
                where: {
                    id: id,
                    merchant_id: merchant_id
                }
            });

            if (!stampcard) {
                return res.status(404).json({
                    status: 0,
                    msg: "Stamp card not found"
                });
            }
        }

        // ---------------------------------------
        // BRAND IMAGE
        // ---------------------------------------

        const brandImageFile = Array.isArray(req.files)
            ? req.files.find(f => f.fieldname === 'brand_image' || f.fieldname === 'brand_logo' || f.fieldname === 'image')
            : (req.files?.brand_image?.[0] || null);

        let brand_image = req.body.brand_image || stampcard?.brand_image || null;

        // Only change image when a new image is uploaded
        if (brandImageFile) {
            brand_image = `uploads/merchant/brand/${brandImageFile.filename}`;
        }

        // ---------------------------------------
        // BACKGROUND IMAGE
        // ---------------------------------------

        const bgImageFile = Array.isArray(req.files)
            ? req.files.find(f => f.fieldname === 'background_image' || f.fieldname === 'card_image')
            : (req.files?.background_image?.[0] || null);

        if (bgImageFile) {
            background_image = `uploads/merchant/${bgImageFile.filename}`;
        } else {
            background_image =
                background_image
                    ? String(background_image).trim()
                    : (stampcard?.background_image || null);
        }

        // ---------------------------------------
        // VALIDATE STAMP LEVELS
        // ---------------------------------------

        for (let i = 0; i < stamp_levels.length; i++) {

            const level = stamp_levels[i];

            // Stamp number
            if (
                Number(level.stamp_number) !== i + 1
            ) {
                return res.status(400).json({
                    status: 0,
                    msg: `Invalid stamp number at level ${i + 1}`
                });
            }

            // Reward type
            if (
                !["1", "2", "3"].includes(
                    String(level.reward_type)
                )
            ) {
                return res.status(400).json({
                    status: 0,
                    msg: `Invalid reward type for stamp ${i + 1}`
                });
            }

            // -----------------------------------
            // FREE
            // -----------------------------------

            if (String(level.reward_type) === "1") {

                level.reward_text = null;
                level.category_id = null;
                level.amt = 0;
            }

            // -----------------------------------
            // DISCOUNT
            // -----------------------------------

            if (String(level.reward_type) === "2") {

                if (
                    level.reward_text === undefined ||
                    level.reward_text === null ||
                    String(level.reward_text).trim() === ""
                ) {
                    return res.status(400).json({
                        status: 0,
                        msg: `Discount value is required for stamp ${i + 1}`
                    });
                }

                level.reward_text =
                    String(level.reward_text).trim();

                level.category_id = null;
                level.amt =
                    level.amt !== undefined &&
                        level.amt !== null &&
                        level.amt !== ""
                        ? Number(level.amt)
                        : 0;
            }

            // -----------------------------------
            // PAID
            // -----------------------------------

            if (String(level.reward_type) === "3") {

                if (
                    !level.reward_text ||
                    String(level.reward_text).trim() === ""
                ) {
                    return res.status(400).json({
                        status: 0,
                        msg: `Reward text is required for stamp ${i + 1}`
                    });
                }

                if (!level.category_id) {
                    return res.status(400).json({
                        status: 0,
                        msg: `Category is required for stamp ${i + 1}`
                    });
                }

                level.reward_text =
                    String(level.reward_text).trim();

                level.category_id =
                    Number(level.category_id);
                level.amt =
                    level.amt !== undefined &&
                        level.amt !== null &&
                        level.amt !== ""
                        ? Number(level.amt)
                        : 0;
            }
        }

        // ---------------------------------------
        // CARD DATA
        // ---------------------------------------

        const cardData = {

            title:
                String(title).trim(),
            branch_ids: branch_ids,
            brand_name:
                brand_name
                    ? String(brand_name).trim()
                    : null,

            brand_image,

            number_of_stamps,

            background_image,

            background_color:
                background_color || null,

            text_color:
                text_color || null,

            border_color:
                border_color || null,

            stamp_radius:
                stamp_radius !== undefined &&
                    stamp_radius !== null &&
                    stamp_radius !== ""
                    ? Number(stamp_radius)
                    : 50,

            stamp_background:
                stamp_background || null,

            stamp_border_color:
                stamp_border_color || null,

            stamp_text_color:
                stamp_text_color || null,

            status: 1
        };

        // ---------------------------------------
        // CREATE
        // ---------------------------------------

        if (!stampcard) {

            stampcard = await Stampcard.create({
                merchant_id,
                ...cardData
            });

        }

        // ---------------------------------------
        // UPDATE
        // ---------------------------------------

        else {

            await stampcard.update(cardData);

            // Remove old levels
            await StampLevel.destroy({
                where: {
                    merchant_card_id: stampcard.id
                }
            });
        }

        // ---------------------------------------
        // CREATE STAMP LEVELS
        // ---------------------------------------

        const levels = stamp_levels.map(level => ({
            merchant_card_id: stampcard.id,

            stamp_number:
                Number(level.stamp_number),

            reward_type:
                String(level.reward_type),

            reward_text:
                level.reward_text || null,

            category_id:
                level.category_id || null,
            amt:
                level.amt || 0,

            status: 1
        }));

        await StampLevel.bulkCreate(levels);

        // ---------------------------------------
        // RESPONSE
        // ---------------------------------------

        return res.status(200).json({
            status: 1,

            msg: id
                ? "Stamp card updated successfully"
                : "Stamp card created successfully",

            data: {
                merchant_card_id: stampcard.id,
                title: stampcard.title,
                number_of_stamps:
                    stampcard.number_of_stamps
            }
        });

    } catch (err) {

        console.error(
            "stamp_card error:",
            err
        );

        return res.status(500).json({
            status: 0,
            msg: "Error while processing!",
            error: err.message
        });
    }
};

exports.fetch_stamp_card = async (req, res) => {
    try {

        const merchant_id = req.body.mer_id;

        if (!merchant_id) {
            return res.status(401).json({
                status: 0,
                msg: "Merchant authentication required"
            });
        }

        const where = {
            merchant_id
        };

        // ---------------------------------------
        // FETCH ALL CARDS OF MERCHANT
        // ---------------------------------------

        const stampcards = await Stampcard.findAll({
            where,

            include: [
                {
                    model: StampLevel,
                    as: "StampLevels",
                    required: false,
                    where: {
                        status: 1
                    },
                    attributes: [
                        "id",
                        "stamp_number",
                        "reward_type",
                        "reward_text",
                        "category_id",
                        "status"
                    ]
                }
            ],

            order: [
                ["id", "DESC"],
                [
                    {
                        model: StampLevel,
                        as: "StampLevels"
                    },
                    "stamp_number",
                    "ASC"
                ]
            ]
        });

        // ---------------------------------------
        // NO CARDS
        // ---------------------------------------

        if (!stampcards.length) {
            return res.status(200).json({
                status: 1,
                msg: "No stamp cards found",
                data: []
            });
        }



        // ---------------------------------------
        // FORMAT DATA
        // ---------------------------------------

        const data = stampcards.map(card => {

            const cardData = card.toJSON();

            return {
                ...cardData,

                brand_image: cardData.brand_image
                    ? baseUrl + '/' + cardData.brand_image
                    : null,

                background_image:
                    cardData.background_image ? baseUrl + '/' + cardData.background_image
                        : null,
            };
        });

        // ---------------------------------------
        // RESPONSE
        // ---------------------------------------

        return res.status(200).json({
            status: 1,
            msg: "Stamp cards fetched successfully",
            data
        });

    } catch (err) {

        console.error(
            "fetch_stamp_card error:",
            err
        );

        return res.status(500).json({
            status: 0,
            msg: "Error while processing!",
            error: err.message
        });
    }
};


exports.fetch_branch_stamp_card = async (req, res) => {
    try {

        const branch_id = req.body.branch_id;

        if (!branch_id) {
            return res.status(401).json({
                status: 0,
                msg: "Branch id required"
            });
        }
        const where = {
            branch_ids: {
                [Op.contains]: [Number(branch_id)]
            }
        };

        // ---------------------------------------
        // FETCH ALL CARDS OF MERCHANT
        // ---------------------------------------

        const stampcards = await Stampcard.findAll({
            where,

            include: [
                {
                    model: StampLevel,
                    as: "StampLevels",
                    required: false,
                    where: {
                        status: 1
                    },
                    attributes: [
                        "id",
                        "stamp_number",
                        "reward_type",
                        "reward_text",
                        "category_id",
                        "status"
                    ]
                }
            ],

            order: [
                ["id", "DESC"],
                [
                    {
                        model: StampLevel,
                        as: "StampLevels"
                    },
                    "stamp_number",
                    "ASC"
                ]
            ]
        });

        // ---------------------------------------
        // NO CARDS
        // ---------------------------------------

        if (!stampcards.length) {
            return res.status(200).json({
                status: 1,
                msg: "No stamp cards found",
                data: []
            });
        }



        // ---------------------------------------
        // FORMAT DATA
        // ---------------------------------------

        const data = stampcards.map(card => {

            const cardData = card.toJSON();

            return {
                ...cardData,

                brand_image: cardData.brand_image
                    ? baseUrl + '/' + cardData.brand_image
                    : null,

                background_image:
                    cardData.background_image ? baseUrl + '/' + cardData.background_image
                        : null,
            };
        });

        // ---------------------------------------
        // RESPONSE
        // ---------------------------------------

        return res.status(200).json({
            status: 1,
            msg: "Stamp cards fetched successfully",
            data
        });

    } catch (err) {

        console.error(
            "fetch_stamp_card error:",
            err
        );

        return res.status(500).json({
            status: 0,
            msg: "Error while processing!",
            error: err.message
        });
    }
};
exports.fetch_stamp_id = async (req, res) => {
    try {

        const card_id = req.body.id;

        if (!card_id) {
            return res.status(401).json({
                status: 0,
                msg: "Card id Is required"
            });
        }

        const where = {
            id: card_id
        };

        // ---------------------------------------
        // FETCH ALL CARDS OF MERCHANT
        // ---------------------------------------

        const stampcards = await Stampcard.findAll({
            where,

            include: [
                {
                    model: StampLevel,
                    as: "StampLevels",
                    required: false,
                    where: {
                        status: 1
                    },
                    attributes: [
                        "id",
                        "stamp_number",
                        "reward_type",
                        "reward_text",
                        "category_id",
                        "status"
                    ]
                }
            ],

            order: [
                ["id", "DESC"],
                [
                    {
                        model: StampLevel,
                        as: "StampLevels"
                    },
                    "stamp_number",
                    "ASC"
                ]
            ]
        });

        // ---------------------------------------
        // NO CARDS
        // ---------------------------------------

        if (!stampcards.length) {
            return res.status(200).json({
                status: 1,
                msg: "No stamp cards found",
                data: []
            });
        }



        // ---------------------------------------
        // FORMAT DATA
        // ---------------------------------------

        const data = stampcards.map(card => {

            const cardData = card.toJSON();

            return {
                ...cardData,

                brand_image: cardData.brand_image
                    ? baseUrl + '/' + cardData.brand_image
                    : null,

                background_image:
                    cardData.background_image ? baseUrl + '/' + cardData.background_image
                        : null,
            };
        });

        // ---------------------------------------
        // RESPONSE
        // ---------------------------------------

        return res.status(200).json({
            status: 1,
            msg: "Stamp cards details fetched successfully",
            data
        });

    } catch (err) {

        console.error(
            "fetch_stamp_card error:",
            err
        );

        return res.status(500).json({
            status: 0,
            msg: "Error while processing!",
            error: err.message
        });
    }
};