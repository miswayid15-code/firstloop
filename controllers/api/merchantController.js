const { Merchant, RefreshToken } = require('../../models');
const bcrypt = require('bcryptjs');
const { parsePhoneNumber } = require('libphonenumber-js');
const jwt = require('jsonwebtoken');
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