
const {
    Merchant,
    Coupon,
    RefreshToken,
    Branch,
    Receptionist,
    CustomerFp,
    Customer,
    Banner,
    BranchImage,
    MenuImage,
    CouponApplied,
    Wishlist,
    Appointment
} = require('../../models');
const bcrypt = require('bcryptjs');
const { parsePhoneNumber } = require('libphonenumber-js');
const jwt = require('jsonwebtoken');
const baseUrl = process.env.APP_URL;
const sendMail = require('../../helpers/sendMail');
const RegisterTemplate = require('../../helpers/RegisterTemplate');
const ResetsTemplate = require('../../helpers/ResetsTemplate');
const { otpTemplate } = require('../../helpers/mailTemplate');
const { Op } = require('sequelize');
const axios = require("axios");
const moment = require('moment');
const {
    getDistanceDuration
} = require('../../helpers/distanceHelper');


exports.list = async (req, res) => {
    try {
        const customers = await Customer.findAll({
            where: { del_status: 0 },
            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'dob',
                'profile_image',
                'gender',
                'city',
                'status',
                'createdAt',

                'status',
                'del_status',
                'lat',
                'lon'
            ]
        });
        if (customers.length === 0) {
            return res.json({
                status: 0,
                message: "No customers found"
            });
        }

        const data = customers.map(customer => {

            const customerData = customer.toJSON();

            customerData.profile_image =
                customerData.profile_image
                    ? baseUrl + '/' + customerData.profile_image.replace(/\\/g, '/')
                    : null;

            return customerData;
        });

        return res.json({
            status: 1,
            message: "Customer List",
            data: data
        });
    }
    catch (err) {
        console.log("ERROR:", err);
        return res.json({
            status: 0,
            message: "Error",
        });
    }
}
exports.register = async (req, res) => {

    // console.log("========== CUSTOMER REGISTER START ==========");

    try {

        const {
            name,
            email,
            phone,
            password,
            dob,
            gender,
            address,
            lat,
            lon
        } = req.body;

        console.log("REQ BODY:", req.body);

        let phoneNumber;

        try {

            console.log("Parsing phone:", phone);

            const num = parsePhoneNumber(phone);

            if (!num.isValid()) {

                console.log("Invalid phone");

                return res.json({
                    status: 0,
                    message: "Invalid phone"
                });

            }

            phoneNumber = num.number;

            console.log("Valid Phone:", phoneNumber);

        } catch (phoneErr) {

            console.log("PHONE ERROR:", phoneErr);

            return res.json({
                status: 0,
                message: "Invalid phone format"
            });

        }

        // check phone exists
        // console.log("Checking phone exists...");

        const phoneExists = await Customer.findOne({
            where: { phone: phoneNumber }
        });

        console.log("PHONE EXISTS:", phoneExists);

        if (phoneExists) {

            return res.json({
                status: 0,
                message: "Phone already exists"
            });

        }

        // check email exists
        // console.log("Checking email exists...");

        const emailExists = await Customer.findOne({
            where: { email }
        });

        // console.log("EMAIL EXISTS:", emailExists);

        if (emailExists) {

            return res.json({
                status: 0,
                message: "Email already exists"
            });

        }

        // profile image upload
        let profileImage = '';

        // console.log("FILES:", req.files);

        if (req.files && req.files.length > 0) {

            const profileFile = req.files.find(
                file => file.fieldname === 'profile_image'
            );

            // console.log("PROFILE FILE:", profileFile);

            if (profileFile) {

                profileImage = profileFile.path.replace(/\\/g, '/');

            }

        }

        // console.log("PROFILE IMAGE:", profileImage);

        // password hash
        // console.log("Hashing password...");

        const hashedPassword = await bcrypt.hash(password, 10);

        // console.log("PASSWORD HASHED");

        // create customer
        // console.log("Creating customer...");

        const customer = await Customer.create({

            name,
            email,
            phone: phoneNumber,
            password: hashedPassword,
            dob,
            gender,
            address,
            lat,
            lon,
            profile_image: profileImage,
            status: 1,
            del_status: 0

        });

        // console.log("CUSTOMER CREATED:", customer.id);

        // access token
        // console.log("Generating access token...");

        const accessToken = jwt.sign(
            {
                id: customer.id,
                email: customer.email,
                user_type: 'customer',
                token_type: 'access'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

        // console.log("ACCESS TOKEN CREATED");

        // refresh token
        // console.log("Generating refresh token...");

        const refreshToken = jwt.sign(
            {
                id: customer.id,
                user_type: 'customer',
                token_type: 'refresh'
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: '7d'
            }
        );


        // console.log("REFRESH TOKEN CREATED");

        // save refresh token
        // console.log("Saving refresh token...");

        await RefreshToken.create({

            user_id: customer.id,
            user_type: 'customer',
            token: refreshToken,
            expires_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            )

        });

        // console.log("REFRESH TOKEN SAVED");

        // mail env logs
        // console.log("MAIL USER:", process.env.MAIL_USER);

        // console.log(
        //     "MAIL PASS EXISTS:",
        //     process.env.MAIL_PASS ? "YES" : "NO"
        // );

        // console.log("========== MAIL START ==========");

        // send mail
        try {

            await sendMail(
                email,
                'Customer Registration Successful',
                RegisterTemplate('customer', customer.name)
            );

            // console.log("REGISTRATION MAIL SENT");

        } catch (mailErr) {

            // console.log("========== MAIL ERROR ==========");

            // console.log("MAIL ERROR:", mailErr);

            // console.log("MAIL ERROR MESSAGE:", mailErr.message);

            // console.log("MAIL ERROR STACK:", mailErr.stack);

        }

        // console.log("========== MAIL END ==========");

        // console.log("FINAL RESPONSE:");

        // console.log({

        //     status: 1,
        //     message: "Customer Registered Successfully",
        //     user_id: customer.id,
        //     user_type: 'customer',
        //     access_token: accessToken,
        //     refresh_token: refreshToken

        // });

        // console.log("========== CUSTOMER REGISTER SUCCESS ==========");

        return res.json({

            status: 1,
            message: "Customer Registered Successfully",
            user_id: customer.id,
            user_type: 'customer',
            access_token: accessToken,
            refresh_token: refreshToken

        });

    } catch (err) {

        // console.log("========== CUSTOMER REGISTER ERROR ==========");

        // console.log("ERROR:", err);

        console.log("ERROR STACK:", err.stack);

        return res.json({
            status: 0,
            message: "Error",
            error: err.message
        });

    }

};


exports.update = async (req, res) => {

    try {

        const {
            id,
            name,
            email,
            phone,
            country_code,
            dob,
            gender,
            address,
            lat,
            lon
        } = req.body || {};
        console.log("bodu", req.body)

        if (!id) {

            return res.json({
                status: 0,
                message: "Customer ID is required"
            });

        }

        const customerId = id;

        console.log("CUSTOMER ID:", customerId);

        const customer = await Customer.findOne({

            where: {
                id: customerId,
                del_status: 0
            }

        });

        if (!customer) {

            return res.json({
                status: 0,
                message: "Customer not found"
            });

        }

        // =========================
        // PHONE VALIDATION
        // =========================

        let nationalNumber = customer.phone;
        let callingCode = customer.country_code;

        if (phone) {

            try {

                const cleanPhone = phone.replace(/\s+/g, '');

                const fullPhone = cleanPhone.startsWith('+')
                    ? cleanPhone
                    : (country_code || customer.country_code || '') + cleanPhone;

                const num = parsePhoneNumber(fullPhone);

                if (!num || !num.isValid()) {

                    return res.json({
                        status: 0,
                        message: "Invalid phone number"
                    });

                }

                callingCode = `+${num.countryCallingCode}`;
                nationalNumber = num.nationalNumber;

                console.log("COUNTRY CODE:", callingCode);
                console.log("PHONE:", nationalNumber);

            } catch (err) {

                console.log("PHONE ERROR:", err);

                return res.json({
                    status: 0,
                    message: "Invalid phone format"
                });

            }

            const phoneExists = await Customer.findOne({

                where: {

                    country_code: callingCode,
                    phone: nationalNumber,

                    id: {
                        [Op.ne]: customerId
                    },

                    del_status: 0

                }

            });

            if (phoneExists) {

                return res.json({
                    status: 0,
                    message: "Phone already exists"
                });

            }

        }

        // =========================
        // EMAIL EXISTS CHECK
        // =========================

        if (email) {

            const emailExists = await Customer.findOne({

                where: {

                    email: email.trim().toLowerCase(),

                    id: {
                        [Op.ne]: customerId
                    },

                    del_status: 0

                }

            });

            if (emailExists) {

                return res.json({
                    status: 0,
                    message: "Email already exists"
                });

            }

        }

        // =========================
        // PROFILE IMAGE
        // =========================

        let profileImage = customer.profile_image;

        if (req.files && req.files.length > 0) {

            const profileFile = req.files.find(
                file => file.fieldname === 'profile_image'
            );

            if (profileFile) {

                profileImage = profileFile.path.replace(/\\/g, '/');

            }

        }

        // =========================
        // UPDATE CUSTOMER
        // =========================

        await customer.update({

            name: name || customer.name,

            email: email
                ? email.trim().toLowerCase()
                : customer.email,

            country_code: callingCode,

            phone: nationalNumber,

            dob: dob || customer.dob,

            gender: gender || customer.gender,

            address: address || customer.address,

            lat: lat || customer.lat,

            lon: lon || customer.lon,

            profile_image: profileImage

        });

        const updatedCustomer = await Customer.findOne({

            where: {
                id: customerId
            }

        });

        return res.json({

            status: 1,
            message: "Customer updated successfully",
            data: updatedCustomer

        });

    } catch (err) {

        console.log("ERROR:", err);

        return res.status(500).json({

            status: 0,
            message: err.message

        });

    }

};

exports.fetch_list = async (req, res) => {

    try {
        const { id } = req.body;


        const baseUrl = process.env.APP_URL;

        const customers = await Customer.findAll({

            where: {
                id: id,
                del_status: 0
            },

            attributes: [

                'id',
                'name',
                'email',
                'phone',
                'dob',
                'gender',
                'address',
                'lat',
                'lon',
                'profile_image',
                'status'

            ],

            order: [['id', 'DESC']]

        });

        if (!customers || customers.length === 0) {

            return res.json({
                status: 0,
                message: "Customer list not found"
            });

        }

        const data = customers.map(customer => {

            const customerData = customer.toJSON();

            customerData.profile_image =
                customerData.profile_image
                    ? baseUrl + '/' + customerData.profile_image.replace(/\\/g, '/')
                    : null;

            return customerData;

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

exports.update_status = async (req, res) => {
    try {

        const { id, status } = req.body;

        const customer = await Customer.findOne({
            where: {
                id: id,
                del_status: 0
            }
        });

        if (!customer) {
            return res.json({
                status: 0,
                message: "Customer not found"
            });
        }

        await Customer.update(
            {
                status: status
            },
            {
                where: {
                    id: id
                }
            }
        );

        return res.json({
            status: 1,
            message: "Customer status updated successfully"
        });

    } catch (err) {

        console.log(err);

        return res.json({
            status: 0,
            message: "Issue with update"
        });

    }
};
exports.appointment_list = async (req, res) => {

    try {





        const appointments =
            await Appointment.findAll({


                attributes: [
                    'id',
                    'cus_id',
                    'br_id',
                    'br_name',
                    'appointment_date',
                    'slot',
                    'status',
                    'cancel_by',
                    'cancel_reason',
                    'approved_by',
                    'approved_by_id',

                ],
                include: [
                    {
                        model: Customer,
                        attributes: [
                            'id',
                            'name',
                            'phone',
                            'country_code'
                        ]
                    }
                ],


                order: [['id', 'DESC']]

            });
        // console.log("APPOINTMENTS:", appointments);

        if (
            !appointments ||
            appointments.length === 0
        ) {

            return res.json({

                status: 0,
                message: "No appointments found",
                data: []

            });

        }


        const formattedAppointments =
            appointments.map(item => {

                const data =
                    item.toJSON();

                return {

                    ...data,

                    appointment_date:
                        new Date(data.appointment_date)
                            .toLocaleDateString('en-US', {

                                month: 'long',
                                day: '2-digit',
                                year: 'numeric'

                            }),

                    slot:
                        new Date(`1970-01-01T${data.slot}`)
                            .toLocaleTimeString('en-US', {

                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true

                            })

                };

            });

        return res.json({

            status: 1,

            message: "Successfully fetched",

            data: formattedAppointments

        });

    } catch (err) {

        console.log(
            "APPOINTMENT ERROR:",
            err
        );

        return res.json({

            status: 0,
            message: err.message

        });

    }

};

exports.coupon_claim_list = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const couponClaim = await CouponApplied.findAndCountAll({
            attributes: [
                'id',
                'cus_id',
                'coupon_id',
                'branch_id',
                'coupon_code',
                'percentage',
                'used_at',
                'cancel_by',
                'cancel_reason',
                'approved_by',
                'approved_by_id'
            ],
            include: [
                {
                    model: Customer,
                    attributes: ['id', 'name', 'phone', 'country_code']
                },
                {
                    model: Branch,
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: Merchant,
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ],
            limit,
            offset,
            order: [['id', 'DESC']]
        });

        if (!couponClaim || couponClaim.length === 0) {
            return res.json({
                status: 0,
                message: "No Coupon Claim found",
                data: []
            });
        }

        return res.json({
            status: 1,
            message: "Successfully fetched",
            data: couponClaim
        });

    } catch (err) {
        console.error("COUPON CLAIM ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });
    }
};