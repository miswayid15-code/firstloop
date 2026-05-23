const { Receptionist, RefreshToken, Branch, Merchant } = require('../../models');
const bcrypt = require('bcryptjs');
const { parsePhoneNumber } = require('libphonenumber-js');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {

    try {

        const { name, email, phone, password, branch_id,country_code } = req.body;

        // merchant check
        const merchant = await Merchant.findByPk(req.user.id);

        if (!merchant) {

            return res.json({
                status: 0,
                message: "Merchant not found"
            });

        }

  let nationalNumber;
        let callingCode;
        let phoneNumber;

        try {

            // console.log("ORIGINAL PHONE:", phone);
            // console.log("COUNTRY CODE:", country_code);

            const cleanPhone =
                phone.replace(/\s+/g, '');

            // console.log("CLEAN PHONE:", cleanPhone);

            const fullPhone =
                cleanPhone.startsWith('+')
                    ? cleanPhone
                    : country_code + cleanPhone;

            // console.log("FULL PHONE:", fullPhone);

            const num =
                parsePhoneNumber(fullPhone);

            // console.log("PARSED PHONE:", num);

            if (!num.isValid()) {

                // console.log("PHONE VALIDATION FAILED");

                return res.json({
                    status: 0,
                    message: "Invalid phone number"
                });

            }

            callingCode =
                `+${num.countryCallingCode}`;

            nationalNumber =
                num.nationalNumber;

            phoneNumber =
                num.number;

            // console.log("CALLING CODE:", callingCode);
            // console.log("NATIONAL NUMBER:", nationalNumber);
            // console.log("INTERNATIONAL NUMBER:", phoneNumber);

        } catch (err) {

            // console.log("PHONE ERROR:", err);

            return res.json({
                status: 0,
                message: "Invalid phone format"
            });

        }
        // branch check
        const branch = await Branch.findByPk(branch_id);

        if (!branch) {

            return res.json({
                status: 0,
                message: "Branch not found"
            });

        }

        // phone exists
        const phexists = await Receptionist.findOne({
            where: { phone: phoneNumber }
        });

        if (phexists) {

            return res.json({
                status: 0,
                message: "Phone already exists"
            });

        }

        // email exists
        const exists = await Receptionist.findOne({
            where: { email }
        });

        if (exists) {

            return res.json({
                status: 0,
                message: "Email already exists"
            });

        }

        // image upload
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

        // create receptionist
        const receptionist = await Receptionist.create({

            merchant_id: merchant.id,
            branch_id,

            name,
            email,
            phone: phoneNumber,
            country_code,
            password: hashedPassword,

            profile_image: profileImage,

            status: 1,
            del_status: 0

        });

        // access token
        // access token
        const accessToken = jwt.sign(
            {
                id: receptionist.id,
                email: receptionist.email,
                user_type: 'receptionist',
                token_type: 'access'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // refresh token
        const refreshToken = jwt.sign(
            {
                id: receptionist.id,
                user_type: 'receptionist',
                token_type: 'refresh'
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
        // save refresh token
        await RefreshToken.create({

            user_id: receptionist.id,
            user_type: 'receptionist',
            token: refreshToken,

            expires_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            )

        });

        return res.json({

            status: 1,
            message: "Basic Info Saved",

            user_id: receptionist.id,
            user_type: 'receptionist',

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
        const receptionist = await Receptionist.findOne({ where: { email } })
        if (!receptionist) {
            return res.json({ status: 0, message: "Invalid email or password" });
        }
        const match = await bcrypt.compare(password, receptionist.password);
        if (!match) {
            return res.json({ status: 0, message: "Invalid email or password" });
        }
        const refreshToken = jwt.sign(
            {
                id: receptionist.id,
                user_type: 'receptionist',
                token_type: 'refresh'
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
        await RefreshToken.create({
            user_id: receptionist.id,
            user_type: 'receptionist',

            token: refreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        const accessToken = jwt.sign(
            {
                id: receptionist.id,
                email: receptionist.email,
                user_type: 'receptionist',
                token_type: 'access'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        return res.json({
            status: 1,
            message: "Login successful",
            user_id: receptionist.id,
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
}

exports.logout = async (req, res) => {
    try {

        await RefreshToken.destroy({
            where: {
                user_id: req.user.id,
                user_type: 'receptionist'
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

