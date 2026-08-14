
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
                'email_accept',
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

    try {

        const {
            name,
            email,
            phone,
            country_code,
            password,
            dob,
            gender,
            address,
            lat,
            lon,
            city,
            state,
            country
        } = req.body;

        const zip_code = req.body.zip_code || req.body.zipcode;

        // =========================
        // PHONE VALIDATION
        // =========================

        let phoneNumber = null;
        let nationalNumber = null;
        let callingCode = country_code || null;

        if (phone && phone.trim() !== '') {
            try {

                const cleanPhone = phone.replace(/\s+/g, '');

                const fullPhone = cleanPhone.startsWith('+')
                    ? cleanPhone
                    : (country_code || '') + cleanPhone;

                const num = parsePhoneNumber(fullPhone);

                if (!num.isValid()) {
                    return res.json({
                        status: 0,
                        message: "Invalid phone"
                    });
                }

                callingCode = `+${num.countryCallingCode}`;
                nationalNumber = num.nationalNumber;
                phoneNumber = num.number;

            } catch (phoneErr) {

                return res.json({
                    status: 0,
                    message: "Invalid phone format"
                });

            }
        }

        // =========================
        // PHONE EXISTS CHECK
        // =========================

        const phoneExists = await Customer.findOne({

            where: {
                country_code: callingCode,
                phone: nationalNumber,
                del_status: 0
            }

        });

        if (phoneExists) {

            return res.json({
                status: 0,
                message: "Phone already exists"
            });

        }

        // =========================
        // EMAIL EXISTS CHECK
        // =========================

        if (email) {

            const emailExists = await Customer.findOne({

                where: {
                    email: email.trim().toLowerCase(),
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

        let profileImage = null;

        if (req.files && req.files.length > 0) {

            const profileFile = req.files.find(
                file => file.fieldname === 'profile_image'
            );

            if (profileFile) {

                profileImage = profileFile.path.replace(/\\/g, '/');

            }

        }

        // =========================
        // PASSWORD HASH
        // =========================

        const hashedPassword = await bcrypt.hash(password, 10);

        // =========================
        // CREATE CUSTOMER
        // =========================

        const customer = await Customer.create({

            name,

            email: email
                ? email.trim().toLowerCase()
                : null,

            country_code: callingCode,

            phone: nationalNumber || null,

            password: hashedPassword,

            dob: dob || null,

            gender: gender || null,

            address,

            lat: lat || null,

            lon: lon || null,

            city: city || null,

            state: state || null,
            country,
            zip_code: zip_code || null,

            profile_image: profileImage,

            status: 1,

            del_status: 0

        });

        // =========================
        // SEND MAIL
        // =========================

        try {

            await sendMail(
                customer.email,
                'Customer Registration Successful',
                RegisterTemplate('customer', customer.name, 'active')
            );

        } catch (mailErr) {

            console.log("MAIL ERROR:", mailErr);

        }

        const customerData = customer.toJSON();
        customerData.profile_image = customerData.profile_image
            ? baseUrl + '/' + customerData.profile_image.replace(/\\/g, '/')
            : null;

        return res.json({

            status: 1,
            message: "Customer Registered Successfully",
            data: customerData

        });

    } catch (err) {

        console.log("ERROR:", err);

        return res.status(500).json({

            status: 0,
            message: err.message

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
            lon, city, state, country
        } = req.body || {};

        const zip_code = req.body.zip_code || req.body.zipcode;
        // console.log("bodu", req.body) 
        // console.log("code",req.body.country_code)
        // Log all uploaded files in the request
        console.log("Uploaded Files:", req.files);

        // Find the specific profile image file
        const profileFiless = req.files && req.files.find(file => file.fieldname === 'profile_image');
        console.log("Profile Image File Details:", profileFiless);



        if (!id) {

            return res.json({
                status: 0,
                message: "Customer ID is required"
            });

        }

        const customerId = id;

        // console.log("CUSTOMER ID:", customerId);

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

                const rawCountryCode = country_code || customer.country_code || '';
                const normalizedCountryCode = rawCountryCode
                    ? (String(rawCountryCode).startsWith('+') ? String(rawCountryCode) : `+${rawCountryCode}`)
                    : '';

                const fullPhone = cleanPhone.startsWith('+')
                    ? cleanPhone
                    : `${normalizedCountryCode}${cleanPhone}`;

                const num = parsePhoneNumber(fullPhone);

                if (!num || !num.isValid()) {

                    return res.json({
                        status: 0,
                        message: "Invalid phone number"
                    });

                }

                callingCode = `+${num.countryCallingCode}`;
                nationalNumber = num.nationalNumber;

                // console.log("COUNTRY CODE:", callingCode);
                // console.log("PHONE:", nationalNumber);

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
            city: city || customer.city,
            state: state || customer.state,
            country: country || customer.country,
            zip_code: zip_code || customer.zip_code,

            profile_image: profileImage

        });

        const updatedCustomer = await Customer.findOne({

            where: {
                id: customerId
            }

        });

        const customerData = updatedCustomer.toJSON();
        customerData.profile_image = customerData.profile_image
            ? baseUrl + '/' + customerData.profile_image.replace(/\\/g, '/')
            : null;

        return res.json({

            status: 1,
            message: "Customer updated successfully",
            data: customerData

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
                'country_code',
                'dob',
                'gender',
                'address',
                'lat',
                'lon',
                'profile_image',
                'status',
                'city',
                'state',
                'address',
                'country',
                'zip_code',
                'createdAt',


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
                'approved_by_id',
                'status',
                'del_status'
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

exports.delete_list = async (req, res) => {
    try {
        const customers = await Customer.findAll({
            where: { del_status: 1 },
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