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
                type: 'customer',
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
                type: 'customer',
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
                type: 'customer',
                token_type: 'refresh'
            },
            process.env.JWT_SECRET,
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
                type: 'customer',
                token_type: 'access'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

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

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({
                status: 0,
                message: "Refresh token required"
            });
        }

        const refresh_token = authHeader.split(' ')[1];

        const stored = await RefreshToken.findOne({
            where: { token: refresh_token }
        });

        if (!stored) {
            return res.json({
                status: 0,
                message: "Invalid refresh token"
            });
        }

        const decoded = jwt.verify(
            refresh_token,
            process.env.JWT_SECRET
        );

        const newAccessToken = jwt.sign(
            {
                id: decoded.id,
                user_type: stored.user_type
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.json({
            status: 1,
            access_token: newAccessToken
        });

    } catch (err) {

        return res.json({
            status: 0,
            message: "Token expired"
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

        const otp = Math.floor(
            100000 + Math.random() * 900000
        );

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
                del_status: 0
            },

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



        const current_time =
            moment().format('HH:mm:ss');

        item.is_open =
            current_time >= item.open_time &&
                current_time <= item.close_time
                ? 1
                : 0;


        item.open_time = item.open_time
            ? moment(
                item.open_time,
                'HH:mm:ss'
            ).format('hh:mm A')
            : null;

        item.close_time = item.close_time
            ? moment(
                item.close_time,
                'HH:mm:ss'
            ).format('hh:mm A')
            : null;


        const coupons =
            await Coupon.findAll({

                where: {

                    status: 1,

                    del_status: 0,

                    branch_ids: {
                        [Op.contains]: [parseInt(branch_id)]
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
                    'end_date'
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
        const wishlist =
            await Wishlist.findOne({

                where: {

                    customer_id,

                    branch_id:
                        item.id,

                    del_status: 0

                }

            });

        item.is_wishlist =
            wishlist ? 1 : 0;

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

        console.log("CUSTOMER ID:", customer_id);
        const coupon_id =
            req.body?.coupon_id ||
            req.query?.coupon_id ||
            null;
        // console.log("COUPON ID:", coupon_id);

        if (!coupon_id) {

            return res.json({

                status: 0,

                message:
                    "Coupon ID is required"

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

        console.log("COUPON:", coupon);
        if (!coupon) {

            return res.json({

                status: 0,

                message:
                    "Coupon not found"

            });

        }

        // ✅ Current Time
        const today =
            moment().format('YYYY-MM-DD');

        const is_active =
            today >= coupon.start_date &&
            today <= coupon.end_date;
        // console.log("CURRENT TIME:", now);
        console.log("COUPON START:", coupon.start_date);
        console.log("COUPON END:", coupon.end_date);
        console.log("IS ACTIVE:", is_active);

        if (!is_active) {

            return res.json({

                status: 0,

                message:
                    "Coupon expired"

            });

        }

        // ✅ Usage Limit Check
        const applied_count =
            await CouponApplied.count({

                where: {

                    coupon_id:
                        coupon.id,
                    cus_id:
                        customer_id,

                    status: 1,

                    del_status: 0

                }

            });

        if (
            applied_count >=
            coupon.usage_limit
        ) {

            return res.json({

                status: 0,

                message:
                    "Coupon usage limit exceeded"

            });

        }

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
        await CouponApplied.create({

            cus_id:
                customer_id,

            coupon_id:
                coupon.id,

            coupon_code:
                coupon.code,

            percentage:
                coupon.percentage,

            used_at:
                null,

            status: 0,

            del_status: 0

        });


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

        const customer_id =
            req.user.id;
        console.log("CUSTOMER ID:", customer_id);
        // ✅ Check Customer
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
                            'end_date'
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

                        let branch_data = [];

                        // ✅ Branch Fetch
                        if (
                            data.Coupon &&
                            data.Coupon.branch_ids
                        ) {

                            let branch_ids = [];

                            try {

                                branch_ids =
                                    JSON.parse(
                                        data.Coupon.branch_ids
                                    );

                            } catch (e) {

                                branch_ids = [];

                            }

                            branch_data =
                                await Branch.findAll({

                                    where: {
                                        id:
                                            branch_ids
                                    },

                                    attributes: [
                                        'id',
                                        'name',
                                        'open_time',
                                        'close_time'
                                    ]

                                });

                            // ✅ Branch Time Format
                            branch_data =
                                branch_data.map(
                                    branch => {

                                        const b =
                                            branch.toJSON();

                                        b.open_time =
                                            b.open_time
                                                ? moment(
                                                    b.open_time,
                                                    'HH:mm:ss'
                                                ).format(
                                                    'hh:mm A'
                                                )
                                                : null;

                                        b.close_time =
                                            b.close_time
                                                ? moment(
                                                    b.close_time,
                                                    'HH:mm:ss'
                                                ).format(
                                                    'hh:mm A'
                                                )
                                                : null;

                                        return b;

                                    }
                                );

                        }

                        // ✅ Branch Data
                        data.branches =
                            branch_data;

                        return data;

                    }
                )

            );

        // ✅ Response
        return res.json({

            status: 1,

            message:
                "Coupon List Fetch Successfully",

            data:
                finalData

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
            slot
        } = req.body;


        if (!branch_id) {

            return res.json({

                status: 0,
                message: "Branch ID is required"

            });

        }


        if (!appointment_date || !slot) {

            return res.json({

                status: 0,
                message: "Appointment date and slot are required"

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


        const branch = await Branch.findOne({

            where: {

                id: branch_id,
                status: 1,
                del_status: 0

            }

        });

        if (!branch) {

            return res.json({

                status: 0,
                message: "Branch not found"

            });

        }


        const alreadyAppointment = await Appointment.findOne({

            where: {

                cus_id: customer_id,
                br_id: branch_id,
                appointment_date: appointment_date,
                slot: slot

            }

        });

        if (alreadyAppointment) {

            return res.json({

                status: 0,
                message: "Appointment already booked for this slot"

            });

        }


        const appointment = await Appointment.create({

            cus_id: customer_id,

            br_id: branch_id,

            br_name: branch.branch_name || branch.name,

            appointment_date: appointment_date,

            slot: slot,

            status: 0,

            cancel_by: null,

            cancel_reason: null

        });

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

        return res.json({

            status: 1,

            message: "Appointments fetched successfully",

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

        const customer_id = req.user.id;

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
        // MERCHANT SEARCH
        // =========================

        const merchants = await Merchant.findAll({

            where: {
                name: {
                    [Op.iLike]: `%${query}%`
                }
            }, attributes: [
                'id',
                // 'merchant_id',
                'bus_name',
            ]

            // include: [
            //     {
            //         model: Branch,
            //         required: false
            //     }
            // ]

        });

        // =========================
        // BRANCH SEARCH
        // =========================

        const branches = await Branch.findAll({

            where: {
                name: {
                    [Op.iLike]: `%${query}%`
                }
            }, attributes: [
                'id',
                // 'merchant_id',
                'name',
            ]

        });

        // =========================
        // COUPON SEARCH
        // =========================

        const coupons = await Coupon.findAll({

            where: {

                [Op.or]: [

                    {
                        code: {
                            [Op.iLike]: `%${query}%`
                        }
                    }

                ]

            },

            attributes: [
                'id',
                'branch_ids',
                'code'
            ]

        });

        // =========================
        // FORMAT RESPONSE
        // =========================

        let results = [];

        // MERCHANTS
        merchants.forEach((item) => {

            results.push({

                type: "merchant",
                // id: item.id,
                // name: item.name,
                data: item

            });

        });

        // BRANCHES
        branches.forEach((item) => {

            results.push({

                type: "branch",
                // id: item.id,
                // name: item.name,
                data: item

            });

        });

        // COUPONS
        coupons.forEach((item) => {

            results.push({

                type: "coupon",
                // id: item.id,
                // name: item.title,
                data: item

            });

        });

        return res.json({

            status: 1,
            message: "Search results fetched successfully",
            total: results.length,
            data: results

        });

    }
    catch (err) {

        console.log("SEARCH ERROR:", err);

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