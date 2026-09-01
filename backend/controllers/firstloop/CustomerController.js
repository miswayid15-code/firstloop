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

        console.log("Link_customer req.body:", req.body);

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

                card_type: card_type

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
                            level.status
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

        // ---------------------------------------
        // 1. VALIDATION
        // ---------------------------------------

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


        // ---------------------------------------
        // 2. VALIDATE TYPE
        // ---------------------------------------

        if (![1, 2].includes(cardType)) {
            return res.status(400).json({
                status: 0,
                message: 'Invalid type. Use 1 for stamp card or 2 for membership card'
            });
        }


        // ---------------------------------------
        // 3. VALIDATE IDS
        // ---------------------------------------

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
                },

                // ---------------------------------
                // CUSTOMER STAMP LEVELS
                // ---------------------------------

                ...(cardType === 1
                    ? [
                        {
                            model: CustomerStampLevel,
                            as: "CustomerStampLevels",
                            required: false,

                            where: {
                                status: 1
                            },

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
        // 6. FORMAT CUSTOMER CARD
        // =======================================

        const customerCardJson =
            customerCardData.toJSON();


        // ---------------------------------------
        // FORMAT EXPIRY
        // ---------------------------------------

        customerCardJson.expires_at =
            formatExpiry(
                customerCardData.expires_at
            );


        // ---------------------------------------
        // CUSTOMER
        // ---------------------------------------

        customerCardJson.customer =
            customerCardData.Customer
                ? {
                    id: customerCardData.Customer.id,
                    name: customerCardData.Customer.name
                }
                : null;


        delete customerCardJson.Customer;


        // =======================================
        // 7. FORMAT IMAGES
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
        // 8. STAMP CARD
        // =======================================

        if (cardType === 1) {

            return res.status(200).json({

                status: 1,

                msg: "Stamp card details fetched successfully",

                data: {
                    ...customerCardJson,

                    stamp_levels:
                        customerCardJson.CustomerStampLevels || []
                }
            });
        }


        // =======================================
        // 9. MEMBERSHIP CARD
        // =======================================

        if (cardType === 2) {

            return res.status(200).json({

                status: 1,

                msg: "Membership card details fetched successfully",

                data: customerCardJson

            });
        }


    } catch (err) {

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