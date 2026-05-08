const { Merchant, Coupon, RefreshToken, Branch, Receptionist, MerchantFp } = require('../../models');
const bcrypt = require('bcryptjs');
const { parsePhoneNumber } = require('libphonenumber-js');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const sendMail = require('../../helpers/sendMail');
const { otpTemplate } = require('../../helpers/mailTemplate');

// const mapFiles = require('../../helpers/merchantFileMapper');

const fs = require('fs');
const path = require('path');
exports.registerStep1 = async (req, res) => {
    try {

        const { name, email, phone, password } = req.body;

        let phoneNumber;

        try {

            const num = parsePhoneNumber(phone);

            if (!num.isValid()) {
                return res.json({ status: 0, message: "Invalid phone" });
            }

            phoneNumber = num.number;

        } catch {
            return res.json({ status: 0, message: "Invalid phone format" });
        }


        const phexists = await Merchant.findOne({
            where: { phone: phoneNumber }
        });

        if (phexists) {
            return res.json({
                status: 0,
                message: "Phone already exists"
            });
        }

        const exists = await Merchant.findOne({ where: { email } });

        if (exists) {
            return res.json({ status: 0, message: "Email already exists" });
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


        const hashedPassword = await bcrypt.hash(password, 10);


        const merchant = await Merchant.create({
            name,
            email,
            phone: phoneNumber,
            password: hashedPassword,
            profile_image: profileImage,
            status: 0
        });


        const accessToken = jwt.sign(
            { id: merchant.id, email: merchant.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );


        const refreshToken = jwt.sign(
            {
                id: merchant.id,
                type: 'merchant'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );


        await RefreshToken.create({
            user_id: merchant.id,
            user_type: 'merchant',
            token: refreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });


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

        await merchant.update({
            ...req.body,
            ...fileData,
            status: 0
        });

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
    1
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
exports.login = async (req, res) => {

    try {
        const { email, password } = req.body;
        const merchant = await Merchant.findOne({ where: { email } })
        if (!merchant) {
            return res.json({ status: 0, message: "Invalid email or password" });
        }


        const match = await bcrypt.compare(password, merchant.password);
        if (!match) {
            return res.json({ status: 0, message: "Invalid email or password" });
        }
        const refreshToken = jwt.sign(
            {
                id: merchant.id,
                type: 'merchant'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        await RefreshToken.create({
            user_id: merchant.id,
            user_type: 'merchant',

            token: refreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        const accessToken = jwt.sign(
            { id: merchant.id, email: merchant.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
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
                    model: Branch,
                    where: {
                        del_status: 0,
                        status: 1
                    },
                    required: false
                },

                {
                    model: Receptionist,
                    where: {
                        del_status: 0,
                        status: 1
                    },
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

        return res.json({
            status: 1,
            message: "Dashboard data fetched successfully",
            data: {

                count_coupon: merchant.Coupons.length,
                count_branch: merchant.Branches.length,
                count_receptionist: merchant.Receptionists.length,

                redeemed_users: 0,

                branch_list: merchant.Branches,
                receptionist_list: merchant.Receptionists

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

        return res.json({
            status: 1,
            message: "Branch list fetched successfully",
            data: branch
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

        const receptionist = await Receptionist.findAll({
            where: {
                merchant_id: merchant.id,
                del_status: 0
            },
            order: [['id', 'DESC']]
        });

        return res.json({
            status: 1,
            message: "Receptionist list fetched successfully",
            data: receptionist
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
            return res.json({
                status: 0,
                message: "Email is required"
            });
        }

        const merchant = await Merchant.findOne({
            where: {
                email
            }
        });

        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);

        await merchant.update({
            otp: otp
        });

        // check existing pending otp
        const existingOtp = await MerchantFp.findOne({
            where: {
                mer_id: merchant.id,
                status: 0
            }
        });

        // if already exists update
        if (existingOtp) {

            await existingOtp.update({
                otp: otp
            });

        } else {

            // otherwise insert new
            await MerchantFp.create({
                mer_id: merchant.id,
                otp: otp,
                status: 0
            });

        }

        // send mail
        await sendMail(
            email,
            'Forget Password OTP',
            otpTemplate(otp, 'merchant')
        );

        return res.json({
            status: 1,
            message: "OTP sent successfully"
        });

    } catch (err) {

        console.log("ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

exports.reset_ps = async (req, res) => {

    try {

        const { otp, password } = req.body;

        if (!otp || !password) {
            return res.json({
                status: 0,
                message: "OTP and password are required"
            });
        }

        const otp_check = await MerchantFp.findOne({
            where: {
                otp: otp,
                status: 0
            }
        });

        if (!otp_check) {
            return res.json({
                status: 0,
                message: "Invalid OTP"
            });
        }

        // check otp expiry (10 minutes)
        const otpTime = new Date(otp_check.updatedAt).getTime();
        const currentTime = new Date().getTime();

        const diffMinutes = (currentTime - otpTime) / (1000 * 60);

        // expired
        if (diffMinutes > 10) {

            await otp_check.update({
                status: 2 // expired
            });

            return res.json({
                status: 0,
                message: "OTP expired"
            });

        }

        const merchant = await Merchant.findByPk(otp_check.mer_id);

        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        const hashedPassword = await bcrypt.hash(password.toString(), 10);

        // update password
        await merchant.update({
            password: hashedPassword
        });

        // mark otp as used
        await otp_check.update({
            status: 1
        });

        return res.json({
            status: 1,
            message: "Password reset successfully"
        });

    } catch (err) {

        console.log("ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};