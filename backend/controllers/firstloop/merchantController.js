const { Merchant, Coupon, RefreshToken, Branch, Receptionist, MerchantFp, Category, BranchTiming, SalePerson, UserNotificationToken, CouponApplied, Notification, Stampcard, StampLevel, MembershipCards, CustomerCard, Customer,
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
const { Op, Sequelize } = require('sequelize');
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

        if (!merchant_id) {
            return res.status(400).json({
                status: 0,
                message: "Merchant id is required"
            });
        }

        const merchant = await Merchant.findOne({
            where: {
                id: merchant_id,
                del_status: 0
            }
        });

        if (!merchant) {
            return res.status(404).json({
                status: 0,
                message: "Merchant not found"
            });
        }

        // Get merchant branches
        const branches = await Branch.findAll({
            where: {
                merchant_id: merchant_id,
                del_status: 0
            },
            attributes: ["id"],
            raw: true
        });

        const branchIds = branches.map(branch => Number(branch.id));

        console.log("Branch IDs:", branchIds);

        // ---------------------------------------
        // CUSTOMER COUNT
        // ---------------------------------------

        let customer_count = 0;

        if (branchIds.length > 0) {
            customer_count = await CustomerCard.count({
                distinct: true,
                col: "customer_id",
                where: {
                    branch_id: {
                        [Op.in]: branchIds
                    }
                }
            });
        }

        // ---------------------------------------
        // ACTIVE STAMP CARDS
        // ---------------------------------------

        const active_stamp_card_count = await Stampcard.count({
            where: {
                merchant_id: merchant_id,
                status: 1
            }
        });

        // ---------------------------------------
        // ACTIVE MEMBERSHIP CARDS
        // ---------------------------------------

        const active_membership_card_count = await MembershipCards.count({
            where: {
                merchant_id: merchant_id
            }
        });
const today_report_data = await CustomerCard.findAll({
    where: {
        branch_id: {
            [Op.in]: branchIds
        }
    },

    attributes: [
        "id",
        "card_type",
        "title",
        "branch_id"
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
            model: Branch,
            as: "Branch",
            attributes: [
                "name"
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
    ]
});


// =====================================================
// FLATTEN ALL STAMP ENTRIES
// THEN SORT BY PAID DATE
// THEN TAKE ONLY LATEST 10
// =====================================================

const today_report = today_report_data
    .flatMap(card => {

        const stampLevels = card.CustomerStampLevels || [];

        return stampLevels.map(stampLevel => {

            return {
                branch_id: card.branch_id,
                branch_name: card.Branch?.name || null,

                name: card.Customer?.name || null,
                email: card.Customer?.email || null,
                phone: card.Customer?.phone || null,
                country_code: card.Customer?.country_code || null,

                payment_type: stampLevel.payment_type || null,
                time: stampLevel.paid_date || null,
                amount: stampLevel.paid_amt || 0,

                card_type: card.card_type,
                card_name: card.title
            };

        });

    })
    .sort((a, b) => {
        return new Date(b.time) - new Date(a.time);
    })
    .slice(0, 10);
        // ---------------------------------------
        // RESPONSE
        // ---------------------------------------

        return res.status(200).json({
            status: 1,
            message: "Successfully fetched",

            data: {
                id: merchant.id,

                name:
                    merchant.bus_name ||
                    merchant.name ||
                    "Merchant",

                active_br: branches.length,

                active_mem_cr: active_membership_card_count,

                active_st_cr: active_stamp_card_count,

                active_cus: customer_count,
                today_report: today_report
            }
        });

    } catch (err) {

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
        data.stamp_card = 0;
        data.member_card = 0;

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

        console.log("req body", req.body)
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
            stamp_levels,

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
                level.discount = 0;
                level.amt = 0;
                level.icon = level.icon || null;
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
                level.discount = level.discount || 0;

                level.category_id = null;
                level.amt =
                    level.amt !== undefined &&
                        level.amt !== null &&
                        level.amt !== ""
                        ? Number(level.amt)
                        : 0;
                level.icon = level.icon || null;
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
                level.discount = 0;
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

                level.icon = level.icon || null;
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
            discount: level.discount || 0,
            icon: level.icon || null,

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
                        "icon",
                        "amt",
                        "discount",
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
                        "icon",
                        "discount",
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
                        "icon",
                        "amt",
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
exports.fetchmerchant = async (req, res) => {

    try {

        const id = req.body.id;

        if (!id) {

            return res.json({
                status: 0,
                message: "Merchant id is required"
            });

        }

        const merchant = await Merchant.findOne({

            where: {
                id: id,
                del_status: 0
            },

            include: [

                {

                    model: Branch,

                    where: {
                        del_status: 0
                    },
                    attributes: [
                        'id',
                        'name',
                        'address',
                        'email',
                        'phone',
                        'passlock',
                        'profile_image',
                        'country_code',
                        'status',
                        'visibility',
                        'age_group',
                        'lat',
                        'lon',

                    ],

                    required: false,

                    include: [

                        {

                            model: Receptionist,

                            where: {
                                del_status: 0
                            },

                            required: false,

                            attributes: [
                                'id',
                                'rep_id',
                                'name',
                                'ref_name',
                                'country_code',
                                'profile_image',
                            ]

                        }

                    ]

                },
                {
                    model: Category,
                    required: false,
                    where: {
                        del_status: 0,
                        status: 1
                    },
                    attributes: [
                        'id',
                        'name',

                    ]



                }, {
                    model: SalePerson,
                    required: false,
                    attributes: [
                        'id',
                        'name',
                        'code'
                    ]
                }


            ]

        });

        if (!merchant) {

            return res.json({
                status: 0,
                message: "Merchant not found"
            });

        }

        const data = merchant.toJSON();

        const baseUrl = process.env.APP_URL;

        ['profile_image', 'brand_image', 'document'].forEach(field => {

            if (data[field]) {

                data[field] =
                    baseUrl + '/' + data[field].replace(/\\/g, '/');

            } else {

                data[field] = null;

            }

        });
        const branchMap = {};


        if (data.Branches && data.Branches.length > 0) {
            data.Branches.forEach(branch => {
                branchMap[branch.id] = branch.name;
            });
            for (const branch of data.Branches) {

                // Branch Image
                if (branch.profile_image) {

                    branch.profile_image =
                        baseUrl + '/' +
                        branch.profile_image.replace(/\\/g, '/');

                } else {

                    branch.profile_image = null;

                }

                // Receptionist Images
                if (branch.Receptionists &&
                    branch.Receptionists.length > 0) {

                    branch.Receptionists =
                        branch.Receptionists.map(receptionist => {

                            if (receptionist.profile_image) {

                                receptionist.profile_image =
                                    baseUrl + '/' +
                                    receptionist.profile_image.replace(/\\/g, '/');

                            } else {

                                receptionist.profile_image = null;

                            }

                            return receptionist;

                        });

                }

                // Fetch Coupons manually
                const coupons = await Coupon.findAll({

                    where: {
                        del_status: 0
                    },

                    attributes: ['id', 'branch_ids']

                });

                branch.coupon_count = coupons.filter(coupon => {

                    return (
                        Array.isArray(coupon.branch_ids) &&
                        coupon.branch_ids.includes(branch.id)
                    );

                }).length;

            }

        }
        const branchIds = data.Branches
            ? data.Branches.map(branch => branch.id)
            : [];

        const merchantCoupons = await Coupon.findAll({

            where: {
                merchant_id: id,
                del_status: 0
            },

            order: [['id', 'DESC']]

        });

        const couponList = merchantCoupons.map(coupon => {

            const item = coupon.toJSON();

            item.banner_image = item.banner_image
                ? baseUrl + '/' + item.banner_image.replace(/\\/g, '/')
                : null;

            item.branch_names = (item.branch_ids || []).map(id => ({
                id,
                name: branchMap[id] || null
            }));

            return item;

        });

        const totalCoupons = await Coupon.count({
            where: {
                del_status: 0,
                status: 1,
                branch_ids: {
                    [Op.overlap]: branchIds
                }
            }
        });

        const couponIds = merchantCoupons.map(coupon => coupon.id);

        const redeemedCoupons = await CouponApplied.count({
            where: {
                del_status: 0,
                status: 2,
                coupon_id: {
                    [Op.in]: couponIds
                }
            }
        });
        const total_branch = data.Branches ? data.Branches.length : 0;

        const total_receptionists = data.Branches
            ? data.Branches.reduce((total, branch) => {
                return total + (branch.Receptionists ? branch.Receptionists.length : 0);
            }, 0)
            : 0;

        const allCoupons = await Coupon.findAll({

            where: {
                del_status: 0
            },

            attributes: ['id', 'branch_ids']

        });

        const couponCountMap = {};

        allCoupons.forEach(coupon => {

            (coupon.branch_ids || []).forEach(branchId => {

                couponCountMap[branchId] =
                    (couponCountMap[branchId] || 0) + 1;

            });

        });

        if (data.Branches && data.Branches.length > 0) {

            for (const branch of data.Branches) {

                // Branch Image
                if (branch.profile_image) {

                    branch.profile_image =
                        baseUrl + '/' +
                        branch.profile_image.replace(/\\/g, '/');

                } else {

                    branch.profile_image = null;

                }

                // Receptionist Images
                if (
                    branch.Receptionists &&
                    branch.Receptionists.length > 0
                ) {

                    branch.Receptionists =
                        branch.Receptionists.map(receptionist => {

                            if (receptionist.profile_image) {

                                receptionist.profile_image =
                                    baseUrl + '/' +
                                    receptionist.profile_image.replace(/\\/g, '/');

                            } else {

                                receptionist.profile_image = null;

                            }

                            return receptionist;

                        });

                }

                // Coupon Count
                branch.coupon_count =
                    couponCountMap[branch.id] || 0;

            }

        }
        const unassignedReceptionists = await Receptionist.findAll({

            where: {
                merchant_id: id,
                del_status: 0,
                status: 1,
                branch_id: null
            },

            attributes: [
                'id',
                'rep_id',
                'name',
                'email',
                'phone',
                'country_code',
                'profile_image'
            ]

        });

        const formattedReceptionists = unassignedReceptionists.map(item => {

            const receptionist = item.toJSON();

            receptionist.profile_image = receptionist.profile_image
                ? baseUrl + '/' + receptionist.profile_image.replace(/\\/g, '/')
                : null;

            return receptionist;

        });

        data.total_branch = total_branch;
        data.total_receptionists = total_receptionists;
        data.total_coupon_count = totalCoupons;
        data.total_redeem_coupon = redeemedCoupons;
        data.unassigned_receptionists = formattedReceptionists;
        data.unassigned_receptionist_count = formattedReceptionists.length;
        data.coupon_list = couponList;
        return res.json({

            status: 1,
            message: "Merchant fetched successfully",
            data: data,


        });

    } catch (err) {

        console.log(err);

        return res.json({

            status: 0,
            message: "Error",
            error: err.message

        });

    }

};

exports.membership_card = async (req, res) => {
    console.log("data", req.body)
    try {
        let {
            id,
            title,
            brand_name,
            branch_ids,
            background_image,
            background_color,
            text_color,
            border_color,
            month
        } = req.body;

        const merchant_id = req.body.merchant_id;

        // ---------------------------------------
        // MERCHANT VALIDATION
        // ---------------------------------------

        if (!merchant_id) {
            return res.status(401).json({
                status: 0,
                msg: "Merchant authentication required"
            });
        }

        // ---------------------------------------
        // BRANCH IDS VALIDATION
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

        // ---------------------------------------
        // TITLE VALIDATION
        // ---------------------------------------

        if (!title || !String(title).trim()) {
            return res.status(400).json({
                status: 0,
                msg: "Card title is required"
            });
        }

        // ---------------------------------------
        // MONTH VALIDATION
        // ---------------------------------------

        // ---------------------------------------
        // MONTH VALIDATION
        // ---------------------------------------

        if (month !== undefined && month !== null && month !== "") {
            month = Number(month);

            if (!Number.isInteger(month) || month <= 0) {
                return res.status(400).json({
                    status: 0,
                    msg: "Month must be a valid positive number"
                });
            }
        } else {
            month = null;
        }

        // ---------------------------------------
        // FIND EXISTING MEMBERSHIP CARD
        // ---------------------------------------

        let membership_card = null;

        if (id) {
            membership_card = await MembershipCards.findOne({
                where: {
                    id: id,
                    merchant_id: merchant_id
                }
            });

            if (!membership_card) {
                return res.status(404).json({
                    status: 0,
                    msg: "Membership Card not found"
                });
            }
        }

        // ---------------------------------------
        // BACKGROUND IMAGE
        // ---------------------------------------

        const bgImageFile = Array.isArray(req.files)
            ? req.files.find(
                f =>
                    f.fieldname === "background_image" ||
                    f.fieldname === "card_image"
            )
            : (
                req.files?.background_image?.[0] ||
                req.files?.card_image?.[0] ||
                null
            );

        if (bgImageFile) {
            background_image = `uploads/merchant/${bgImageFile.filename}`;
        } else {
            background_image =
                background_image
                    ? String(background_image).trim()
                    : (membership_card?.background_image || null);
        }

        // ---------------------------------------
        // CARD DATA
        // ---------------------------------------

        const cardData = {
            title: String(title).trim(),

            branch_ids,

            brand_name:
                brand_name
                    ? String(brand_name).trim()
                    : null,

            background_image,

            background_color:
                background_color
                    ? String(background_color).trim()
                    : null,

            text_color:
                text_color
                    ? String(text_color).trim()
                    : null,

            border_color:
                border_color
                    ? String(border_color).trim()
                    : null,

            month
        };

        // ---------------------------------------
        // CREATE
        // ---------------------------------------

        if (!membership_card) {
            membership_card = await MembershipCards.create({
                merchant_id,
                ...cardData
            });

            return res.status(201).json({
                status: 1,
                msg: "Membership Card created successfully",
                data: membership_card
            });
        }

        // ---------------------------------------
        // UPDATE
        // ---------------------------------------

        await membership_card.update(cardData);

        return res.status(200).json({
            status: 1,
            msg: "Membership Card updated successfully",
            data: membership_card
        });

    } catch (err) {
        console.error("====================================");
        console.error("MEMBERSHIP CARD ERROR");
        console.error("Message:", err.message);
        console.error("Stack:", err.stack);
        console.error("Request Body:", req.body);
        console.error("Request Files:", req.files);
        console.error("====================================");

        return res.status(500).json({
            status: 0,
            msg: "Error",
            error: err.message
        });
    }
};

exports.fetch_membership_card = async (req, res) => {
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

        const membership_card = await MembershipCards.findAll({
            where,
        });

        // ---------------------------------------
        // NO CARDS
        // ---------------------------------------

        if (!membership_card.length) {
            return res.status(200).json({
                status: 1,
                msg: "No Membership cards found",
                data: []
            });
        }



        // ---------------------------------------
        // FORMAT DATA
        // ---------------------------------------

        const data = membership_card.map(card => {

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
            msg: "Membership cards fetched successfully",
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
exports.fetch_branch_membership_card = async (req, res) => {
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

        const membership_card = await MembershipCards.findAll({
            where,
        });

        // ---------------------------------------
        // NO CARDS
        // ---------------------------------------

        if (!membership_card.length) {
            return res.status(200).json({
                status: 1,
                msg: "No Membership cards found",
                data: []
            });
        }

        const data = membership_card.map(card => {

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
            msg: "Membership cards fetched successfully",
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

exports.fetch_membership_id = async (req, res) => {
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

        const membership_card = await MembershipCards.findAll({
            where,



        });

        // ---------------------------------------
        // NO CARDS
        // ---------------------------------------

        if (!membership_card.length) {
            return res.status(200).json({
                status: 1,
                msg: "No Membership cards found",
                data: []
            });
        }



        // ---------------------------------------
        // FORMAT DATA
        // ---------------------------------------

        const data = membership_card.map(card => {

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

    }
    catch (err) {

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
exports.report = async (req, res) => {
    try {
        const merchant_id = req.user?.id;

        if (!merchant_id) {
            return res.status(400).json({
                status: 0,
                message: "Merchant id is required"
            });
        }

        // ---------------------------------------
        // GET MERCHANT
        // ---------------------------------------

        const merchant = await Merchant.findOne({
            where: {
                id: merchant_id,
                del_status: 0
            }
        });

        if (!merchant) {
            return res.status(404).json({
                status: 0,
                message: "Merchant not found"
            });
        }

        // ---------------------------------------
        // GET MERCHANT BRANCHES
        // ---------------------------------------

        const branches = await Branch.findAll({
            where: {
                merchant_id: merchant_id,
                del_status: 0
            },
            attributes: [
                "id",
                "name",
                "address",
                "email",
                "phone",
                "country_code",
                "status"
            ],
            raw: true
        });

        const branchIds = branches.map((branch) => Number(branch.id));

        console.log("Branch IDs:", branchIds);

        // ---------------------------------------
        // ACTIVE CARDS + RECEPTIONISTS
        // ---------------------------------------

        const [
            active_stamp_cards,
            active_membership_cards,
            receptionist
        ] = await Promise.all([

            // ---------------------------------------
            // ACTIVE STAMP CARDS
            // ---------------------------------------

            Stampcard.findAll({
                where: {
                    merchant_id: merchant_id,
                    status: 1
                },
                raw: true
            }),

            // ---------------------------------------
            // ACTIVE MEMBERSHIP CARDS
            // ---------------------------------------

            MembershipCards.findAll({
                where: {
                    merchant_id: merchant_id
                },
                raw: true
            }),

            // ---------------------------------------
            // RECEPTIONISTS
            // ---------------------------------------

            Receptionist.findAll({
                where: {
                    merchant_id: merchant_id,
                    del_status: 0,
                    status: 1
                },
                order: [["id", "DESC"]],
                attributes: [
                    "id",
                    "rep_id",
                    "name",
                    "email",
                    "phone",
                    "country_code",
                    "branch_id",
                    [
                        Sequelize.literal(`
                            CASE
                                WHEN branch_id IS NULL THEN 0
                                ELSE 1
                            END
                        `),
                        "is_branch"
                    ]
                ],
                raw: true
            })
        ]);

        // ---------------------------------------
        // CUSTOMER CARD REPORTS
        // ---------------------------------------

        let stamp_card_issues = [];
        let stamp_log = [];
        let membership_card_issues = [];
        let customer_list = [];

        if (branchIds.length > 0) {

            // ---------------------------------------
            // GET STAMP + MEMBERSHIP CARDS
            // ---------------------------------------

            const [
                stampCards,
                membershipCards
            ] = await Promise.all([

                // ---------------------------------------
                // STAMP CARD ISSUES
                // ---------------------------------------

                CustomerCard.findAll({
                    where: {
                        branch_id: {
                            [Op.in]: branchIds
                        },
                        card_type: 1
                    },
                    raw: true
                }),

                // ---------------------------------------
                // MEMBERSHIP CARD ISSUES
                // ---------------------------------------

                CustomerCard.findAll({
                    where: {
                        branch_id: {
                            [Op.in]: branchIds
                        },
                        card_type: 2
                    },
                    raw: true
                })
            ]);

            stamp_card_issues = stampCards;
            membership_card_issues = membershipCards;

            // ---------------------------------------
            // CUSTOMER LIST
            // ---------------------------------------

            const customerIds = [
                ...new Set([
                    ...stampCards
                        .map((card) => card.customer_id)
                        .filter(Boolean),

                    ...membershipCards
                        .map((card) => card.customer_id)
                        .filter(Boolean)
                ])
            ];

            if (customerIds.length > 0) {
                customer_list = await Customer.findAll({
                    where: {
                        id: {
                            [Op.in]: customerIds
                        }
                    },
                    raw: true
                });
            }

            // ---------------------------------------
            // STAMP LOG
            // ---------------------------------------

            const stampCardIds = stampCards.map(
                (card) => Number(card.id)
            );

            if (stampCardIds.length > 0) {

                stamp_log = await CustomerStampLevel.findAll({
                    where: {
                        customer_card_id: {
                            [Op.in]: stampCardIds
                        },
                        status: 1
                    },
                    attributes: [
                        "id",
                        "customer_card_id",
                        "stamp_number",
                        "amt",
                        "paid_amt",
                        "discount",
                        "reward_type",
                        "category_id",
                        "status",
                        "role",
                        "role_id"
                    ],
                    order: [
                        ["stamp_number", "ASC"]
                    ],
                    raw: true
                });
            }
        }

        // ---------------------------------------
        // RECEPTIONIST STAMP REPORT
        // ---------------------------------------

        const receptionist_list = receptionist.map((rep) => {

            const repStampLogs = stamp_log.filter((log) => {
                return Number(log.role_id) === Number(rep.id);
            });

            const stamp_tot_amt = repStampLogs.reduce((total, log) => {
                return total + Number(log.paid_amt || 0);
            }, 0);

            return {
                ...rep,

                stamp_count: repStampLogs.length,

                stamp_tot_amt: stamp_tot_amt
            };
        });

        // ---------------------------------------
        // REPORT RESPONSE
        // ---------------------------------------

        return res.status(200).json({
            status: 1,
            message: "Successfully fetched",

            data: {
                id: merchant.id,

                // ---------------------------------------
                // BRANCHES
                // ---------------------------------------

                branch_count: branches.length,

                branch_list: branches,

                // ---------------------------------------
                // ACTIVE STAMP CARDS
                // ---------------------------------------

                active_stamp_card_count:
                    active_stamp_cards.length,

                active_stamp_card_list:
                    active_stamp_cards,

                // ---------------------------------------
                // ACTIVE MEMBERSHIP CARDS
                // ---------------------------------------

                active_membership_card_count:
                    active_membership_cards.length,

                active_membership_card_list:
                    active_membership_cards,

                // ---------------------------------------
                // STAMP CARD ISSUES
                // ---------------------------------------

                stamp_card_issue_count:
                    stamp_card_issues.length,

                stamp_card_issues:
                    stamp_card_issues,

                // ---------------------------------------
                // STAMP LOG
                // ---------------------------------------

                stamp_log_count:
                    stamp_log.length,

                stamp_log:
                    stamp_log,

                // ---------------------------------------
                // MEMBERSHIP CARD ISSUES
                // ---------------------------------------

                membership_card_issue_count:
                    membership_card_issues.length,

                membership_card_issues:
                    membership_card_issues,

                // ---------------------------------------
                // CUSTOMERS
                // ---------------------------------------

                customer_count:
                    customer_list.length,

                customer_list:
                    customer_list,

                // ---------------------------------------
                // RECEPTIONISTS
                // ---------------------------------------

                receptionist_count:
                    receptionist_list.length,

                receptionist_list:
                    receptionist_list
            }
        });

    } catch (err) {
        console.error("Report Error:", err);

        return res.status(500).json({
            status: 0,
            message: "Error while processing!",
            error: err.message
        });
    }
};