const { Merchant, Coupon, RefreshToken, Branch, Receptionist, MerchantFp, Category, BranchTiming, Customer, SalePerson, UserNotificationToken, CouponApplied, Notification, Stampcard, StampLevel, CustomerCard, MembershipCards, db } = require('../../models');
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
    try {

        let {
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
            return res.status(400).json({
                status: 0,
                message: 'cardType is required'
            });
        }

        if (!br_id) {
            return res.status(400).json({
                status: 0,
                message: 'Branch ID is required'
            });
        }

        if (!cardId) {
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
                return res.status(400).json({
                    status: 0,
                    message: 'Name, phone and password are required for new customer'
                });
            }

            // Check existing customer by phone
            const existingCustomer = await Customer.findOne({
                where: {
                    phone: phone
                }
            });

            if (existingCustomer) {

                customer_id = existingCustomer.id;

            } else {

                const hashedPassword = await bcrypt.hash(password, 10);

                const newCustomer = await Customer.create({
                    name: name,
                    email: email || null,
                    phone: phone,
                    country_code: country_code || null,
                    password: hashedPassword
                });

                customer_id = newCustomer.id;
            }

        } else {

            // cus_id was supplied, so verify it exists
            const existingCustomer = await Customer.findByPk(customer_id);

            if (!existingCustomer) {
                return res.status(404).json({
                    status: 0,
                    message: `Customer with ID ${customer_id} not found`
                });
            }
        }

        // --------------------------------------------------
        // 4. VERIFY CUSTOMER
        // --------------------------------------------------

        const customer = await Customer.findByPk(customer_id);

        if (!customer) {
            return res.status(404).json({
                status: 0,
                message: 'Customer not found'
            });
        }


        // --------------------------------------------------
        // 5. VERIFY BRANCH
        // --------------------------------------------------

        const branch = await Branch.findByPk(br_id);

        if (!branch) {
            return res.status(404).json({
                status: 404,
                message: 'Branch not found'
            });
        }


        // --------------------------------------------------
        // 6. VERIFY CARD
        // --------------------------------------------------

        let merchantCard;
        let month;

        if (card_type === 1) {

            merchantCard = await Stampcard.findByPk(cardId);

        } else {

            merchantCard = await MembershipCards.findByPk(cardId);
            month = merchantCard.month;
        }

        if (!merchantCard) {
            return res.status(404).json({
                status: 0,
                message: 'Card configuration not found'
            });
        }


        // --------------------------------------------------
        // 7. CHECK DUPLICATE CUSTOMER CARD
        // --------------------------------------------------

        const existingCard = await CustomerCard.findOne({
            where: {
                merchant_card_id: cardId,
                customer_id: customer_id,
                branch_id: br_id,
                card_type: card_type
            }
        });

        if (existingCard) {
            return res.status(409).json({
                status: 0,
                message: 'Customer already has this card',
                data: existingCard
            });
        }


        // --------------------------------------------------
        // 8. GENERATE CARD NUMBER
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
        // 9. GENERATE QR TOKEN
        // --------------------------------------------------

        const qr_token = crypto
            .randomBytes(32)
            .toString('hex');


        // --------------------------------------------------
        // 10. EXPIRY DATE
        // --------------------------------------------------

        let expires_at = null;

        // Membership card only
        if (card_type === 2) {

            const validityMonths = parseInt(month, 10);

            if (!validityMonths || validityMonths <= 0) {
                return res.status(400).json({
                    status: 0,
                    message: 'Valid month is required for membership card'
                });
            }

            const expiryDate = new Date();

            expiryDate.setMonth(
                expiryDate.getMonth() + validityMonths
            );

            expires_at = expiryDate;
        }


        // --------------------------------------------------
        // 11. INITIAL STAMP
        // --------------------------------------------------

        const current_stamp = 0;


        // --------------------------------------------------
        // 12. CREATE CUSTOMER CARD
        // --------------------------------------------------


        const newCustomerCard = await CustomerCard.create({

            merchant_card_id: cardId,

            customer_id: customer_id,

            branch_id: br_id,

            card_type: card_type,

            card_number: card_number,

            qr_token: qr_token,

            current_stamp: current_stamp,

            status: 1,

            issued_at: new Date(),

            expires_at: expires_at
        });


        // --------------------------------------------------
        // 13. RESPONSE
        // --------------------------------------------------

        return res.status(201).json({

            status: 1,

            message: 'Card linked successfully',

            data: {

                customer_id: customer_id,

                customer_card_id: newCustomerCard.id,

                merchant_card_id: cardId,

                branch_id: br_id,

                card_type: card_type,

                card_number: newCustomerCard.card_number,

                qr_token: newCustomerCard.qr_token,

                current_stamp: newCustomerCard.current_stamp,

                issued_at: newCustomerCard.issued_at,

                expires_at: newCustomerCard.expires_at
            }
        });

    } catch (err) {

        console.error('Link_customer Error:', err);

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
        // VALIDATION
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
                message: 'Card ID is required'
            });
        }

        if (!cus_id) {
            return res.status(400).json({
                status: 0,
                message: 'Customer ID is required'
            });
        }

        const cardType = Number(type);
        const customerId = Number(cus_id);
        const cardId = Number(id);

        // =======================================
        // VERIFY CUSTOMER
        // =======================================

        const customer = await Customer.findByPk(customerId);

        if (!customer) {
            return res.status(404).json({
                status: 0,
                message: 'Customer not found'
            });
        }


        // =======================================
        // STAMP CARD
        // =======================================

        if (cardType === 1) {

            // ---------------------------------------
            // FETCH STAMP CARD
            // ---------------------------------------

            const stampcard = await Stampcard.findOne({
                where: {
                    id: cardId
                },

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
            // NO STAMP CARD
            // ---------------------------------------

            if (!stampcard) {
                return res.status(200).json({
                    status: 1,
                    msg: "No stamp card found",
                    data: []
                });
            }


            // ---------------------------------------
            // FETCH CUSTOMER CARD
            // ---------------------------------------

            const customerCardData = await CustomerCard.findOne({
                where: {
                    merchant_card_id: cardId,
                    customer_id: customerId,
                    card_type: 1
                },

                attributes: [
                    "id",
                    "customer_id",
                    "branch_id",
                    "card_type",
                    "card_number",
                    "qr_token",
                    "current_stamp",
                    "status",
                    "issued_at",
                    "expires_at"
                ]
            });


            // ---------------------------------------
            // FORMAT DATA
            // ---------------------------------------

            const cardData = stampcard.toJSON();

            const data = {

                ...cardData,

                brand_image: cardData.brand_image
                    ? baseUrl + '/' + cardData.brand_image
                    : null,

                background_image: cardData.background_image
                    ? baseUrl + '/' + cardData.background_image
                    : null,

                customer_card: customerCardData
                    ? customerCardData.toJSON()
                    : null

            };


            // ---------------------------------------
            // RESPONSE
            // ---------------------------------------

            return res.status(200).json({

                status: 1,

                msg: "Stamp card details fetched successfully",

                data

            });

        }


        // =======================================
        // MEMBERSHIP CARD
        // =======================================

        else if (cardType === 2) {

            // ---------------------------------------
            // FETCH MEMBERSHIP CARD
            // ---------------------------------------

            const membershipCard = await MembershipCards.findOne({
                where: {
                    id: cardId
                }
            });


            // ---------------------------------------
            // NO MEMBERSHIP CARD
            // ---------------------------------------

            if (!membershipCard) {
                return res.status(200).json({
                    status: 1,
                    msg: "No membership card found",
                    data: []
                });
            }


            // ---------------------------------------
            // FETCH CUSTOMER CARD
            // ---------------------------------------

            const customerCardData = await CustomerCard.findOne({
                where: {
                    merchant_card_id: cardId,
                    customer_id: customerId,
                    card_type: 2
                },

                attributes: [
                    "id",
                    "customer_id",
                    "branch_id",
                    "card_type",
                    "card_number",
                    "qr_token",
                    "current_stamp",
                    "status",
                    "issued_at",
                    "expires_at"
                ]
            });


            // ---------------------------------------
            // FORMAT DATA
            // ---------------------------------------

            const cardData = membershipCard.toJSON();

            const data = {

                ...cardData,

                brand_image: cardData.brand_image
                    ? baseUrl + '/' + cardData.brand_image
                    : null,

                background_image: cardData.background_image
                    ? baseUrl + '/' + cardData.background_image
                    : null,

                customer_card: customerCardData
                    ? customerCardData.toJSON()
                    : null

            };


            // ---------------------------------------
            // RESPONSE
            // ---------------------------------------

            return res.status(200).json({

                status: 1,

                msg: "Membership card details fetched successfully",

                data

            });

        }


        // =======================================
        // INVALID TYPE
        // =======================================

        else {

            return res.status(400).json({

                status: 0,

                message: 'Invalid type. Use 1 for stamp card or 2 for membership card'

            });

        }

    }
    catch (err) {

        console.error('fetch_card Error:', err);

        return res.status(500).json({

            status: 0,

            message: 'Something went wrong',

            error: err.message

        });

    }
};