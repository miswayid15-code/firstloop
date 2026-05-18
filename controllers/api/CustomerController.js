const {
    Merchant,
    Coupon,
    RefreshToken,
    Branch,
    Receptionist,
    CustomerFp,
    Customer,
    Banner
} = require('../../models');

const bcrypt = require('bcryptjs');
const { parsePhoneNumber } = require('libphonenumber-js');
const jwt = require('jsonwebtoken');

const sendMail = require('../../helpers/sendMail');
const RegisterTemplate = require('../../helpers/RegisterTemplate');
const ResetsTemplate = require('../../helpers/ResetsTemplate');
const { otpTemplate } = require('../../helpers/mailTemplate');
const { Op } = require('sequelize');
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

        let phoneNumber;

        // validate phone
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

        const lat = req.body?.lat || null;

        const lon = req.body?.lon || null;

        // optional customer login
        const customerId = req.user ? req.user.id : null;

        const baseUrl = process.env.APP_URL;

        const branches = await Branch.findAll({

            where: {
                status: 1,
                del_status: 0
            },

            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'lat',
                'lon',
                'address',
                
            ],

            order: [['id', 'DESC']]

        });

        if (branches.length === 0) {

            return res.json({
                status: 0,
                message: "Branch list not found"
            });

        }

        const data = branches.map(branch => {

            const item = branch.toJSON();

     

            // optional user lat/lon
            item.user_lat = lat;

            item.user_lon = lon;

            return item;

        });

        return res.json({

            status: 1,

            customer_id: customerId,

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

