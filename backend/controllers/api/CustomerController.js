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
    Wishlist
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
        // console.log("======================================");
        // console.log(req.body);
        // console.log("======================================");
        let phoneNumber;


        try {

            const num = parsePhoneNumber(phone);

            if (!num.isValid()) {

                return res.json({
                    status: 0,
                    message: "Invalid phone"
                });

            }

            phoneNumber = num.number;

        } catch {

            return res.json({
                status: 0,
                message: "Invalid phone format"
            });

        }

        // check phone exists
        const phoneExists = await Customer.findOne({
            where: { phone: phoneNumber }
        });

        if (phoneExists) {

            return res.json({
                status: 0,
                message: "Phone already exists"
            });

        }

        // check email exists
        const emailExists = await Customer.findOne({
            where: { email }
        });

        if (emailExists) {

            return res.json({
                status: 0,
                message: "Email already exists"
            });

        }

        // profile image upload
        let profileImage = '';

        if (req.files && req.files.length > 0) {

            const profileFile = req.files.find(
                file => file.fieldname === 'profile_image'
            );

            if (profileFile) {

                profileImage = profileFile.path.replace(/\\/g, '/');

            }

        }

        // password hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // create customer
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

        // access token
        const accessToken = jwt.sign(
            {
                id: customer.id,
                email: customer.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        // refresh token
        const refreshToken = jwt.sign(
            {
                id: customer.id,
                type: 'customer'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        // save refresh token
        await RefreshToken.create({

            user_id: customer.id,
            user_type: 'customer',
            token: refreshToken,
            expires_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            )

        });

        // send mail
        try {

            await sendMail(
                email,
                'Customer Registration Successful',
                RegisterTemplate('customer', customer.name)
            );

            console.log("Registration mail sent");

        } catch (mailErr) {

            console.log("MAIL ERROR:", mailErr);

        }

        return res.json({

            status: 1,
            message: "Customer Registered Successfully",
            user_id: customer.id,
            user_type: 'customer',
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
                type: 'customer'
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
                email: customer.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
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
            { expiresIn: '1h' }
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
                        [Op.like]:
                            `%${branch_id}%`
                    }

                },

                attributes: [
                    'id',
                    'branch_ids',
                    'code',
                    'percentage',
                    'min_amount',
                    'usage_limit',
                    'start_time',
                    'end_time'
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
                    now >= c.start_time &&
                        now <= c.end_time
                        ? 1
                        : 0;


                c.start_time =
                    c.start_time
                        ? moment(
                            c.start_time,
                            'HH:mm:ss'
                        ).format('hh:mm A')
                        : null;

                c.end_time =
                    c.end_time
                        ? moment(
                            c.end_time,
                            'HH:mm:ss'
                        ).format('hh:mm A')
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

        const coupon_id =
            req.body?.coupon_id ||
            req.query?.coupon_id ||
            null;


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


        if (!coupon) {

            return res.json({

                status: 0,

                message:
                    "Coupon not found"

            });

        }

        // ✅ Current Time
        const now =
            moment().format(
                'HH:mm:ss'
            );

        // ✅ Coupon Active Check
        const is_active =
            now >= coupon.start_time &&
            now <= coupon.end_time;

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
                            'start_time',
                            'end_time'
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

                            data.Coupon.start_time =
                                data.Coupon.start_time
                                    ? moment(
                                        data.Coupon.start_time,
                                        'HH:mm:ss'
                                    ).format(
                                        'hh:mm A'
                                    )
                                    : null;

                            data.Coupon.end_time =
                                data.Coupon.end_time
                                    ? moment(
                                        data.Coupon.end_time,
                                        'HH:mm:ss'
                                    ).format(
                                        'hh:mm A'
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