const { Merchant, Coupon, RefreshToken, Branch, Receptionist, MerchantFp, BranchTiming, UserNotificationToken, CouponApplied } = require('../../models');
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
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { sendPushNotification } = require("../../helpers/notificationHelper");
exports.registerStep1 = async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            password,
            country_code
        } = req.body;

        let phoneNumber;
        let nationalNumber;
        let callingCode;

        // =========================
        // PHONE VALIDATION
        // =========================

        try {

            const cleanPhone = phone.replace(/\s+/g, '');


            const fullPhone = cleanPhone.startsWith('+')
                ? cleanPhone
                : country_code + cleanPhone;

            const num = parsePhoneNumber(fullPhone);

            if (!num.isValid()) {

                return res.json({
                    status: 0,
                    message: "Invalid phone number"
                });

            }

            callingCode = `+${num.countryCallingCode}`;
            nationalNumber = num.nationalNumber;


            phoneNumber = num.number;



        } catch (err) {

            console.log("PHONE ERROR:", err);

            return res.json({
                status: 0,
                message: "Invalid phone format"
            });

        }

        // =========================
        // PHONE EXISTS CHECK
        // =========================

        const phexists = await Merchant.findOne({

            where: {
                country_code: callingCode,
                phone: nationalNumber
            }

        });

        if (phexists) {

            return res.json({
                status: 0,
                message: "Phone already exists"
            });

        }

        // =========================
        // EMAIL EXISTS CHECK
        // =========================

        const exists = await Merchant.findOne({
            where: { email }
        });

        if (exists) {

            return res.json({
                status: 0,
                message: "Email already exists"
            });

        }

        // =========================
        // PROFILE IMAGE UPLOAD
        // =========================

        let profileImage = '';

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
        // CREATE MERCHANT
        // =========================

        const merchant = await Merchant.create({

            name,
            email,

            // separated storage
            country_code: callingCode,
            phone: nationalNumber,

            password: hashedPassword,

            profile_image: profileImage,

            status: 0

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
                expiresIn: '1d'
            }
        );

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
                expiresIn: '7d'
            }
        );

        // =========================
        // SAVE REFRESH TOKEN
        // =========================

        await RefreshToken.create({

            user_id: merchant.id,

            user_type: 'merchant',

            token: refreshToken,

            expires_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            )

        });

        // =========================
        // SEND MAIL
        // =========================

        try {

            await sendMail(

                email,

                'Merchant Registration Successful',

                RegisterTemplate(
                    'merchant',
                    merchant.name
                )

            );

            // console.log("Registration mail sent");

        } catch (mailErr) {

            console.log("MAIL ERROR:", mailErr);

        }

        // await sendPushNotification({
        //     token: customer.notification_token,
        //     title: "Order Placed",
        //     body: "Your order has been placed successfully.",

        // });



        // =========================
        // RESPONSE
        // =========================

        return res.json({

            status: 1,

            message: "Basic Info Saved",

            user_id: merchant.id,

            user_type: 'merchant',

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

exports.registerStep2 = async (req, res) => {
    try {
        // console.log("Body",req.body)
        const merchant = await Merchant.findByPk(req.user.id);

        if (!merchant) {
            return res.json({ status: 0, message: "Merchant not found" });
        }


        let fileData = {
            profile_image: merchant.profile_image,
            brand_image: merchant.brand_image,
            document: merchant.document
        };

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {

                const cleanPath = file.path.replace(/\\/g, '/');

                if (file.fieldname === 'profile_image') {
                    fileData.profile_image = cleanPath;
                }

                if (file.fieldname === 'brand_image') {
                    fileData.brand_image = cleanPath;
                }

                if (file.fieldname === 'document') {
                    fileData.document = cleanPath;
                }

            });
        }


        if (req.body.phone) {

            try {

                // remove spaces
                const cleanPhone = req.body.phone.replace(/\s+/g, '');

                // separate country code
                const countryCode = req.body.country_code || '';

                // full number for validation
                const fullPhone = cleanPhone.startsWith('+')
                    ? cleanPhone
                    : countryCode + cleanPhone;

                const num = parsePhoneNumber(fullPhone);

                if (!num.isValid()) {

                    return res.json({
                        status: 0,
                        message: "Invalid phone number"
                    });

                }

                // save separately
                req.body.country_code = `+${num.countryCallingCode}`;
                req.body.phone = num.nationalNumber;

                // console.log("COUNTRY CODE:", req.body.country_code);
                // console.log("PHONE:", req.body.phone);

            } catch (err) {

                return res.json({
                    status: 0,
                    message: "Invalid phone format"
                });

            }

            // duplicate check
            const phoneExists = await Merchant.findOne({

                where: {

                    country_code: req.body.country_code,

                    phone: req.body.phone,

                    id: {
                        [Op.ne]: merchant.id
                    }

                }

            });

            if (phoneExists) {

                return res.json({
                    status: 0,
                    message: "Phone number already exists"
                });

            }

        }



        if (req.body.email) {

            const emailExists = await Merchant.findOne({
                where: {
                    email: req.body.email,
                    id: {
                        [Op.ne]: merchant.id
                    }
                }
            });

            if (emailExists) {

                return res.json({
                    status: 0,
                    message: "Email already exists"
                });

            }

        }

        await merchant.update({
            ...req.body,
            ...fileData,

        });
        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant.id,
                user_type: "merchant"
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

        return res.json({
            status: 1,
            message: "Successfully Submitted"
        });

    } catch (err) {
        console.log(err);
        return res.json({ status: 0, message: "Error" });
    }
};

exports.fetchmerchant = async (req, res) => {

    try {

        const merchant = await Merchant.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
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
                data[field] = baseUrl + '/' + data[field].replace(/\\/g, '/');
            } else {
                data[field] = null;
            }
        });
        const br = await Branch.findAll({
            where: {
                merchant_id: merchant.id
            }
        })

        return res.json({
            status: 1,
            data
        });

    } catch (err) {
        console.log(err);
        return res.json({ status: 0, message: "Error" });
    }
};
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
            return res.json({
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
            return res.json({
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
                expiresIn: "1d"
            }
        );

        return res.json({
            status: 1,
            access_token: newAccessToken
        });

    } catch (err) {
        console.log("err:", err);

        return res.json({
            status: 0,
            message: "Token expired or invalid"
        });
    }
};
exports.login = async (req, res) => {

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
                expiresIn: '7d'
            }
        );

        await RefreshToken.create({
            user_id: merchant.id,
            user_type: 'merchant',
            token: refreshToken,
            expires_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
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
                expiresIn: '1d'
            }
        );

        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant.id,
                user_type: "merchant"
            }
        });



        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "🎊 Welcome!",
                body: "Login successful! Enjoy using FirstPass. 😊",
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }
        return res.json({
            status: 1,
            message: "Login successful",
            user_id: merchant.id,
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

        await RefreshToken.destroy({
            where: {
                user_id: req.user.id,
                user_type: 'merchant'
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

exports.dashboard = async (req, res) => {

    try {

        const merchant = await Merchant.findByPk(req.user.id, {

            include: [

                {
                    model: Coupon,
                    where: {
                        del_status: 0,
                        status: 1

                    },
                    required: false
                },
                {
                    model: Coupon,
                    where: {
                        del_status: 0,
                        status: 1

                    },
                    required: false

                },
                {
                    model: Branch,
                    where: {
                        del_status: 0,
                        status: 1
                    },
                    attributes: ['id', 'name', 'address', 'phone', 'profile_image', 'lat', 'lon', 'status', 'open_time', 'close_time', 'merchant_id', 'status'],
                    required: false
                },

                {
                    model: Receptionist,
                    where: {
                        del_status: 0,
                        status: 1
                    },
                    attributes: ['id', 'name', 'email', 'phone', 'profile_image', 'branch_id', 'status'],
                    required: false
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

        // console.log("DASHBOARD DATA:", data);
        if (data.profile_image) {

            data.profile_image =
                baseUrl + '/' +
                data.profile_image.replace(/\\/g, '/');

        } else {

            data.profile_image = null;

        }

        // Branch images
        data.Branches = data.Branches.map(branch => ({
            ...branch,
            profile_image: branch.profile_image
                ? `${baseUrl}/${branch.profile_image.replace(/\\/g, "/")}`
                : null
        }));

        // Receptionist images
        data.Receptionists = data.Receptionists.map(receptionist => ({
            ...receptionist,
            profile_image: receptionist.profile_image
                ? `${baseUrl}/${receptionist.profile_image.replace(/\\/g, "/")}`
                : null
        }));
        const redeemedUsers = await CouponApplied.count({
            where: {
                status: 1
            },
            include: [
                {
                    model: Coupon,
                    required: true,
                    attributes: [],
                    where: {
                        merchant_id: merchant.id
                    }
                }
            ]
        });
        return res.json({
            status: 1,
            message: "Dashboard data fetched successfully",
            data: {
                merchant_name: merchant.bus_name || merchant.name,
                merchant_status: merchant.status,
                merchant_id: merchant.id,
                merchant_profile_image: data.profile_image,

                count_coupon: merchant.Coupons.length,
                count_branch: merchant.Branches.length,
                count_receptionist: merchant.Receptionists.length,

               redeemed_users: redeemedUsers,

                branch_list: data.Branches,
                receptionist_list: data.Receptionists

            }
        });

    } catch (err) {

        console.log("DASHBOARD ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

exports.branch_list = async (req, res) => {

    try {

        const merchant = await Merchant.findByPk(req.user.id);

        if (!merchant) {

            return res.json({
                status: 0,
                message: "Merchant not found"
            });

        }

        const branch = await Branch.findAll({

            where: {
                merchant_id: merchant.id,
                del_status: 0
            },

            order: [['id', 'DESC']]

        });

        const branchData = branch.map((item) => {

            const data = item.toJSON();

            data.profile_image = data.profile_image
                ? baseUrl + '/' + data.profile_image.replace(/\\/g, '/')
                : null;

            return data;

        });

        return res.json({

            status: 1,
            message: "Branch list fetched successfully",
            data: branchData

        });

    } catch (err) {

        console.log("ERROR:", err);

        return res.json({

            status: 0,
            message: err.message

        });

    }

};

exports.receptionist_list = async (req, res) => {

    try {

        const merchant = await Merchant.findByPk(req.user.id);

        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        const receptionists = await Receptionist.findAll({
            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'country_code',
                'profile_image',
                'branch_id',
                'merchant_id',
                'status',
                'createdAt',
                'updatedAt'
            ],
            where: {
                merchant_id: merchant.id,
                del_status: 0
            },
            include: [
                {
                    model: Branch,
                    attributes: ['id', 'name', 'address', 'phone', 'email'],
                    required: false
                }
            ],
            order: [['id', 'DESC']]
        });

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

        const data = receptionists.map(item => {
            const receptionist = item.toJSON();


            receptionist.profile_image = receptionist.profile_image
                ? baseUrl + '/' + receptionist.profile_image.replace(/\\/g, '/')
                : null;


            delete receptionist.password;


            receptionist.branch_name = receptionist.Branch ? receptionist.Branch.name : null;

            return receptionist;
        });

        return res.json({
            status: 1,
            message: "Receptionist list fetched successfully",
            data: data
        });

    } catch (err) {

        console.log("ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
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

        const merchant = await Merchant.findOne({
            where: { email }
        });

        if (!merchant) {

            return res.status(404).json({
                status: 0,
                message: "Merchant not found"
            });

        }

        // expire old pending otp
        await MerchantFp.update(
            {
                status: 2
            },
            {
                where: {
                    mer_id: merchant.id,
                    status: 0
                }
            }
        );

        // const otp = Math.floor(100000 + Math.random() * 900000);
        const otp = 11111;
        // create new otp
        await MerchantFp.create({
            mer_id: merchant.id,
            otp: otp,
            status: 0,
            expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
        });

        // send mail
        await sendMail(
            email,
            'Forget Password OTP',
            otpTemplate(otp, 'merchant')
        );
        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant.id,
                user_type: "merchant"
            }
        });



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

        // validation
        if (!email || !otp || !password) {

            return res.status(400).json({
                status: 0,
                message: "Email, OTP and password are required"
            });

        }


        const merchant = await Merchant.findOne({
            where: {
                email: email
            }
        });

        if (!merchant) {

            return res.status(404).json({
                status: 0,
                message: "Merchant not found"
            });

        }

        // check otp
        const otp_check = await MerchantFp.findOne({
            where: {
                mer_id: merchant.id,
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

        // check expiry
        if (new Date() > new Date(otp_check.expires_at)) {

            await otp_check.update({
                status: 2
            });

            return res.status(400).json({
                status: 0,
                message: "OTP expired"
            });

        }

        // hash password
        const hashedPassword = await bcrypt.hash(
            password.toString(),
            10
        );

        // update merchant password
        await merchant.update({
            password: hashedPassword
        });

        // mark otp completed
        await otp_check.update({
            status: 1
        });

        // send success mail
        await sendMail(
            email,
            'Password Reset Successful',
            ResetsTemplate('merchant')
        );

        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant.id,
                user_type: "merchant"
            }
        });



        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "✅ Success!",
                body: "Your password has been reset successfully. 🔐"
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }

        // final response
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

exports.firebase_reg = async (req, res) => {

    try {

        console.log("\n========== FIREBASE GOOGLE LOGIN ==========");

        console.log("\nREQUEST BODY:");
        console.log(req.body);

        const {
            provider,
            idToken,
            email,
            name
        } = req.body;

        console.log("\nVALIDATING REQUEST...");

        // validation
        if (!provider || !idToken || !email || !name) {

            console.log("\nVALIDATION FAILED");

            return res.status(400).json({
                status: 0,
                message: "All fields are required"
            });

        }

        console.log("\nVERIFYING FIREBASE TOKEN...");

        // verify firebase token
        const decodedToken = await admin
            .auth()
            .verifyIdToken(idToken);

        console.log("\nTOKEN VERIFIED");

        console.log("\nDECODED TOKEN:");
        console.log(decodedToken);

        // verify email
        if (decodedToken.email !== email) {

            console.log("\nEMAIL VERIFICATION FAILED");

            return res.status(401).json({
                status: 0,
                message: "Invalid firebase user"
            });

        }

        console.log("\nEMAIL VERIFIED");

        const firebase_uid = decodedToken.uid;

        console.log("\nCHECKING EXISTING MERCHANT...");

        // check existing merchant
        let merchant = await Merchant.findOne({
            where: {
                email: email
            }
        });

        // create merchant
        if (!merchant) {

            console.log("\nCREATING NEW MERCHANT...");

            merchant = await Merchant.create({
                name: name,
                email: email,
                providerId: provider,
                firebase_uid: firebase_uid,
                login_type: 'google',
                password: null,
                status: 1
            });

            console.log("\nNEW MERCHANT CREATED");

        } else {

            console.log("\nMERCHANT ALREADY EXISTS");

        }

        console.log("\nGENERATING ACCESS TOKEN...");

        // generate access token
        const accessToken = jwt.sign(
            {
                id: merchant.id,
                email: merchant.email,
                token_type: 'access'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        console.log("\nGENERATING REFRESH TOKEN...");

        // generate refresh token
        const refreshToken = jwt.sign(
            {
                id: merchant.id,
                email: merchant.email,
                token_type: 'refresh'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        console.log("\nSAVING REFRESH TOKEN...");

        // save refresh token
        await RefreshToken.create({
            user_id: merchant.id,
            user_type: 'merchant',
            token: refreshToken,
            expires_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            )
        });

        console.log("\nLOGIN SUCCESS");

        return res.status(200).json({
            status: 1,
            message: "Google login success",
            access_token: accessToken,
            refresh_token: refreshToken,
            data: merchant
        });

    } catch (err) {

        console.log("\n========== FIREBASE LOGIN ERROR ==========");
        console.log(err);
        console.log("=========================================\n");

        return res.status(500).json({
            status: 0,
            message: err.message
        });

    }

};

exports.change_status_br = async (req, res) => {
    try {
        const { id, status } = req.body;

        const branch = await Branch.findOne({
            where: {
                id: id,
                del_status: 0
            }
        });

        if (!branch) {
            return res.status(404).json({
                status: 0,
                message: "Branch not found"
            });
        }

        await Branch.update(
            { status: status },
            {
                where: {
                    id: id
                }
            }
        );

        const notification_text =
            status === 1
                ? {
                    title: "🟢 Branch Activated",
                    body: "Your branch has been activated successfully and is now available to customers. 🎉",
                }
                : {
                    title: "🔴 Branch Deactivated",
                    body: "Your branch has been deactivated.",
                };
        const receptionistNotification =
            status === 1
                ? {
                    title: "🟢 Branch Activated",
                    body: "Your Branch account has been activated successfully. 🎉",
                }
                : {
                    title: "🔴 Branch Deactivated",
                    body: "Your Branch account has been deactivated. Please contact your merchant for assistance.",
                };


        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant.id,
                user_type: "merchant"
            }
        });
        const receptionist = await Receptionist.findOne({
            where: {
                branch_id: branch.id,
            }
        });

        const receptionToken = await UserNotificationToken.findOne({
            where: {
                user_id: receptionist.id,
                user_type: "receptionist"
            }
        });

        try {
            await sendPushNotification({
                token: notificationToken?.token,
                title: notification_text.title,
                body: notification_text.body,
            });
            await sendPushNotification({
                token: receptionToken.token,
                title: receptionistNotification.title,
                body: receptionistNotification.body,
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }

        return res.status(200).json({
            status: 1,
            message: "Branch status updated successfully"
        });

    } catch (err) {
        console.log("err", err);
        return res.status(500).json({
            status: 0,
            message: "Failed to update status"
        });
    }
};

exports.change_status_res = async (req, res) => {
    try {
        const { id, status } = req.body;

        const receptionist = await Receptionist.findOne({
            where: {
                id: id,
                del_status: 0
            }
        });

        if (!receptionist) {
            return res.status(404).json({
                status: 0,
                message: "Receptionist is not found"
            });
        }

        await Receptionist.update(
            { status: status },
            {
                where: {
                    id: id
                }
            }
        );


        const merchantNotification =
            status === 1
                ? {
                    title: "🟢 Receptionist Activated",
                    body: "Your receptionist has been activated successfully. 🎉",
                }
                : {
                    title: "🔴 Receptionist Deactivated",
                    body: "Your receptionist has been deactivated.",
                };

        const receptionistNotification =
            status === 1
                ? {
                    title: "🟢 Account Activated",
                    body: "Your receptionist account has been activated successfully. 🎉",
                }
                : {
                    title: "🔴 Account Deactivated",
                    body: "Your receptionist account has been deactivated. Please contact your merchant for assistance.",
                };

        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant.id,
                user_type: "merchant"
            }
        });
        const receptionToken = await UserNotificationToken.findOne({
            where: {
                user_id: receptionist.id,
                user_type: "receptionist"
            }
        });



        try {
            await sendPushNotification({
                token: notificationToken.token,
                title: merchantNotification.title,
                body: merchantNotification.body,
            });

            // Receptionist
            await sendPushNotification({
                token: receptionToken.token,
                title: receptionistNotification.title,
                body: receptionistNotification.body,
            });

        } catch (error) {
            console.error("Push Notification Error:", error);
        }

        return res.status(200).json({
            status: 1,
            message: "Receptionist status updated successfully"
        });

    } catch (err) {
        console.log("err", err);
        return res.status(500).json({
            status: 0,
            message: "Failed to update status"
        });
    }
};