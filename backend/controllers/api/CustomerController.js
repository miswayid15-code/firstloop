const {
    Merchant,
    Coupon,
    RefreshToken,
    Branch,
    BranchTiming,
    Receptionist,
    CustomerFp,
    Customer,
    Banner,
    BranchImage,
    MenuImage,
    CouponApplied,
    Wishlist,
    Appointment,
    Category, UserNotificationToken
} = require('../../models');
const { sendPushNotification, getNotificationTemplate } = require("../../helpers/notificationHelper");
const bcrypt = require('bcryptjs');
const { parsePhoneNumber } = require('libphonenumber-js');
const jwt = require('jsonwebtoken');

const sendMail = require('../../helpers/sendMail');
const generateRefId = require("../../helpers/generateRefHelper");
const RegisterTemplate = require('../../helpers/RegisterTemplate');
const { sendOtp } = require('../../helpers/sendOtp');
const ResetsTemplate = require('../../helpers/ResetsTemplate');

const { otpTemplate } = require('../../helpers/mailTemplate');
const { Op } = require('sequelize');
const axios = require("axios");
const moment = require('moment');
const {
    getDistanceDuration
} = require('../../helpers/distanceHelper');
const { messaging } = require('firebase-admin');
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

        // console.log("REQ BODY:", req.body);
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

        // check phone exists
        // console.log("Checking phone exists...");

        const phoneExists = await Customer.findOne({

            where: {

                country_code: callingCode,
                phone: nationalNumber

            }

        });

        // console.log("PHONE EXISTS:", phoneExists);

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
            country_code: callingCode,
            phone: nationalNumber? nationalNumber : null,
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
                RegisterTemplate('customer', customer.name, 'active')
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

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const customer = await Customer.findOne({
            where: { email }
        });

        if (!customer) {

            return res.json({
                status: 0,
                message: "Account not found"
            });

        }

        if (customer.del_status == 1) {

            return res.json({
                status: 0,
                message: "Account deleted"
            });

        }

        if (customer.status != 1) {

            return res.json({
                status: 0,
                message: "Account inactive"
            });

        }

        const match = await bcrypt.compare(
            password,
            customer.password
        );

        if (!match) {

            return res.json({
                status: 0,
                message: "Invalid email or password"
            });

        }

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

        await RefreshToken.create({

            user_id: customer.id,
            user_type: 'customer',
            token: refreshToken,
            expires_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            )

        });

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

        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: customer.id,
                user_type: "customer"
            }
        });

        // console.log(notificationToken?.toJSON());

        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "Welcome Back!",
                body: "You have successfully signed in to your account."
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }

        return res.json({

            status: 1,
            message: "Login successful",
            user_id: customer.id,
            access_token: accessToken,
            refresh_token: refreshToken

        });

    } catch (err) {

        console.log(err);

        return res.json({
            status: 0,
            message: "Error"
        });

    }

};

exports.logout = async (req, res) => {
    try {

        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: customer.id,
                user_type: "customer"
            }
        });

        // console.log(notificationToken?.toJSON());

        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "Goodbye!",
                body: "You have successfully logged out. See you again soon!"
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }
        await RefreshToken.destroy({
            where: {
                user_id: req.user.id,
                user_type: 'Customer'
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

exports.refreshAccessToken = async (req, res) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.json({
                status: 0,
                message: "Refresh token required"
            });
        }


        const refresh_token = authHeader.split(" ")[1];


        const stored = await RefreshToken.findOne({
            where: {
                token: refresh_token
            }
        });

        // console.log("stored", stored)
        if (!stored) {
            return res.json({
                status: 0,
                message: "Invalid refresh token"
            });
        }

        const decoded = jwt.verify(
            refresh_token,
            process.env.JWT_REFRESH_SECRET
        );



        const customer = await Customer.findOne({
            where: {
                id: decoded.id,
                del_status: 0
            }
        });

        if (!customer) {
            return res.status(401).json({
                status: 0,
                message: "Customer is not available"
            });
        }

        const newAccessToken = jwt.sign(
            {
                id: customer.id,
                email: customer.email,
                user_type: stored.user_type,
                token_type: "access"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.json({
            status: 1,
            message: "Access token refreshed successfully",
            access_token: newAccessToken
        });

    } catch (err) {
        console.log(err);

        if (err.name === "TokenExpiredError") {
            return res.json({
                status: 0,
                message: "Refresh token expired"
            });
        }

        if (err.name === "JsonWebTokenError") {
            return res.json({
                status: 0,
                message: "Invalid refresh token"
            });
        }

        return res.json({
            status: 0,
            message: "Something went wrong"
        });
    }
};
exports.forget_password = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {

            return res.status(400).json({
                status: 0,
                message: "Email is required"
            });

        }

        const customer = await Customer.findOne({
            where: { email }
        });

        if (!customer) {

            return res.status(404).json({
                status: 0,
                message: "Customer not found"
            });

        }

        // expire old otp
        await CustomerFp.update(
            {
                status: 2
            },
            {
                where: {
                    cus_id: customer.id,
                    status: 0
                }
            }
        );

        // const otp = Math.floor(
        //     100000 + Math.random() * 900000
        // );

        const otp = 111111;
        // create otp
        await CustomerFp.create({

            cus_id: customer.id,
            otp: otp,
            status: 0

        });

        // send mail
        await sendMail(
            email,
            'Forget Password OTP',
            otpTemplate(otp, 'Customer')
        );
        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: customer.id,
                user_type: "customer"
            }
        });

        // console.log(notificationToken?.toJSON());

        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "Check Your Email",
                body: "We've sent a password reset link to your email address. 🔐"
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }
        return res.status(200).json({
            status: 1,
            message: "OTP sent successfully"
        });

    } catch (err) {

        console.log("ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: err.message
        });

    }

};
exports.reset_ps = async (req, res) => {

    try {

        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {

            return res.status(400).json({
                status: 0,
                message: "Email, OTP and password are required"
            });

        }

        // find customer
        const customer = await Customer.findOne({
            where: {
                email: email
            }
        });

        if (!customer) {

            return res.status(404).json({
                status: 0,
                message: "Customer not found"
            });

        }

        // check otp
        const otp_check = await CustomerFp.findOne({

            where: {
                cus_id: customer.id,
                otp: otp,
                status: 0
            }

        });

        if (!otp_check) {

            return res.status(400).json({
                status: 0,
                message: "Invalid OTP"
            });

        }

        // hash password
        const hashedPassword = await bcrypt.hash(
            password.toString(),
            10
        );

        // update password
        await customer.update({
            password: hashedPassword
        });

        // otp completed
        await otp_check.update({
            status: 1
        });

        // send mail
        await sendMail(
            email,
            'Password Reset Successful',
            ResetsTemplate('Customer')
        );
        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: customer.id,
                user_type: "customer"
            }
        });

        // console.log(notificationToken?.toJSON());

        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "✅ Success!",
                body: "Your password has been reset successfully. 🔐"
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }
        return res.status(200).json({
            status: 1,
            message: "Password reset successfully"
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
            name,
            email,
            phone,
            dob,
            gender,
            address,
            lat,
            lon
        } = req.body || {};

        // token customer id
        const customerId = req.user.id;

        console.log("CUSTOMER ID:", customerId);

        // find customer
        const customer = await Customer.findOne({
            where: {
                id: customerId,
                del_status: 0
            }
        });

        if (!customer) {

            return res.status(404).json({
                status: 0,
                message: "Customer not found"
            });

        }

        // check email exists
        if (email) {

            const emailExists = await Customer.findOne({
                where: {
                    [Op.and]: [
                        {
                            email: email.trim().toLowerCase()
                        },
                        {
                            id: {
                                [Op.ne]: customer.id
                            }
                        }
                    ]
                }
            });

            console.log("EMAIL EXISTS:", emailExists);

            if (emailExists) {

                return res.status(400).json({
                    status: 0,
                    message: "Email already exists"
                });

            }

        }

        // check phone exists
        if (phone) {

            const phoneExists = await Customer.findOne({
                where: {
                    [Op.and]: [
                        {
                            phone: phone
                        },
                        {
                            id: {
                                [Op.ne]: customer.id
                            }
                        }
                    ]
                }
            });

            console.log("PHONE EXISTS:", phoneExists);

            if (phoneExists) {

                return res.status(400).json({
                    status: 0,
                    message: "Phone already exists"
                });

            }

        }

        // profile image
        let profileImage = customer.profile_image;

        if (req.files && req.files.length > 0) {

            const profileFile = req.files.find(
                file => file.fieldname === 'profile_image'
            );

            if (profileFile) {

                profileImage = profileFile.path.replace(/\\/g, '/');

            }

        }

        // update customer
        await customer.update({

            name: name || customer.name,

            email: email
                ? email.trim().toLowerCase()
                : customer.email,

            phone: phone || customer.phone,

            dob: dob || customer.dob,

            gender: gender || customer.gender,

            address: address || customer.address,

            lat: lat || customer.lat,

            lon: lon || customer.lon,

            profile_image: profileImage

        });
        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: customer.id,
                user_type: "customer"
            }
        });

        // console.log(notificationToken?.toJSON());

        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "Update Successful",
                body: "Your details were updated successfully.",
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }

        return res.status(200).json({

            status: 1,
            message: "Customer updated successfully",
            data: customer

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

        const customerId = req.user.id;

        const baseUrl = process.env.APP_URL;

        const customers = await Customer.findAll({

            where: {
                id: customerId,
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


exports.home = async (req, res) => {

    try {

        const lat = req.body?.lat || req.query?.lat || null;
        const lon = req.body?.lon || req.query?.lon || null;
        let choose_country = req.body?.ch_code || req.query?.ch_code || null;

        if (choose_country && !choose_country.startsWith('+')) {
            choose_country = '+' + choose_country.trim();

        }
        console.log("choose_country", choose_country)

        const customer_id =
            req.user?.id ||
            req.body?.customer_id ||
            req.query?.customer_id ||
            null;

        const baseUrl = process.env.APP_URL;
        const googleApiKey = process.env.GOOGLE_MAP_KEY;

        // ✅ Check Customer
        if (customer_id) {

            const customer = await Customer.findOne({

                where: {
                    id: customer_id,
                    status: 1,
                    del_status: 0
                }

            });

            if (!customer) {

                return res.json({
                    status: 0,
                    message: "Invalid customer"
                });

            }

        }


        const branches = await Branch.findAll({

            where: {
                status: 1,
                del_status: 0,
                country_code: choose_country
            },

            include: [{
                model: Merchant,
                required: true,
                attributes: [],
                where: {
                    status: 1,
                    del_status: 0
                }
            }],
            attributes: [
                'id',
                'name',
                'lat',
                'lon',
                'address',
                'profile_image'
            ],

            order: [['id', 'DESC']]

        });

        if (branches.length === 0) {

            return res.json({
                status: 0,
                message: "Branch list not found"
            });

        }

        const data = await Promise.all(

            branches.map(async (branch) => {

                const item = branch.toJSON();


                item.profile_image = item.profile_image
                    ? `${baseUrl}/${item.profile_image.replace(/\\/g, '/')}`
                    : null;


                item.user_lat = lat;
                item.user_lon = lon;
                item.customer_id = customer_id;


                item.distance = null;
                item.duration = null;
                item.distance_value = null;


                if (
                    lat &&
                    lon &&
                    item.lat &&
                    item.lon &&
                    !isNaN(Number(lat)) &&
                    !isNaN(Number(lon)) &&
                    !isNaN(Number(item.lat)) &&
                    !isNaN(Number(item.lon))
                ) {

                    const distanceData =
                        await getDistanceDuration(

                            lat,
                            lon,

                            item.lat,
                            item.lon,

                            googleApiKey

                        );

                    item.distance =
                        distanceData.distance;

                    item.duration =
                        distanceData.duration;

                }

                return item;

            })

        );


        data.sort((a, b) => {

            return (
                (a.distance_value || 999999999) -
                (b.distance_value || 999999999)
            );

        });


        const finalData = data.map(item => {

            delete item.distance_value;

            return item;

        });

        return res.json({

            status: 1,
            message: "Successfully fetched details",
            data: finalData

        });

    } catch (err) {

        console.log("FETCH ERROR:", err);

        return res.json({

            status: 0,
            message: err.message

        });

    }

};


exports.branch_details = async (req, res) => {

    try {

        const branch_id =
            req.body?.branch_id ||
            req.query?.branch_id ||
            null;

        const lat =
            req.body?.lat ||
            req.query?.lat ||
            null;

        const lon =
            req.body?.lon ||
            req.query?.lon ||
            null;

        const customer_id =
            req.user?.id ||
            req.body?.customer_id ||
            req.query?.customer_id ||
            null;
        // console.log("customer_id", customer_id)

        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID required"
            });

        }
        if (customer_id) {

            const customer = await Customer.findOne({

                where: {
                    id: customer_id,
                    status: 1,
                    del_status: 0
                }

            });

            if (!customer) {

                return res.json({
                    status: 0,
                    message: "Invalid customer"
                });

            }

        }


        const branch = await Branch.findOne({

            where: {
                id: branch_id,
                del_status: 0,
                status: 1
            },

            attributes: [
                'id',
                'name',
                'lat',
                'lon',
                'address',
                'merchant_id',
                'description',
                'open_time',
                'close_time',
                'profile_image'
            ],

            include: [

                {
                    model: BranchImage,
                    attributes: [
                        'id',
                        'branch_id',
                        'image'
                    ]
                },

                {
                    model: MenuImage,
                    attributes: [
                        'id',
                        'branch_id',
                        'image'
                    ]
                },
                {
                    model: BranchTiming,
                    attributes: [
                        'id',
                        'day',
                        'branch_id',
                        'open_time',
                        'close_time',
                        'is_closed'
                    ]
                }

            ]

        });

        // ✅ Branch Not Found
        if (!branch) {

            return res.json({
                status: 0,
                message: "Branch not found"
            });

        }

        const baseUrl =
            process.env.APP_URL;

        const googleApiKey =
            process.env.GOOGLE_MAP_KEY;

        const item =
            branch.toJSON();



        const current_time = moment().format('HH:mm:ss');

        // Get today's day (1 = Monday ... 7 = Sunday)
        const today = moment().isoWeekday();
        const todayDate = moment().format("YYYY-MM-DD");
        const todayTiming = item.BranchTimings.find(
            timing => timing.day === today
        );

        if (!todayTiming || todayTiming.is_closed) {

            item.is_open = 0;
            item.open_time = null;
            item.close_time = null;

        } else {

            item.open_time = todayTiming.open_time
                ? moment(todayTiming.open_time, 'HH:mm:ss').format('hh:mm A')
                : null;

            item.close_time = todayTiming.close_time
                ? moment(todayTiming.close_time, 'HH:mm:ss').format('hh:mm A')
                : null;

            item.is_open =
                current_time >= todayTiming.open_time &&
                    current_time <= todayTiming.close_time
                    ? 1
                    : 0;
        }
        // console.log("Today:", today);
        const coupons =
            await Coupon.findAll({

                where: {

                    status: 1,

                    del_status: 0,

                    branch_ids: {
                        [Op.contains]: [parseInt(branch_id)]
                    },
                    start_date: {
                        [Op.lte]: todayDate
                    },

                    end_date: {
                        [Op.gte]: todayDate
                    }



                },

                attributes: [
                    'id',
                    'branch_ids',
                    'code',
                    'percentage',
                    'min_amount',
                    'usage_limit',
                    'start_date',
                    'end_date',
                    'type',
                    'description',
                    'buy_item', 'get_item'
                ]

            });

        // ✅ Coupon Data
        item.Coupons =
            coupons.map(coupon => {

                const c =
                    coupon.toJSON();

                const now =
                    moment().format(
                        'HH:mm:ss'
                    );


                c.is_active =
                    now >= c.start_date &&
                        now <= c.end_date
                        ? 1
                        : 0;


                c.start_date =
                    c.start_date
                        ? moment(
                            c.start_date,
                            'YYYY-MM-DD'
                        ).format('DD/MM/YYYY')
                        : null;

                c.end_date =
                    c.end_date
                        ? moment(
                            c.end_date,
                            'YYYY-MM-DD'
                        ).format('DD/MM/YYYY')
                        : null;

                return c;

            });


        item.profile_image =
            item.profile_image
                ? `${baseUrl}/${item.profile_image.replace(/\\/g, '/')}`
                : null;


        item.BranchImages =
            (item.BranchImages || [])
                .map(img => {

                    img.image =
                        img.image
                            ? `${baseUrl}/${img.image.replace(/\\/g, '/')}`
                            : null;

                    return img;

                });


        item.MenuImages =
            (item.MenuImages || [])
                .map(img => {

                    img.image =
                        img.image
                            ? `${baseUrl}/${img.image.replace(/\\/g, '/')}`
                            : null;

                    return img;

                });


        item.user_lat = lat;

        item.user_lon = lon;

        item.customer_id =
            customer_id;


        item.distance = null;

        item.duration = null;


        if (
            lat &&
            lon &&
            item.lat &&
            item.lon &&
            !isNaN(Number(lat)) &&
            !isNaN(Number(lon)) &&
            !isNaN(Number(item.lat)) &&
            !isNaN(Number(item.lon))
        ) {

            const distanceData =
                await getDistanceDuration(

                    lat,
                    lon,

                    item.lat,
                    item.lon,

                    googleApiKey

                );

            item.distance =
                distanceData.distance;

            item.duration =
                distanceData.duration;

        }


        const wishlist = await Wishlist.findOne({
            where: {
                customer_id,
                branch_id: item.id,
                del_status: 0
            }
        });
        console

        item.is_wishlist = wishlist !== null ? 1 : 0;



        // ✅ Final Response
        return res.json({

            status: 1,

            message:
                "Successfully fetched details",

            data: item

        });

    }
    catch (err) {

        console.log(
            "FETCH ERROR:",
            err
        );

        return res.json({

            status: 0,

            message: err.message

        });

    }

};


exports.coupon_apply = async (req, res) => {

    try {

        const customer_id =
            req.user.id;

        // console.log("CUSTOMER ID:", customer_id);
        const coupon_id =
            req.body?.coupon_id ||
            req.query?.coupon_id ||
            null;

        const branch_id = req.body?.branch_id ||
            null;
        // console.log("COUPON ID:", coupon_id);

        if (!coupon_id) {

            return res.json({

                status: 0,

                message:
                    "Coupon ID is required"

            });

        }
        if (!branch_id) {

            return res.json({

                status: 0,

                message:
                    "Branch ID is required"

            });

        }

        if (customer_id) {

            const customer = await Customer.findOne({

                where: {
                    id: customer_id,
                    status: 1,
                    del_status: 0
                }

            });

            if (!customer) {

                return res.json({
                    status: 0,
                    message: "Invalid customer"
                });

            }

        }


        const coupon =
            await Coupon.findOne({

                where: {

                    id: coupon_id,

                    status: 1,

                    del_status: 0

                }

            });

        // console.log("COUPON:", coupon);
        if (!coupon) {

            return res.json({

                status: 0,

                message:
                    "Coupon not found"

            });

        }

        const branchIds = coupon.branch_ids.map(id => parseInt(id));

        if (!branchIds.includes(parseInt(branch_id))) {

            return res.json({

                status: 0,

                message: "Coupon is not applicable for this branch"

            });

        }

        // ✅ Current Time
        const today =
            moment().format('YYYY-MM-DD');

        const is_active =
            today >= coupon.start_date &&
            today <= coupon.end_date;
        // console.log("CURRENT TIME:", now);
        // console.log("COUPON START:", coupon.start_date);
        // console.log("COUPON END:", coupon.end_date);
        // console.log("IS ACTIVE:", is_active);

        if (!is_active) {

            return res.json({

                status: 0,

                message:
                    "Coupon expired"

            });

        }
        const existingCoupon = await CouponApplied.findOne({
            where: {
                coupon_id: coupon.id,
                cus_id: customer_id,
                branch_id: branch_id,
                status: 0
            }
        });

        if (existingCoupon) {
            return res.json({
                status: 0,
                message: 'This coupon is already processing. Please wait for approval.'
            });
        }


        // ✅ Usage Limit Check
        // const applied_count =
        //     await CouponApplied.count({

        //         where: {

        //             coupon_id:
        //                 coupon.id,
        //             cus_id:
        //                 customer_id,
        //             branch_id: branch_id,

        //             status: 1,

        //             del_status: 0

        //         }

        //     });

        // if (
        //     applied_count >=
        //     coupon.usage_limit
        // ) {

        //     return res.json({

        //         status: 0,

        //         message:
        //             "Coupon usage limit exceeded"

        //     });

        // }

        // ✅ Already Applied Check
        // const already_applied =
        //     await CouponApplied.findOne({

        //         where: {

        //             cus_id:
        //                 customer_id,

        //             coupon_id:
        //                 coupon.id,

        //             status: 1,

        //             del_status: 0

        //         }

        //     });

        // if (already_applied) {

        //     return res.json({

        //         status: 0,

        //         message:
        //             "Coupon already applied"

        //     });

        // }

        // ✅ Store Coupon Apply
        const couponApplied = await CouponApplied.create({

            cus_id:
                customer_id,

            coupon_id:
                coupon.id,

            coupon_code:
                coupon.code,

            percentage:
                coupon.percentage,
            branch_id: branch_id,

            used_at:
                null,

            status: 0,

            del_status: 0

        });

        // Get branch
        const branch = await Branch.findByPk(branch_id);

        if (branch) {

            const receptionist = await Receptionist.findOne({
                where: {
                    branch_id: branch.id,
                    status: 1,
                    del_status: 0
                }
            });

            const customerNotification = getNotificationTemplate(
                "coupon_redeem",
                "b2c",
                "pending"
            );

            const customerToken = await UserNotificationToken.findOne({
                where: {
                    user_id: customer_id,
                    user_type: "customer"
                }
            });

            if (customerToken?.token) {
                await sendPushNotification({
                    token: customerToken.token,
                    ...customerNotification,
                    data: {
                        type: "coupon_redeem",
                        coupon_id: coupon.id,
                        coupon_applied_id: couponApplied.id
                    }
                });
            }

            // Get merchant notification token
            const merchantToken = await UserNotificationToken.findOne({
                where: {
                    user_id: branch.merchant_id,
                    user_type: "merchant"
                }
            });

            const merchantNotification = getNotificationTemplate(
                "coupon_redeem",
                "b2b",
                "pending"
            );

            if (merchantToken?.token) {
                await sendPushNotification({
                    token: merchantToken.token,
                    ...merchantNotification,
                    data: {
                        type: "coupon_redeem",
                        coupon_id: coupon.id,
                        coupon_applied_id: couponApplied.id,
                        branch_id: branch.id
                    }
                });
            }

            const receptionToken = await UserNotificationToken.findOne({
                where: {
                    user_id: receptionist.id,
                    user_type: "receptionist"
                }
            });

            const receptionistNotification = getNotificationTemplate(
                "coupon_redeem",
                "b2b",
                "pending"
            );

            if (receptionToken?.token) {
                await sendPushNotification({
                    token: receptionToken.token,
                    ...receptionistNotification,
                    data: {
                        type: "coupon_redeem",
                        coupon_id: coupon.id,
                        coupon_applied_id: couponApplied.id,
                        branch_id: branch.id
                    }
                });
            }
        }


        return res.json({

            status: 1,

            message:
                "Coupon applied successfully",

            data: {

                coupon_id:
                    coupon.id,

                coupon_code:
                    coupon.code,

                percentage:
                    coupon.percentage

            }

        });

    }
    catch (err) {

        console.log(
            "FETCH ERROR:",
            err
        );

        return res.json({

            status: 0,

            message:
                err.message

        });

    }

};

exports.Coupon_list = async (req, res) => {

    try {

        const customer_id = req.user.id;
        // console.log("CUSTOMER ID:", customer_id);
        const customer =
            await Customer.findOne({

                where: {

                    id: customer_id,

                    status: 1,

                    del_status: 0

                }

            });

        if (!customer) {

            return res.json({

                status: 0,

                message:
                    "Invalid customer"

            });

        }

        // ✅ Fetch Applied Coupons
        const applied_coupons =
            await CouponApplied.findAll({

                where: {

                    cus_id:
                        customer_id,

                    del_status: 0

                },

                attributes: [
                    'id',
                    'cus_id',
                    'coupon_id',
                    'coupon_code',
                    'branch_id',
                    'percentage',
                    'used_at',
                    'status'
                ],

                include: [

                    {
                        model: Coupon,

                        attributes: [
                            'id',
                            'branch_ids',
                            'code',
                            'percentage',
                            'start_date',
                            'end_date',
                            'type',
                            'buy_item',
                            'get_item',
                        ]
                    },
                    {
                        model: Branch,

                        attributes: [

                            'id',
                            'name',
                            'open_time',
                            'close_time'
                        ]
                    }

                ],

                order: [
                    ['id', 'DESC']
                ]

            });

        // ✅ Final Data
        const finalData =
            await Promise.all(

                applied_coupons.map(
                    async item => {

                        const data =
                            item.toJSON();

                        // ✅ Used Date Format
                        data.used_at =
                            data.used_at
                                ? moment(
                                    data.used_at
                                ).format(
                                    'DD-MM-YYYY hh:mm A'
                                )
                                : null;

                        // ✅ Coupon Time Format
                        if (data.Coupon) {

                            data.Coupon.start_date =
                                data.Coupon.start_date
                                    ? moment(
                                        data.Coupon.start_date,
                                        'HH:mm:ss'
                                    ).format(
                                        'hh:mm A'
                                    )
                                    : null;

                            data.Coupon.end_date =
                                data.Coupon.end_date
                                    ? moment(
                                        data.Coupon.end_date,
                                        'YYYY-MM-DD'
                                    ).format(
                                        'DD/MM/YYYY'
                                    )
                                    : null;

                        }

                        if (data.branch) {

                            data.branch.open_time = data.branch.open_time
                                ? moment(data.branch.open_time, 'HH:mm:ss').format('hh:mm A')
                                : null;

                            data.branch.close_time = data.branch.close_time
                                ? moment(data.branch.close_time, 'HH:mm:ss').format('hh:mm A')
                                : null;
                        }
                        let branch_data = [];

                        if (data.Branch) {

                            const branch = data.Branch;

                            branch_data.push({

                                id: branch.id,
                                name: branch.name,

                                open_time: branch.open_time
                                    ? moment(branch.open_time, 'HH:mm:ss').format('hh:mm A')
                                    : null,

                                close_time: branch.close_time
                                    ? moment(branch.close_time, 'HH:mm:ss').format('hh:mm A')
                                    : null

                            });

                        }

                        data.branches = branch_data;

                        // remove Branch object from response
                        delete data.Branch;
                        return data;

                    }
                )

            );
        const status_count = {
            pending: finalData.filter(item => item.status == 0).length,
            approved: finalData.filter(item => item.status == 1).length,
            rejected: finalData.filter(item => item.status == 2).length
        };

        // ✅ Response
        return res.json({

            status: 1,
            counts: status_count,

            message:
                "Coupon List Fetch Successfully",

            data:
                finalData

        });

    }
    catch (err) {
        console.log("FETCH ERROR:", err);
        return res.json({
            status: 0,
            message: err.message
        });

    }

};

exports.claim_coupon_details = async (req, res) => {
    try {
        const { coupon_claim_id } = req.body;

        if (!coupon_claim_id) {
            return res.status(400).json({
                status: 0,
                message: "coupon_claim_id is required"
            });
        }

        const coupon_claim = await CouponApplied.findOne({
            where: {
                id: coupon_claim_id,
                del_status: 0
            },
            attributes: [
                'id',
                'coupon_id',
                'coupon_code',
                'percentage',
                'status',
                'del_status',
                'used_at',
                'created_at',
                'approved_by',
                'approved_by_id',
                'cancel_by',
                'cancel_reason'
            ],
            include: [
                {
                    model: Coupon,
                    attributes: [
                        'id',
                        'start_date',
                        'end_date'
                    ]
                },
                {
                    model: Branch,
                    attributes: [
                        'id',
                        'name'
                    ]
                }
            ]
        });

        if (!coupon_claim) {
            return res.status(404).json({
                status: 0,
                message: "No Claimed Coupon found"
            });
        }

        const data = coupon_claim.toJSON();

        data.used_at = data.used_at
            ? moment(data.used_at).format('DD-MM-YYYY hh:mm A')
            : null;
        if (data.Coupon) {
            data.Coupon.start_date = data.Coupon.start_date
                ? moment(data.Coupon.start_date).format('DD-MM-YYYY hh:mm A')
                : null;

            data.Coupon.end_date = data.Coupon.end_date
                ? moment(data.Coupon.end_date).format('DD-MM-YYYY hh:mm A')
                : null;
        }
        return res.status(200).json({
            status: 1,
            message: "Successfully fetched coupon details",
            data
        });

    } catch (err) {
        console.error("claim_coupon_details Error:", err);

        return res.status(500).json({
            status: 0,
            message: "Internal Server Error"
        });
    }
};

exports.wishlist = async (req, res) => {

    try {

        const customer_id =
            req.user.id;

        const branch_id =
            req.body?.branch_id ||
            req.query?.branch_id ||
            null;

        // ✅ Branch ID Check
        if (!branch_id) {

            return res.json({

                status: 0,

                message:
                    "Branch ID is required"

            });

        }

        // ✅ Customer Check
        const customer =
            await Customer.findOne({

                where: {

                    id: customer_id,

                    status: 1,

                    del_status: 0

                }

            });

        if (!customer) {

            return res.json({

                status: 0,

                message:
                    "Invalid customer"

            });

        }
        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: customer_id,
                user_type: "customer"
            }
        });
        // ✅ Branch Check
        const branch =
            await Branch.findOne({

                where: {

                    id: branch_id,

                    status: 1,

                    del_status: 0

                }

            });

        if (!branch) {

            return res.json({

                status: 0,

                message:
                    "Branch not found"

            });

        }

        // ✅ Already Wishlist Check
        const already_exists =
            await Wishlist.findOne({

                where: {

                    customer_id,

                    branch_id,

                    del_status: 0

                }

            });

        // ✅ Remove Wishlist
        if (already_exists) {

            await already_exists.update({

                del_status: 1

            });
            try {
                const result = await sendPushNotification({
                    token: notificationToken?.token,
                    title: "Wishlist Updated!",
                    body: `The branch "${branch.name}" has been removed from your wishlist.`
                });


            } catch (error) {
                console.error("Push Notification Error:", error);
            }

            return res.json({

                status: 1,

                message:
                    "Wishlist removed successfully",

                data: {

                    branch_id:
                        branch.id,

                    wishlist_id:
                        already_exists.id,

                    is_wishlist: 0

                }

            });

        }

        // ✅ Create Wishlist
        const wishlist =
            await Wishlist.create({

                customer_id,

                branch_id,

                status: 1,

                del_status: 0

            });





        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "🎉 Wishlist Updated!",
                body: `The branch "${branch.name}" has been added to your wishlist. ❤️`
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }
        // ✅ Response
        return res.json({

            status: 1,

            message:
                "Wishlist added successfully",

            data: {

                branch_id:
                    branch.id,

                wishlist_id:
                    wishlist.id,

                is_wishlist: 1

            }

        });

    }
    catch (err) {

        console.log(
            "FETCH ERROR:",
            err
        );

        return res.json({

            status: 0,

            message:
                err.message

        });

    }

};

exports.appointment = async (req, res) => {

    try {

        const customer_id = req.user.id;

        const branch_id =
            req.body?.branch_id ||
            req.query?.branch_id ||
            null;

        const {
            appointment_date,
            slot, remarks
        } = req.body;


        if (!branch_id) {

            return res.json({

                status: 0,
                message: "Branch ID is required"

            });

        }
        // console.log("slot", slot)

        if (!appointment_date || !slot) {

            return res.json({

                status: 0,
                message: "Appointment date and slot are required"

            });

        }
        const formattedDate = moment(
            appointment_date,
            ["YYYY-MM-DD", "DD-MM-YYYY"],
            true
        );

        if (!formattedDate.isValid()) {
            return res.json({
                status: 0,
                message: "Invalid appointment date format."
            });
        }

        const dbDate = formattedDate.format("YYYY-MM-DD");
        // console.log("appointment_date:", appointment_date);
        // console.log("new Date:", new Date(appointment_date));

        const customer = await Customer.findOne({

            where: {

                id: customer_id,
                status: 1,
                del_status: 0

            }

        });

        if (!customer) {

            return res.json({

                status: 0,
                message: "Invalid customer"

            });

        }


        const branch = await Branch.findOne({

            where: {

                id: branch_id,
                status: 1,
                del_status: 0

            },
            include: [
                {
                    model: BranchTiming,
                    attributes: [
                        "id",
                        "day",
                        "branch_id",
                        "open_time",
                        "close_time",
                        "is_closed"
                    ]
                }
            ]

        });

        if (!branch) {

            return res.json({

                status: 0,
                message: "Branch not found"

            });

        }


        const dayNumber = moment(dbDate).isoWeekday();


        const branchTiming = branch.BranchTimings.find(
            timing => Number(timing.day) === dayNumber
        );


        if (!branchTiming || branchTiming.is_closed === true) {
            return res.json({
                status: 0,
                message: "Branch is closed on the selected day."
            });
        }

        // Parse times
        const slotTime = moment(slot, ["HH:mm", "HH:mm:ss"], true);
        const openTime = moment(branchTiming.open_time, "HH:mm:ss");
        const closeTime = moment(branchTiming.close_time, "HH:mm:ss");

        // Invalid slot format
        if (!slotTime.isValid()) {
            return res.json({
                status: 0,
                message: "Invalid slot format."
            });
        }

        // Check whether slot is within branch timings
        if (
            slotTime.isBefore(openTime) ||
            slotTime.isSameOrAfter(closeTime)
        ) {
            return res.json({
                status: 0,
                message: "Branch is closed for the selected slot."
            });
        }
        const alreadyAppointment = await Appointment.findOne({

            where: {

                cus_id: customer_id,
                br_id: branch_id,
                appointment_date: dbDate,
                slot: slot

            }

        });

        if (alreadyAppointment) {

            return res.json({

                status: 0,
                message: "Appointment already booked for this slot"

            });

        }

        const refId = await generateRefId(branch.name);

        const appointment = await Appointment.create({
            ref_id: refId,

            cus_id: customer_id,

            br_id: branch_id,

            br_name: branch.branch_name || branch.name,

            appointment_date: dbDate,

            slot: slot,

            status: 0,

            cancel_by: null,

            cancel_reason: null,
            remarks: remarks || null

        });

        if (branch) {
            const customerNotification = getNotificationTemplate(
                "appointment",
                "b2c",
                "pending"
            );

            const customerToken = await UserNotificationToken.findOne({
                where: {
                    user_id: customer_id,
                    user_type: "customer"
                }
            });

            if (customerToken?.token) {
                await sendPushNotification({
                    token: customerToken.token,
                    ...customerNotification,
                    data: {
                        type: "appointment",
                        branch_id: branch.id,
                        appointment_id: appointment.id
                    }
                });
            }

            // Get merchant notification token
            const merchantToken = await UserNotificationToken.findOne({
                where: {
                    user_id: branch.merchant_id,
                    user_type: "merchant"
                }
            });

            const merchantNotification = getNotificationTemplate(
                "appointment",
                "b2b",
                "pending"
            );

            if (merchantToken?.token) {
                await sendPushNotification({
                    token: merchantToken.token,
                    ...merchantNotification,
                    data: {
                        type: "appointment",
                        branch_id: branch.id,
                        appointment_id: appointment.id
                    }
                });
            }
            const receptionist = await Receptionist.findOne({
                where: {
                    branch_id: branch.id,
                    status: 1,
                    del_status: 0
                }
            });

            const receptionToken = await UserNotificationToken.findOne({
                where: {
                    user_id: receptionist.id,
                    user_type: "receptionist"
                }
            });
            const receptionistNotification = getNotificationTemplate(
                "appointment",
                "b2b",
                "pending"
            );

            if (receptionToken?.token) {
                await sendPushNotification({
                    token: receptionToken.token,
                    ...receptionistNotification,
                    data: {
                        type: "appointment",
                        appointment_id: appointment.id,
                        branch_id: branch.id
                    }
                });
            }
        }

        return res.json({

            status: 1,
            message: "Appointment booked successfully",
            data: appointment

        });

    } catch (err) {

        console.log("APPOINTMENT ERROR:", err);

        return res.json({

            status: 0,
            message: err.message

        });

    }

};

exports.fetch_appointment = async (req, res) => {

    try {

        const customer_id = req.user.id;

        const appointments = await Appointment.findAll({

            where: {
                cus_id: customer_id
            },
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
                'ref_id',
                'remarks'

            ],

            order: [['id', 'DESC']]

        });

        // ✅ Format Date & Slot
        const formattedAppointments = appointments.map(item => {

            const data = item.toJSON();

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
        const status_count = {

            pending:
                formattedAppointments.filter(item => item.status == 0).length,

            approved:
                formattedAppointments.filter(item => item.status == 1).length,

            rejected:
                formattedAppointments.filter(item => item.status == 2).length

        };

        return res.json({

            status: 1,

            message: "Appointments fetched successfully",
            counts: status_count,
            data: formattedAppointments

        });

    } catch (err) {

        console.log("FETCH APPOINTMENT ERROR:", err);

        return res.json({

            status: 0,

            message: err.message

        });

    }

};


exports.fetch_appointment_details = async (req, res) => {

    try {

        const appointment_id =
            req.body?.appointment_id ||
            req.query?.appointment_id ||
            null;
        // console.log("APPOINTMENT ID:", appointment_id);
        const customer_id = req.user.id;


        if (!appointment_id) {

            return res.json({

                status: 0,
                message: "Appointment ID is required"

            });

        }


        const customer = await Customer.findOne({

            where: {

                id: customer_id,
                status: 1,
                del_status: 0

            }

        });

        if (!customer) {

            return res.json({

                status: 0,
                message: "Invalid customer"

            });

        }


        const appointment = await Appointment.findOne({

            where: {

                id: appointment_id,
                cus_id: customer_id

            },
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
                'remarks',
                'ref_id'
            ],

            include: [

                {

                    model: Branch,

                    attributes: [
                        'id',
                        'name',
                        'address',
                        'phone',
                        'lat',
                        'lon'
                    ]

                }

            ]

        });

        if (!appointment) {

            return res.json({

                status: 0,
                message: "Invalid appointment"

            });

        }

        const data = appointment.toJSON();


        data.appointment_date =
            new Date(data.appointment_date)
                .toLocaleDateString('en-US', {

                    month: 'long',
                    day: '2-digit',
                    year: 'numeric'

                });


        data.slot =
            new Date(`1970-01-01T${data.slot}`)
                .toLocaleTimeString('en-US', {

                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true

                });

        return res.json({

            status: 1,

            message: "Appointment details fetched successfully",

            data: data

        });

    }
    catch (err) {

        console.log("FETCH APPOINTMENT DETAILS ERROR:", err);

        return res.json({

            status: 0,
            message: err.message

        });

    }

}


exports.search = async (req, res) => {

    try {

        const query =
            req.body?.query ||
            req.query?.query ||
            null;

        if (!query) {

            return res.json({
                status: 0,
                message: "Search query is required"
            });

        }

        // =========================
        // CATEGORY SEARCH
        // =========================

        const categories = await Category.findAll({

            where: {
                name: {
                    [Op.iLike]: `%${query}%`
                }
            },

            attributes: [
                'id',
                'name'
            ]

        });

        // =========================
        // BRANCH SEARCH
        // =========================

        const branches = await Branch.findAll({

            where: {
                name: {
                    [Op.iLike]: `%${query}%`
                }
            },

            attributes: [
                'id',
                'name'
            ]

        });

        // =========================
        // COUPON SEARCH
        // =========================

        const coupons = await Coupon.findAll({

            where: {
                code: {
                    [Op.iLike]: `%${query}%`
                }
            },

            attributes: [
                'id',
                'branch_ids',
                'code'
            ]

        });

        // =========================
        // MERCHANT SEARCH
        // =========================

        const merchants = await Merchant.findAll({

            where: {
                bus_name: {
                    [Op.iLike]: `%${query}%`
                }
            },

            attributes: [
                'id',
                'bus_name',
                'cat_id'
            ]

        });

        // =========================
        // FORMAT RESPONSE
        // =========================

        let results = [];

        // Categories with merchants inside

        for (const category of categories) {

            const categoryMerchants =
                await Merchant.findAll({

                    where: {
                        cat_id: category.id
                    },

                    attributes: [
                        'id',
                        'bus_name',
                        'cat_id'
                    ]

                });

            results.push({

                type: "category",

                id: category.id,

                name: category.name,

                merchants: categoryMerchants

            });

        }

        // Merchant search results that are not from category search

        const categoryIds =
            categories.map(item => item.id);

        merchants.forEach((item) => {

            if (!categoryIds.includes(item.cat_id)) {

                results.push({

                    type: "merchant",

                    data: item

                });

            }

        });

        // Branches

        branches.forEach((item) => {

            results.push({

                type: "branch",

                data: item

            });

        });

        // Coupons

        coupons.forEach((item) => {

            results.push({

                type: "coupon",

                data: item

            });

        });

        return res.json({

            status: 1,

            message:
                "Search results fetched successfully",

            total: results.length,

            data: results

        });

    } catch (err) {

        console.log(
            "SEARCH ERROR:",
            err
        );

        return res.json({

            status: 0,

            message: err.message

        });

    }

};

exports.merchants = async (req, res) => {

    try {

        const merchant_id =
            req.body?.merchant_id ||
            null;
        // console.log("MERCHANT ID:", merchant_id);
        // ✅ Merchant ID required
        if (!merchant_id) {

            return res.json({
                status: 0,
                message: "Merchant ID is required"
            });

        }

        const merchants = await Merchant.findAll({

            where: {
                id: merchant_id
            },

            attributes: [
                'id',
                'bus_name'
            ],

            include: [
                {
                    model: Branch,

                    where: {
                        del_status: 0,
                        status: 1
                    },

                    required: true,

                    attributes: [
                        'id',
                        'name'
                    ]
                }
            ]

        });

        // ✅ No Data Check
        if (!merchants || merchants.length === 0) {

            return res.json({
                status: 0,
                message: "No merchants found"
            });

        }

        return res.json({

            status: 1,
            message: "Merchants fetched successfully",
            data: merchants

        });

    }
    catch (err) {

        console.log("MERCHANTS FETCH ERROR:", err);

        return res.json({

            status: 0,
            message: err.message

        });

    }

};

exports.fetch_wishlist = async (req, res) => {
    try {

        const customer_id = req.user.id;

        if (!customer_id) {
            return res.json({
                status: 0,
                message: "Customer ID is required"
            });
        }

        const wishlist = await Wishlist.findAll({
            raw: true,
            nest: true,
            where: {
                customer_id,
                del_status: 0
            },
            attributes: [
                'id',
                'customer_id',
                'branch_id',
                'status'
            ],
            include: [
                {
                    model: Branch,
                    attributes: ['id', 'name', 'merchant_id'],
                    where: {
                        del_status: 0,
                        status: 1
                    },
                    required: true,
                    include: [
                        {
                            model: Merchant,
                            attributes: ['id', 'name'],
                            where: {
                                del_status: 0,
                                status: 1
                            },
                            required: true
                        }
                    ]
                }
            ]
        });

        if (wishlist.length === 0) {
            return res.json({
                status: 0,
                message: "No wishlist items found"
            });
        }

        return res.json({
            status: 1,
            message: "Wishlist fetched successfully",
            data: wishlist
        });

    } catch (err) {

        console.log("Error:", err);

        return res.json({
            status: 0,
            message: "Error occurred while fetching wishlist"
        });
    }
};

exports.cancel_appointment = async (req, res) => {

    try {

        const customer_id = req.user.id;

        if (!customer_id) {
            return res.json({
                status: 0,
                message: "Customer ID is required"
            });
        }

        const {
            appointment_id,
            cancel_reason
        } = req.body;

        if (!appointment_id) {
            return res.json({
                status: 0,
                message: "Appointment ID is required"
            });
        }

        const appointment = await Appointment.findOne({
            where: {
                id: appointment_id,
                cus_id: customer_id
            }
        });

        if (!appointment) {
            return res.json({
                status: 0,
                message: "Appointment not found"
            });
        }

        if (Number(appointment.status) === 2) {
            return res.json({
                status: 0,
                message: "Appointment is already cancelled"
            });
        }

        await appointment.update({
            status: 2,
            cancel_by: 'customer',
            cancel_reason: cancel_reason || null
        });
        // Get branch details
        const branch = await Branch.findOne({
            where: {
                id: appointment.br_id
            }
        });

        if (branch) {

            // =========================
            // Customer Notification
            // =========================
            const customerNotification = getNotificationTemplate(
                "appointment",
                "b2c",
                "cancelled",
                "you",
                appointment.cancel_reason
            );

            const customerToken = await UserNotificationToken.findOne({
                where: {
                    user_id: customer_id,
                    user_type: "customer"
                }
            });

            if (customerToken?.token) {
                await sendPushNotification({
                    token: customerToken.token,
                    ...customerNotification,
                    data: {
                        type: "appointment",
                        branch_id: branch.id,
                        appointment_id: appointment.id
                    }
                });
            }

            // =========================
            // Merchant Notification
            // =========================
            const merchantNotification = getNotificationTemplate(
                "appointment",
                "b2b",
                "cancelled",
                "the customer",
                appointment.cancel_reason
            );

            const merchantToken = await UserNotificationToken.findOne({
                where: {
                    user_id: branch.merchant_id,
                    user_type: "merchant"
                }
            });

            if (merchantToken?.token) {
                await sendPushNotification({
                    token: merchantToken.token,
                    ...merchantNotification,
                    data: {
                        type: "appointment",
                        branch_id: branch.id,
                        appointment_id: appointment.id
                    }
                });
            }

            const receptionist = await Receptionist.findOne({
                where: {
                    branch_id: branch.id,
                    status: 1,
                    del_status: 0
                }
            });

            const receptionToken = await UserNotificationToken.findOne({
                where: {
                    user_id: receptionist.id,
                    user_type: "receptionist"
                }
            });
            const receptionistNotification = getNotificationTemplate(
                "appointment",
                "b2b",
                "cancelled",
                "the customer",
                appointment.cancel_reason
            );

            if (receptionToken?.token) {
                await sendPushNotification({
                    token: receptionToken.token,
                    ...receptionistNotification,
                    data: {
                        type: "appointment",
                        branch_id: branch.id,
                        appointment_id: appointment.id
                    }
                });
            }
        }

        return res.json({
            status: 1,
            message: "Appointment cancelled successfully",
            // data: appointment
        });

    } catch (err) {

        console.log("APPOINTMENT CANCEL ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }
};
exports.get_brach_by_coupon = async (req, res) => {
    try {

        const baseUrl = process.env.APP_URL;

        const coupon_id =
            req.params?.coupon_id ||
            req.query?.coupon_id;

        if (!coupon_id) {
            return res.json({
                status: 0,
                message: "Coupon ID is required"
            });
        }

        const coupon = await Coupon.findOne({
            where: {
                id: coupon_id
            },
            attributes: [
                "id",
                "code",
                "branch_ids"
            ]
        });

        if (!coupon) {
            return res.json({
                status: 0,
                message: "Coupon not found"
            });
        }

        let branchIds = [];

        if (Array.isArray(coupon.branch_ids)) {
            branchIds = coupon.branch_ids.map(Number);
        } else if (typeof coupon.branch_ids === "string") {
            branchIds = coupon.branch_ids
                .replace(/[{}]/g, "")
                .split(",")
                .map(id => Number(id.trim()))
                .filter(id => !isNaN(id));
        }

        const branches = await Branch.findAll({
            where: {
                id: {
                    [Op.in]: branchIds
                },
                status: 1,
                del_status: 0
            },
            attributes: [
                "id",
                "name",
                "profile_image",
                "address",
                "lat",
                "lon"
            ]
        });

        const branchList = branches.map(branch => ({
            ...branch.toJSON(),
            profile_image: branch.profile_image
                ? `${baseUrl}/${branch.profile_image}`
                : null
        }));

        return res.json({
            status: 1,
            message: "Branches fetched successfully",
            data: {
                coupon,
                branches: branchList
            }
        });

    } catch (err) {

        console.log("GET BRANCH BY COUPON ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }
};

exports.send_test = async (req, res) => {
    try {
        const refId = await generateRefId("Test Branch");
        console.log("Generated Ref ID:", refId);

        return res.json({
            status: 1,
            refId
        });
    } catch (err) {
        console.log(err);
        return res.json({
            status: 0,
            message: err.message
        });
    }
};
exports.send_tests = async (req, res) => {
    try {

        console.log("=== SEND TEST START ===");

        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: 1,
                user_type: "merchant"
            }
        });

        console.log("Notification Token Record:", notificationToken?.toJSON());

        if (!notificationToken?.token) {
            console.log("No notification token found.");

            return res.json({
                status: 0,
                message: "Notification token not found"
            });
        }

        const payload = {
            token: notificationToken.token,
            title: "🎉 Branch Created!",
            body: `Your branch has been created successfully. 🏢`
        };

        console.log("Push Payload:", payload);

        try {

            const result = await sendPushNotification(payload);

            console.log("Push Notification Result:", result);

            return res.json({
                status: 1,
                message: "Notification sent successfully",
                data: result
            });

        } catch (error) {

            console.error("Push Notification Error:", error);
            console.error("Error Message:", error.message);
            console.error("Error Stack:", error.stack);

            return res.json({
                status: 0,
                message: "Failed to send notification",
                error: error.message
            });
        }

    } catch (err) {

        console.error("Controller Error:", err);
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);

        return res.status(500).json({
            status: 0,
            message: "Internal Server Error",
            error: err.message
        });
    }
};

