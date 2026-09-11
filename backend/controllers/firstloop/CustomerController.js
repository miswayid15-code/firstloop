const {
    Merchant,
    Coupon,
    RefreshToken,
    Branch,
    Receptionist,
    MerchantFp,
    Category,
    BranchTiming,
    Customer,
    SalePerson,
    UserNotificationToken,
    CouponApplied,
    Notification,
    Stampcard,
    StampLevel,
    CustomerCard,
    CustomerStampLevel,
    MembershipCards,
    db,
    sequelize
} = require('../../models');
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
const QRCode = require('qrcode');

// const mapFiles = require('../../helpers/merchantFileMapper');
const baseUrl = process.env.APP_URL;

const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const formatExpiry = (date) => {
    if (!date) {
        return null;
    }

    const expiryDate = new Date(date);

    const month = String(expiryDate.getUTCMonth() + 1).padStart(2, '0');
    const year = String(expiryDate.getUTCFullYear()).slice(-2);

    return `${month}/${year}`;
};
exports.check_customer = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email || email.trim() === "") {
            return res.status(400).json({
                status: 0,
                message: "Email is required"
            });
        }

        // Check customer
        const customer = await Customer.findOne({
            where: {
                email: email.trim(),
                del_status: 0
            },
            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'country_code',
            ],
        });

        if (!customer) {
            return res.status(200).json({
                status: 0,
                message: "Customer not found"
            });
        }

        return res.status(200).json({
            status: 1,
            message: "Customer found",
            data: customer
        });

    } catch (err) {
        console.log("check_customer error:", err);

        return res.status(500).json({
            status: 0,
            message: "Network Issues"
        });
    }
};


exports.Link_customer = async (req, res) => {

    const transaction = await sequelize.transaction();

    try {

        // console.log("Link_customer req.body:", req.body);

        const {
            cardType,
            cus_id,
            br_id,
            cardId,
            name,
            email,
            phone,
            country_code,
            password
        } = req.body;


        // --------------------------------------------------
        // 1. VALIDATION
        // --------------------------------------------------

        if (!cardType) {
            await transaction.rollback();

            return res.status(400).json({
                status: 0,
                message: 'cardType is required'
            });
        }

        if (!br_id) {
            await transaction.rollback();

            return res.status(400).json({
                status: 0,
                message: 'Branch ID is required'
            });
        }

        if (!cardId) {
            await transaction.rollback();

            return res.status(400).json({
                status: 0,
                message: 'Card ID is required'
            });
        }


        // --------------------------------------------------
        // 2. CARD TYPE
        // --------------------------------------------------
        let card_type;

        if (String(cardType).toLowerCase() === 'stamp') {

            card_type = 1;

        } else if (String(cardType).toLowerCase() === 'membership') {

            card_type = 2;

        } else {

            await transaction.rollback();

            return res.status(400).json({
                status: 0,
                message: 'Invalid cardType. Use stamp or membership'
            });
        }


        // --------------------------------------------------
        // 3. FIND / CREATE CUSTOMER
        // --------------------------------------------------

        let customer_id = cus_id ? Number(cus_id) : null;

        if (!customer_id) {

            if (!name || !phone || !password) {

                await transaction.rollback();

                return res.status(400).json({
                    status: 0,
                    message: 'Name, phone and password are required for new customer'
                });
            }


            const existingCustomer = await Customer.findOne({
                where: {
                    phone: phone
                },
                transaction
            });


            if (existingCustomer) {

                customer_id = existingCustomer.id;

            } else {

                const hashedPassword = await bcrypt.hash(
                    password,
                    10
                );


                const newCustomer = await Customer.create({

                    name: name,

                    email: email || null,

                    phone: phone,

                    country_code: country_code || null,

                    password: hashedPassword

                }, {
                    transaction
                });


                customer_id = newCustomer.id;
            }

        } else {

            const existingCustomer = await Customer.findByPk(
                customer_id,
                {
                    transaction
                }
            );


            if (!existingCustomer) {

                await transaction.rollback();

                return res.status(404).json({
                    status: 0,
                    message: `Customer with ID ${customer_id} not found`
                });
            }
        }


        // --------------------------------------------------
        // 4. VERIFY CUSTOMER
        // --------------------------------------------------

        const customer = await Customer.findByPk(
            customer_id,
            {
                transaction
            }
        );


        if (!customer) {

            await transaction.rollback();

            return res.status(404).json({
                status: 0,
                message: 'Customer not found'
            });
        }


        // --------------------------------------------------
        // 5. VERIFY BRANCH
        // --------------------------------------------------

        const branch = await Branch.findByPk(
            br_id,
            {
                transaction
            }
        );


        if (!branch) {

            await transaction.rollback();

            return res.status(404).json({
                status: 0,
                message: 'Branch not found'
            });
        }


        // --------------------------------------------------
        // 6. VERIFY MERCHANT CARD
        // --------------------------------------------------

        let merchantCard = null;
        let month = null;


        if (card_type === 1) {

            // Stamp Card

            merchantCard = await Stampcard.findByPk(
                cardId,
                {
                    transaction
                }
            );

        } else {

            // Membership Card

            merchantCard = await MembershipCards.findByPk(
                cardId,
                {
                    transaction
                }
            );
        }
        console.log("merchantCard:", merchantCard);


        if (!merchantCard) {

            await transaction.rollback();

            return res.status(404).json({
                status: 0,
                message: 'Card configuration not found'
            });
        }


        // --------------------------------------------------
        // 7. MEMBERSHIP VALIDITY
        // --------------------------------------------------

        if (card_type === 2) {

            month = parseInt(
                merchantCard.month,
                10
            );


            if (!month || month <= 0) {

                await transaction.rollback();

                return res.status(400).json({
                    status: 0,
                    message: 'Valid month is required for membership card'
                });
            }
        }


        // --------------------------------------------------
        // 8. CHECK DUPLICATE
        // --------------------------------------------------

        const existingCard = await CustomerCard.findOne({

            where: {

                merchant_card_id: cardId,

                customer_id: customer_id,

                branch_id: br_id,

                card_type: card_type,
                is_completed: 0

            },

            transaction

        });


        if (existingCard) {

            await transaction.rollback();

            return res.status(409).json({

                status: 0,

                message: 'Customer already has this card',

                data: existingCard

            });
        }


        // --------------------------------------------------
        // 9. GENERATE CARD NUMBER
        // --------------------------------------------------

        const card_number =
            'CARD-' +
            Date.now().toString() +
            '-' +
            crypto
                .randomBytes(3)
                .toString('hex')
                .toUpperCase();


        // --------------------------------------------------
        // 10. GENERATE QR TOKEN
        // --------------------------------------------------

        const qr_token = crypto
            .randomBytes(32)
            .toString('hex');


        // --------------------------------------------------
        // 11. EXPIRY DATE
        // --------------------------------------------------

        let expires_at = null;


        if (card_type === 2) {

            const expiryDate = new Date();

            expiryDate.setMonth(
                expiryDate.getMonth() + month
            );

            expires_at = expiryDate;
        }


        // --------------------------------------------------
        // 12. CUSTOMER CARD SNAPSHOT
        // --------------------------------------------------

        const customerCardData = {

            merchant_card_id: cardId,

            customer_id: customer_id,

            branch_id: br_id,

            card_type: card_type,


            // ----------------------------------------------
            // COMMON CARD DETAILS
            // ----------------------------------------------

            title:
                merchantCard.title || null,

            brand_name:
                merchantCard.brand_name || null,

            brand_image:
                merchantCard.brand_image || null,

            background_image:
                merchantCard.background_image || null,

            background_color:
                merchantCard.background_color || null,

            text_color:
                merchantCard.text_color || null,

            border_color:
                merchantCard.border_color || null,


            // ----------------------------------------------
            // STAMP CARD DETAILS
            // ----------------------------------------------

            number_of_stamps:
                card_type === 1
                    ? merchantCard.number_of_stamps || null
                    : null,

            stamp_radius:
                card_type === 1
                    ? merchantCard.stamp_radius || null
                    : null,

            stamp_background:
                card_type === 1
                    ? merchantCard.stamp_background || null
                    : null,

            stamp_border_color:
                card_type === 1
                    ? merchantCard.stamp_border_color || null
                    : null,

            stamp_text_color:
                card_type === 1
                    ? merchantCard.stamp_text_color || null
                    : null,


            // ----------------------------------------------
            // MEMBERSHIP CARD DETAILS
            // ----------------------------------------------

            month:
                card_type === 2
                    ? month
                    : null,


            // ----------------------------------------------
            // CUSTOMER CARD DETAILS
            // ----------------------------------------------

            card_number: card_number,

            qr_token: qr_token,

            current_stamp: 0,

            status: 1,

            issued_at: new Date(),

            expires_at: expires_at
        };


        // --------------------------------------------------
        // 13. CREATE CUSTOMER CARD
        // --------------------------------------------------

        const newCustomerCard =
            await CustomerCard.create(
                customerCardData,
                {
                    transaction
                }
            );


        // --------------------------------------------------
        // 14. COPY STAMP LEVELS
        // --------------------------------------------------

        if (card_type === 1) {

            const stampLevels =
                await StampLevel.findAll({

                    where: {

                        merchant_card_id: cardId,

                        status: 1
                    },

                    order: [
                        ['stamp_number', 'ASC']
                    ],

                    transaction
                });


            if (stampLevels.length > 0) {

                const customerStampLevels =
                    stampLevels.map(level => ({

                        customer_card_id:
                            newCustomerCard.id,

                        stamp_number:
                            level.stamp_number,

                        amt:
                            level.amt,

                        discount:
                            level.discount,

                        reward_type:
                            level.reward_type,

                        reward_text:
                            level.reward_text || null,

                        icon:
                            level.icon || null,

                        category_id:
                            level.category_id || null,

                        status:
                            0
                    }));


                await CustomerStampLevel.bulkCreate(

                    customerStampLevels,

                    {
                        transaction
                    }

                );
            }
        }


        // --------------------------------------------------
        // 15. COMMIT
        // --------------------------------------------------

        await transaction.commit();


        // --------------------------------------------------
        // 16. RESPONSE
        // --------------------------------------------------

        return res.status(201).json({

            status: 1,

            message: 'Card linked successfully',

            data: {

                customer_id:
                    customer_id,

                customer_card_id:
                    newCustomerCard.id,

                merchant_card_id:
                    cardId,

                branch_id:
                    br_id,

                card_type:
                    card_type,

                card_number:
                    newCustomerCard.card_number,

                qr_token:
                    newCustomerCard.qr_token,

                current_stamp:
                    newCustomerCard.current_stamp,

                issued_at:
                    newCustomerCard.issued_at,

                expires_at:
                    newCustomerCard.expires_at
            }
        });


    } catch (err) {

        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error(
                'Transaction rollback error:',
                rollbackError
            );
        }


        console.error(
            'Link_customer Error:',
            err
        );


        return res.status(500).json({

            status: 0,

            message: 'Something went wrong',

            error: err.message
        });
    }
};

exports.fetch_card = async (req, res) => {
    try {

        const { type, id, cus_id } = req.body;

        // =======================================
        // 1. VALIDATION
        // =======================================

        if (!type) {
            return res.status(400).json({
                status: 0,
                message: 'Type is required'
            });
        }

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: 'Customer Card ID is required'
            });
        }

        if (!cus_id) {
            return res.status(400).json({
                status: 0,
                message: 'Customer ID is required'
            });
        }

        const cardType = Number(type);
        const customerCardId = Number(id);
        const customerId = Number(cus_id);

        // =======================================
        // 2. VALIDATE TYPE
        // =======================================

        if (![1, 2].includes(cardType)) {
            return res.status(400).json({
                status: 0,
                message:
                    'Invalid type. Use 1 for stamp card or 2 for membership card'
            });
        }

        // =======================================
        // 3. VALIDATE IDS
        // =======================================

        if (
            !Number.isInteger(customerCardId) ||
            customerCardId <= 0
        ) {
            return res.status(400).json({
                status: 0,
                message: 'Invalid Customer Card ID'
            });
        }

        if (
            !Number.isInteger(customerId) ||
            customerId <= 0
        ) {
            return res.status(400).json({
                status: 0,
                message: 'Invalid Customer ID'
            });
        }

        // =======================================
        // 4. FETCH CUSTOMER CARD
        // =======================================

        const customerCardData = await CustomerCard.findOne({

            where: {
                id: customerCardId,
                customer_id: customerId,
                card_type: cardType
            },

            attributes: [
                "id",
                "merchant_card_id",
                "customer_id",
                "branch_id",
                "card_type",


                // ---------------------------------
                // CARD SNAPSHOT
                // ---------------------------------

                "title",
                "brand_name",
                "brand_image",

                "background_image",
                "background_color",
                "text_color",
                "border_color",

                // ---------------------------------
                // STAMP CARD SNAPSHOT
                // ---------------------------------

                "number_of_stamps",
                "stamp_radius",
                "stamp_background",
                "stamp_border_color",
                "stamp_text_color",

                // ---------------------------------
                // MEMBERSHIP CARD SNAPSHOT
                // ---------------------------------

                "month",

                // ---------------------------------
                // CUSTOMER CARD DETAILS
                // ---------------------------------

                "card_number",
                "qr_token",
                "current_stamp",
                "status",
                "is_completed",
                "issued_at",
                "expires_at"
            ],

            include: [

                // ===================================
                // CUSTOMER
                // ===================================

                {
                    model: Customer,
                    as: "Customer",
                    required: false,

                    attributes: [
                        "id",
                        "name"
                    ]
                },

                // ===================================
                // CUSTOMER STAMP LEVELS
                // ===================================

                ...(cardType === 1
                    ? [
                        {
                            model: CustomerStampLevel,
                            as: "CustomerStampLevels",
                            required: false,

                            // where: {
                            //     status: 1
                            // },

                            attributes: [
                                "id",
                                "customer_card_id",
                                "stamp_number",
                                "amt",
                                "discount",
                                "reward_type",
                                "reward_text",
                                "icon",
                                "category_id",
                                "status"
                            ]
                        }
                    ]
                    : [])
            ],

            order: cardType === 1
                ? [
                    [
                        {
                            model: CustomerStampLevel,
                            as: "CustomerStampLevels"
                        },
                        "stamp_number",
                        "ASC"
                    ]
                ]
                : undefined
        });

        // =======================================
        // 5. CUSTOMER DOES NOT HAVE THIS CARD
        // =======================================

        if (!customerCardData) {

            return res.status(200).json({

                status: 1,

                msg: cardType === 1
                    ? "Customer does not have this stamp card"
                    : "Customer does not have this membership card",

                data: []
            });
        }

        // =======================================
        // 6. CONVERT TO JSON
        // =======================================

        const customerCardJson =
            customerCardData.toJSON();

        // =======================================
        // 7. FORMAT EXPIRY
        // =======================================

        customerCardJson.expires_at =
            formatExpiry(
                customerCardData.expires_at
            );

        // =======================================
        // 8. FORMAT CUSTOMER
        // =======================================

        customerCardJson.customer =
            customerCardData.Customer
                ? {
                    id: customerCardData.Customer.id,
                    name: customerCardData.Customer.name
                }
                : null;

        delete customerCardJson.Customer;

        // =======================================
        // 9. FORMAT IMAGES
        // =======================================

        if (customerCardJson.brand_image) {

            customerCardJson.brand_image =
                baseUrl + '/' +
                customerCardJson.brand_image;
        }

        if (customerCardJson.background_image) {

            customerCardJson.background_image =
                baseUrl + '/' +
                customerCardJson.background_image;
        }

        // =======================================
        // 10. STAMP CARD
        // =======================================

        if (cardType === 1) {

            // ---------------------------------------
            // CURRENT STAMP
            // ---------------------------------------

            const currentStamp =
                Number(customerCardData.current_stamp) || 0;

            // ---------------------------------------
            // GET STAMP LEVELS
            // ---------------------------------------

            const stampLevels =
                customerCardJson.CustomerStampLevels || [];

            // ---------------------------------------
            // GET NEXT STAMP
            // ---------------------------------------

            const nextStampNumber =
                currentStamp + 1;

            // ---------------------------------------
            // GET NEXT STAMP REWARD
            // ---------------------------------------

            const latestReward =
                stampLevels.find(
                    (lvl) =>
                        Number(lvl.stamp_number) ===
                        nextStampNumber
                ) || null;

            // ---------------------------------------
            // CURRENT AMOUNT
            // ---------------------------------------

            const currentAmt =
                Number(latestReward?.amt) || 0;

            // ---------------------------------------
            // DISCOUNT %
            // ---------------------------------------

            const discountVal =
                Number(latestReward?.discount) || 0;

            // ---------------------------------------
            // REWARD TYPE
            // ---------------------------------------

            const rewardType =
                Number(
                    latestReward?.reward_type || 0
                );

            // ---------------------------------------
            // REWARD DESCRIPTION
            // ---------------------------------------

            const rewardText =
                latestReward?.reward_text || '';

            // ---------------------------------------
            // CALCULATE FINAL AMOUNT
            // ---------------------------------------

            let overallAmount = currentAmt;

            // reward_type = 2
            // Percentage Discount

            if (rewardType === 2) {

                const discountAmount =
                    (
                        currentAmt *
                        discountVal
                    ) / 100;

                overallAmount =
                    currentAmt -
                    discountAmount;
            }

            // ---------------------------------------
            // REMOVE ORIGINAL STAMP LEVEL FIELD
            // ---------------------------------------

            delete customerCardJson.CustomerStampLevels;

            // =======================================
            // STAMP CARD RESPONSE
            // =======================================

            return res.status(200).json({

                status: 1,

                msg:
                    "Stamp card details fetched successfully",

                data: {

                    ...customerCardJson,

                    // -------------------------------
                    // STAMP DETAILS
                    // -------------------------------

                    current_stamp:
                        currentStamp,

                    // -------------------------------
                    // AMOUNT DETAILS
                    // -------------------------------

                    current_amount:
                        Number(
                            overallAmount.toFixed(2)
                        ),

                    total_amount:
                        Number(
                            currentAmt.toFixed(2)
                        ),

                    discount_percentage:
                        Number(
                            discountVal.toFixed(2)
                        ),

                    // -------------------------------
                    // REWARD DETAILS
                    // -------------------------------

                    reward_type:
                        rewardType,

                    reward_text:
                        rewardText,

                    // -------------------------------
                    // STAMP LEVELS
                    // -------------------------------

                    stamp_levels:
                        stampLevels

                }
            });
        }

        // =======================================
        // 11. MEMBERSHIP CARD
        // =======================================

        if (cardType === 2) {

            return res.status(200).json({

                status: 1,

                msg:
                    "Membership card details fetched successfully",

                data: customerCardJson

            });
        }

    } catch (err) {

        // =======================================
        // ERROR LOG
        // =======================================

        console.error(
            'fetch_card Error:',
            err
        );

        return res.status(500).json({

            status: 0,

            message: 'Something went wrong',

            error: err.message

        });
    }
};

exports.get_branch_cus = async (req, res) => {
    try {

        const { br_id } = req.body;

        // ---------------------------------------
        // 1. VALIDATION
        // ---------------------------------------

        if (!br_id) {
            return res.status(400).json({
                status: 0,
                message: 'Branch ID is required'
            });
        }

        const branchId = Number(br_id);

        if (!Number.isInteger(branchId) || branchId <= 0) {
            return res.status(400).json({
                status: 0,
                message: 'Invalid Branch ID'
            });
        }

        // ---------------------------------------
        // 2. GET CUSTOMER CARDS
        // ---------------------------------------

        const customer_cards = await CustomerCard.findAll({
            where: {
                branch_id: branchId
            },

            attributes: [
                "id",
                "customer_id",
                "card_number",
                "card_type",
                "title",
                "current_stamp",
                "number_of_stamps",
                "is_completed",
            ],

            order: [
                ["id", "DESC"]
            ]
        });

        // ---------------------------------------
        // 3. GET UNIQUE CUSTOMER IDS
        // ---------------------------------------

        const customerIds = [
            ...new Set(
                customer_cards
                    .map(card => card.customer_id)
                    .filter(id => id)
            )
        ];

        // ---------------------------------------
        // 4. NO CUSTOMERS
        // ---------------------------------------

        if (customerIds.length === 0) {
            return res.status(200).json({
                status: 1,
                message: 'No customers found for this branch',
                data: []
            });
        }

        // ---------------------------------------
        // 5. GET ACTIVE CUSTOMERS
        // ---------------------------------------

        const customers = await Customer.findAll({

            where: {
                id: {
                    [Op.in]: customerIds
                },

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
            ],

            order: [
                ["id", "DESC"]
            ]
        });

        // ---------------------------------------
        // 6. GROUP CARDS BY CUSTOMER
        // ---------------------------------------

        const cardsByCustomer = {};

        customer_cards.forEach(card => {

            const cardData = card.toJSON();

            if (!cardsByCustomer[card.customer_id]) {
                cardsByCustomer[card.customer_id] = [];
            }

            cardsByCustomer[card.customer_id].push(cardData);
        });

        // ---------------------------------------
        // 7. FORMAT CUSTOMER DATA
        // ---------------------------------------

        const customerData = customers.map(customer => {

            const data = customer.toJSON();

            // Profile image
            data.profile_image = data.profile_image
                ? baseUrl + '/' + data.profile_image
                : null;

            // Customer cards
            data.cards = cardsByCustomer[data.id] || [];

            return data;
        });

        // ---------------------------------------
        // 8. RESPONSE
        // ---------------------------------------

        return res.status(200).json({

            status: 1,

            message: 'Customers fetched successfully',

            data: customerData
        });

    } catch (err) {

        console.error(
            'get_branch_cus Error:',
            err
        );

        return res.status(500).json({

            status: 0,

            message: 'Something went wrong',

            error: err.message
        });
    }
};
exports.get_rep_cus = async (req, res) => {
    try {

        // ---------------------------------------
        // 1. GET RECEPTIONIST ID
        // ---------------------------------------

        const rep_id = req.user?.id;

        if (!rep_id) {
            return res.status(400).json({
                status: 0,
                message: "Issues with Authorization"
            });
        }

        // ---------------------------------------
        // 2. GET BRANCH ID
        // ---------------------------------------

        const { br_id } = req.body;

        if (!br_id) {
            return res.status(400).json({
                status: 0,
                message: "Branch ID is required"
            });
        }

        const branchId = Number(br_id);

        if (!Number.isInteger(branchId) || branchId <= 0) {
            return res.status(400).json({
                status: 0,
                message: "Invalid Branch ID"
            });
        }

        // ---------------------------------------
        // 3. GET RECEPTIONIST
        // ---------------------------------------

        const receptionist = await Receptionist.findByPk(rep_id, {
            attributes: [
                "merchant_id"
            ]
        });

        if (!receptionist) {
            return res.status(404).json({
                status: 0,
                message: "Receptionist not found"
            });
        }

        const mer_id = receptionist.merchant_id;

        // ---------------------------------------
        // 4. GET STAMP CARDS
        // ---------------------------------------

        const stamp_cards = await Stampcard.findAll({
            where: {
                merchant_id: mer_id
            },

            attributes: [
                "id",
                "branch_ids"
            ]
        });

        // ---------------------------------------
        // 5. GET MATCHING STAMP CARD IDS
        // ---------------------------------------

        const matchingStampCardIds = [];

        stamp_cards.forEach(stampCard => {

            let branch_ids = stampCard.branch_ids;

            if (typeof branch_ids === "string") {

                branch_ids = branch_ids
                    .replace(/[{}]/g, "")
                    .split(",")
                    .map(id => Number(id.trim()))
                    .filter(id => Number.isInteger(id));

            } else if (Array.isArray(branch_ids)) {

                branch_ids = branch_ids
                    .map(id => Number(id))
                    .filter(id => Number.isInteger(id));

            } else {
                branch_ids = [];
            }

            if (branch_ids.includes(branchId)) {
                matchingStampCardIds.push(stampCard.id);
            }
        });

        // ---------------------------------------
        // 6. GET CUSTOMER CARDS
        // ---------------------------------------

        const customerCardConditions = [
            {
                branch_id: branchId
            }
        ];

        if (matchingStampCardIds.length > 0) {

            customerCardConditions.push({
                merchant_card_id: {
                    [Op.in]: matchingStampCardIds
                }
            });
        }

        const customer_cards = await CustomerCard.findAll({

            where: {
                [Op.or]: customerCardConditions
            },

            attributes: [
                "id",
                "customer_id",
                "card_number",
                "card_type",
                "title",
                "current_stamp",
                "number_of_stamps",
                "is_completed",
                "merchant_card_id",
                "branch_id"
            ],

            order: [
                ["id", "DESC"]
            ]
        });

        // ---------------------------------------
        // 7. GET UNIQUE CUSTOMER IDS
        // ---------------------------------------

        const customerIds = [
            ...new Set(
                customer_cards
                    .map(card => card.customer_id)
                    .filter(id => id)
            )
        ];

        console.log("Customer IDs:", customerIds);

        // ---------------------------------------
        // 8. NO CUSTOMERS
        // ---------------------------------------

        if (customerIds.length === 0) {
            return res.status(200).json({
                status: 1,
                message: "No customers found for this branch",
                data: []
            });
        }

        // ---------------------------------------
        // 9. GET ACTIVE CUSTOMERS
        // ---------------------------------------

        const customers = await Customer.findAll({

            where: {
                id: {
                    [Op.in]: customerIds
                },

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
            ],

            order: [
                ["id", "DESC"]
            ]
        });

        // ---------------------------------------
        // 10. GET UNIQUE BRANCH IDS
        // ---------------------------------------

        const branchIds = [
            ...new Set(
                customer_cards
                    .map(card => card.branch_id)
                    .filter(id => id)
                    .map(id => Number(id))
            )
        ];

        // ---------------------------------------
        // 11. GET BRANCH NAMES
        // ---------------------------------------

        const branches = await Branch.findAll({
            where: {
                id: {
                    [Op.in]: branchIds
                }
            },

            attributes: [
                "id",
                "name"
            ]
        });

        // ---------------------------------------
        // 12. CREATE BRANCH NAME MAP
        // ---------------------------------------

        const branchMap = {};

        branches.forEach(branch => {

            branchMap[branch.id] = branch.name;

        });

        // ---------------------------------------
        // 13. GROUP CARDS BY CUSTOMER
        // ---------------------------------------

        const cardsByCustomer = {};

        customer_cards.forEach(card => {

            const cardData = card.toJSON();

            // Add branch name
            cardData.branch_name = branchMap[cardData.branch_id] || null;

            if (!cardsByCustomer[card.customer_id]) {
                cardsByCustomer[card.customer_id] = [];
            }

            cardsByCustomer[card.customer_id].push(cardData);
        });

        // ---------------------------------------
        // 14. FORMAT CUSTOMER DATA
        // ---------------------------------------

        const customerData = customers.map(customer => {

            const data = customer.toJSON();

            // Profile image
            data.profile_image = data.profile_image
                ? baseUrl + "/" + data.profile_image
                : null;

            // Customer cards
            data.cards = cardsByCustomer[data.id] || [];

            return data;
        });

        // ---------------------------------------
        // 15. RESPONSE
        // ---------------------------------------

        return res.status(200).json({

            status: 1,

            message: "Customers fetched successfully",

            data: customerData

        });

    } catch (err) {

        console.error(
            "get_rep_cus Error:",
            err
        );

        return res.status(500).json({

            status: 0,

            message: "Something went wrong",

            error: err.message

        });
    }
};

exports.get_merchant_customers = async (req, res) => {
    try {
        const { mer_id } = req.body;

        if (!mer_id) {
            return res.status(400).json({
                status: 0,
                message: 'Merchant ID is required'
            });
        }

        const branch_ids = await Branch.findAll({
            where: {
                merchant_id: mer_id,
                status: 1,
                del_status: 0
            },
            attributes: ['id'],
            raw: true
        });

        if (!branch_ids.length) {
            return res.status(404).json({
                status: 0,
                message: 'No branches found for this merchant',
                data: []
            });
        }

        // Convert branch IDs to numbers
        const branchIds = branch_ids.map(branch => Number(branch.id));

        // Validate branch IDs
        if (branchIds.some(id => !Number.isInteger(id) || id <= 0)) {
            return res.status(400).json({
                status: 0,
                message: 'Invalid Branch ID'
            });
        }

        // console.log("Branch IDs:", branchIds);

        // ---------------------------------------
        // GET ALL CUSTOMER CARDS IN ONE QUERY
        // ---------------------------------------

        const customer_cards = await CustomerCard.findAll({
            where: {
                branch_id: {
                    [Op.in]: branchIds
                }
            },
            attributes: [
                "id",
                "customer_id",
                "card_number",
                "card_type",
                "title",
                "branch_id",
                "is_completed"
            ],
            order: [
                ["id", "DESC"]
            ],
            raw: true
        });

        // ---------------------------------------
        // GET UNIQUE CUSTOMER IDS
        // ---------------------------------------

        const customerIds = [
            ...new Set(
                customer_cards
                    .map(card => card.customer_id)
                    .filter(Boolean)
            )
        ];

        if (!customerIds.length) {
            return res.status(200).json({
                status: 1,
                message: 'No customers found for this merchant',
                data: []
            });
        }

        // ---------------------------------------
        // GET ALL CUSTOMERS IN ONE QUERY
        // ---------------------------------------

        const customers = await Customer.findAll({
            where: {
                id: {
                    [Op.in]: customerIds
                },
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
            ],
            order: [
                ["id", "DESC"]
            ],
            raw: true
        });

        // ---------------------------------------
        // GROUP CARDS BY CUSTOMER
        // ---------------------------------------

        const cardsByCustomer = {};

        for (const card of customer_cards) {

            if (!cardsByCustomer[card.customer_id]) {
                cardsByCustomer[card.customer_id] = [];
            }

            cardsByCustomer[card.customer_id].push(card);
        }

        // ---------------------------------------
        // FORMAT CUSTOMER DATA
        // ---------------------------------------

        const customerData = customers.map(customer => {

            customer.profile_image = customer.profile_image
                ? baseUrl + '/' + customer.profile_image
                : null;

            customer.cards = cardsByCustomer[customer.id] || [];

            return customer;
        });

        // ---------------------------------------
        // RESPONSE
        // ---------------------------------------

        return res.status(200).json({
            status: 1,
            message: 'Customers fetched successfully',
            data: customerData
        });

    } catch (err) {

        console.error('get_merchant_customers Error:', err);

        return res.status(500).json({
            status: 0,
            message: 'Something went wrong',
            error: err.message
        });
    }
};

exports.stamp_paid = async (req, res) => {
    const transaction = await CustomerCard.sequelize.transaction();

    try {
        const {
            cus_id,
            card_id,
            payment_type,
            amount,
            stamp_level_id
        } = req.body;



        if (!cus_id || !card_id || !stamp_level_id) {
            await transaction.rollback();

            return res.status(400).json({
                status: 0,
                message: "Customer ID, Card ID, and Stamp Level ID are required"
            });
        }

        if (amount === undefined || amount === null || amount === '') {
            await transaction.rollback();

            return res.status(400).json({
                status: 0,
                message: "Amount is required"
            });
        }

        if (!payment_type) {
            await transaction.rollback();

            return res.status(400).json({
                status: 0,
                message: "Payment type is required"
            });
        }

        if (![1, 2].includes(Number(payment_type))) {
            await transaction.rollback();

            return res.status(400).json({
                status: 0,
                message: "Invalid payment type. Use 1 for Cash or 2 for Online"
            });
        }

        const user = req.merchant || req.receptionist;

        const userType = req.merchant
            ? 'merchant'
            : 'receptionist';
        const user_id = user.id;
        const customerId = Number(cus_id);
        const cardId = Number(card_id);
        const paidAmount = Number(amount);

        if (!Number.isFinite(paidAmount) || paidAmount < 0) {
            await transaction.rollback();

            return res.status(400).json({
                status: 0,
                message: "Invalid amount"
            });
        }



        const customer_card = await CustomerCard.findOne({
            where: {
                id: cardId,
                customer_id: customerId
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!customer_card) {
            await transaction.rollback();

            return res.status(404).json({
                status: 0,
                message: "Customer card not found"
            });
        }



        if (Number(customer_card.card_type) !== 1) {
            await transaction.rollback();

            return res.status(400).json({
                status: 0,
                message: "This action is only available for stamp cards"
            });
        }



        if (Number(customer_card.is_completed) !== 0) {
            await transaction.rollback();

            return res.status(400).json({
                status: 400,
                message: "The stamp card is already completed"
            });
        }

        // ---------------------------------------
        // 5. CURRENT STAMP
        // ---------------------------------------

        const currentStamp = Number(
            customer_card.current_stamp || 0
        );

        const nextStamp = currentStamp + 1;

        // ---------------------------------------
        // 6. FIND CURRENT STAMP LEVEL
        // ---------------------------------------

        const whereCondition = {
            customer_card_id: cardId,
            stamp_number: nextStamp,
            status: 0
        };

        // If stamp_level_id is provided
        if (stamp_level_id) {
            whereCondition.id = Number(stamp_level_id);
        }

        const stamp_level = await CustomerStampLevel.findOne({
            where: whereCondition,
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        // console.log("stamp_level:", stamp_level?.toJSON());
        // console.log("whereCondition:", whereCondition);
        const checkLevel = await CustomerStampLevel.findOne({
            where: {
                id: Number(stamp_level_id)
            },
            raw: true
        });

        console.log("STAMP LEVEL BY ID:", checkLevel);
        if (!stamp_level) {
            await transaction.rollback();

            return res.status(404).json({
                status: 0,
                message: `Stamp level ${currentStamp} is already completed`
            });
        }

        // ---------------------------------------
        // 7. VALIDATE REWARD TYPE
        // ---------------------------------------

        const rewardType = String(
            stamp_level.reward_type
        );

        // 1 = Free
        // 2 = Discount
        // 3 = Paid

        if (!['1', '2', '3'].includes(rewardType)) {
            await transaction.rollback();

            return res.status(400).json({
                status: 0,
                message: "This stamp level does not require payment"
            });
        }

        // ---------------------------------------
        // 8. VALIDATE AMOUNT
        // ---------------------------------------

        const requiredAmount = Number(stamp_level.amt || 0);
        const discount = Number(stamp_level.discount || 0);

        const finalAmount = requiredAmount - (
            requiredAmount * discount / 100
        );
        if (finalAmount !== paidAmount) {
            await transaction.rollback();

            return res.status(400).json({
                status: 0,
                message: `Invalid amount. Required amount is ${finalAmount}`
            });
        }

        // ---------------------------------------
        // 9. UPDATE CUSTOMER CARD
        // ---------------------------------------

        const totalStamps = Number(
            customer_card.number_of_stamps || 0
        );

        const updatedStamp = nextStamp;

        const isCompleted =
            totalStamps > 0 &&
            updatedStamp >= totalStamps;

        await customer_card.update(
            {
                current_stamp: updatedStamp,
                is_completed: isCompleted ? 1 : 0
            },
            {
                transaction
            }
        );

        // ---------------------------------------
        // 10. UPDATE STAMP LEVEL
        // ---------------------------------------

        await CustomerStampLevel.update(
            {
                status: 1,
                paid_amt: paidAmount,
                payment_type: String(payment_type),
                payment_status: 1,
                paid_date: new Date(),
                role: userType,
                role_id: user_id
            },
            {
                where: {
                    id: stamp_level.id,
                    customer_card_id: cardId
                },
                transaction
            }
        );

        // ---------------------------------------
        // 11. COMMIT
        // ---------------------------------------

        await transaction.commit();

        // ---------------------------------------
        // 12. RESPONSE
        // ---------------------------------------

        return res.status(200).json({
            status: 1,
            message: "Paid stamp processed successfully",
            data: {
                card_id: customer_card.id,
                customer_id: customer_card.customer_id,
                stamp_level_id: stamp_level.id,
                stamp_number: updatedStamp,
                reward_type: Number(stamp_level.reward_type),
                amount: paidAmount,
                payment_type: Number(payment_type),
                is_completed: isCompleted ? 1 : 0
            }
        });

    } catch (err) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error("Rollback Error:", rollbackError);
        }

        console.error("stamp_paid Error:", err);

        return res.status(500).json({
            status: 0,
            message: "Something went wrong",
            error: err.message
        });
    }
};

exports.get_customer_details = async (req, res) => {
    try {
        const { customer_id, branch_id } = req.body;

        // ---------------------------------
        // CUSTOMER VALIDATION
        // ---------------------------------

        const customer = await Customer.findByPk(customer_id, {
            attributes: [
                "id",
                "name",
                "email",
                "phone",
                "country_code",
                "profile_image"
            ]
        });

        if (!customer) {
            return res.status(404).json({
                status: 0,
                message: 'Customer not found'
            });
        }

        // ---------------------------------
        // FETCH CUSTOMER CARDS
        // ---------------------------------
        const cardWhere = {
            customer_id: customer_id
        };
        if (
            branch_id !== undefined &&
            branch_id !== null &&
            branch_id !== ''
        ) {
            cardWhere.branch_id = branch_id;
        }
        const customerCards = await CustomerCard.findAll({
            where: cardWhere,
            attributes: [
                "id",
                "merchant_card_id",
                "customer_id",
                "branch_id",
                "card_type",

                // CARD SNAPSHOT
                "title",
                "brand_name",
                "brand_image",
                "background_image",
                "background_color",
                "text_color",
                "border_color",

                // STAMP CARD SNAPSHOT
                "number_of_stamps",
                "stamp_radius",
                "stamp_background",
                "stamp_border_color",
                "stamp_text_color",

                // MEMBERSHIP CARD SNAPSHOT
                "month",

                // CUSTOMER CARD DETAILS
                "card_number",
                "qr_token",
                "current_stamp",
                "status",
                "is_completed",
                "issued_at",
                "expires_at"
            ],

            include: [
                {
                    model: Customer,
                    as: "Customer",
                    required: false,
                    attributes: [
                        "id",
                        "name"
                    ]
                }, {
                    model: Branch,
                    as: "Branch",
                    required: false,
                    attributes: [
                        "id",
                        "name"
                    ]
                }
            ]
        });

        const stamp_card = [];
        const membership_card = [];
        for (card of customerCards) {
            const cardData = card.toJSON();

            if (cardData.brand_image) {
                cardData.brand_image = baseUrl + '/' + cardData.brand_image;
            }
            if (cardData.background_image) {
                cardData.background_image = baseUrl + '/' + cardData.background_image;
            }
            if (Number(cardData.card_type) === 1) {
                const stampLevels = await CustomerStampLevel.findAll({
                    where: {
                        customer_card_id: cardData.id
                    },
                    attributes: [
                        "id",
                        "customer_card_id",
                        "stamp_number",
                        "amt",
                        "paid_amt",
                        "discount",
                        "reward_type",
                        "reward_text",
                        "icon",
                        "category_id",
                        "status"
                    ],
                    order: [
                        ["stamp_number", "ASC"]
                    ]
                })
                cardData.CustomerStampLevels = stampLevels;
                stamp_card.push(cardData);
            }
            else {
                cardData.expires_at =
                    formatExpiry(
                        cardData.expires_at
                    );
                membership_card.push(cardData);
            }
        }
        if (customer.profile_image) {
            customer.profile_image = baseUrl + '/' + customer.profile_image;
        }

        // ===================================
        // RESPONSE
        // ===================================

        const total_spend = stamp_card.reduce((cardTotal, card) => {
            const cur_st = Number(card.current_stamp || 0);
            const levels = card.CustomerStampLevels || [];
            return cardTotal + levels.reduce((tot, lel) => {
                if (Number(lel.stamp_number) <= cur_st) {
                    return tot + Number(lel.paid_amt || 0)
                }
                return tot;
            }, 0)
        }, 0)



        return res.status(200).json({
            status: 1,
            message: 'Customer details fetched successfully',
            data: {
                customer: customer,
                total_spend: total_spend,
                total_stamps_card: stamp_card.length,
                total_membership_card: membership_card.length,
                stamp_card: stamp_card,
                membership_card: membership_card
            }
        });

    } catch (err) {
        console.error(
            'get_customer_details Error:',
            err
        );

        return res.status(500).json({
            status: 0,
            message: 'Something went wrong',
            error: err.message
        });
    }
};

exports.get_customer_card_details = async (req, res) => {
    try {
        const { card_id } = req.body;

        if (!card_id) {
            return res.status(400).json({
                status: 0,
                message: "Card ID is required"
            });
        }

        const customerCard = await CustomerCard.findByPk(card_id, {
            include: [
                {
                    model: Customer,
                    as: 'Customer',
                    attributes: [
                        'id',
                        'name',
                        'email',
                        'phone',
                        'country_code'
                    ]
                },
                {
                    model: CustomerStampLevel,
                    as: 'CustomerStampLevels',
                    separate: true,
                    order: [['stamp_number', 'ASC']]
                }
            ]
        });

        if (!customerCard) {
            return res.status(404).json({
                status: 0,
                message: 'Customer card not found'
            });
        }

        // ---------------------------------------
        // CUSTOMER DETAILS
        // ---------------------------------------

        const customer = customerCard.Customer;

        // ---------------------------------------
        // STAMP HISTORY
        // ---------------------------------------

        const stampHistory = (
            customerCard.CustomerStampLevels || []
        ).map(level => {

            const rewardType = Number(level.reward_type);

            let rewardTypeText = 'Free';

            if (rewardType === 2) {
                rewardTypeText = 'Discount';
            } else if (rewardType === 3) {
                rewardTypeText = 'Paid';
            }

            let paymentTypeText = null;

            if (Number(level.payment_type) === 1) {
                paymentTypeText = 'Cash';
            } else if (Number(level.payment_type) === 2) {
                paymentTypeText = 'Online';
            }

            const amt = Number(level.amt || 0);
            const discount = Number(level.discount || 0);
            const paidAmt = Number(level.paid_amt || 0);

            // Calculate payable amount for discount reward
            let payableAmount = 0;

            if (rewardType === 2) {
                payableAmount =
                    amt - ((amt * discount) / 100);
            } else if (rewardType === 3) {
                payableAmount = paidAmt;
            }

            return {
                id: level.id,
                stamp_number: level.stamp_number,

                reward_type: rewardType,
                reward_type_text: rewardTypeText,

                reward_text: level.reward_text,
                icon: level.icon,
                category_id: level.category_id,

                // Stamp amount
                amt: amt,

                // Discount details
                discount: discount,

                // Paid reward details
                paid_amt: paidAmt,
                payment_type: level.payment_type,
                payment_date: level.paid_date,
                payment_type_text: paymentTypeText,

                // Final amount customer needs to pay
                payable_amount: payableAmount,

                status: Number(level.status),

                created_at: level.created_at,
                updated_at: level.updated_at
            };
        });

        // ---------------------------------------
        // SUMMARY
        // ---------------------------------------

        const totalStamps = stampHistory.length;

        const completedStamps = stampHistory.filter(
            level => Number(level.status) === 1
        ).length;

        const freeStamps = stampHistory.filter(
            level => Number(level.reward_type) === 1 &&
                Number(level.status) === 1
        ).length;

        const discountStamps = stampHistory.filter(
            level => Number(level.reward_type) === 2 &&
                Number(level.status) === 1
        ).length;

        const paidStamps = stampHistory.filter(
            level => Number(level.reward_type) === 3 &&
                Number(level.status) === 1
        ).length;

        const totalPaidAmount = stampHistory
            .filter(level =>
                [2, 3].includes(Number(level.reward_type)) &&
                Number(level.status) === 1
            )
            .reduce(
                (total, level) =>
                    total + Number(level.payable_amount || 0),
                0
            );

        // ---------------------------------------
        // RESPONSE
        // ---------------------------------------

        return res.status(200).json({
            status: 1,
            message: 'Customer card details fetched successfully',

            data: {
                // Customer
                customer: customer
                    ? {
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                        phone: customer.phone,
                        country_code: customer.country_code
                    }
                    : null,

                // Card
                card: {
                    id: customerCard.id,
                    customer_id: customerCard.customer_id,
                    card_type: customerCard.card_type,
                    current_stamp: customerCard.current_stamp,
                    is_completed: customerCard.is_completed,
                    status: customerCard.status
                },

                // Summary
                summary: {
                    total_stamps: totalStamps,
                    completed_stamps: completedStamps,
                    free_stamps: freeStamps,
                    discount_stamps: discountStamps,
                    paid_stamps: paidStamps,
                    total_paid_amount: totalPaidAmount
                },

                // Full history
                stamp_history: stampHistory
            }
        });

    } catch (err) {
        console.error(
            'get_customer_card_details Error:',
            err
        );

        return res.status(500).json({
            status: 0,
            message: 'Something went wrong',
            error: err.message
        });
    }
};


