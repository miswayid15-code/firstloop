const { Banner, Receptionist, Merchant, OtpVerify } = require('../../models');
const { sendOtp } = require('../../helpers/sendOtp');
const sendMail = require('../../helpers/sendMail');
exports.banner_list = async (req, res) => {

    try {

        const baseUrl = process.env.APP_URL;

        const banners = await Banner.findAll({

            where: {
                status: 1,
                del_status: 0
            },


            attributes: [
                'id',
                'title',
                'image'
            ],

            order: [['id', 'DESC']]

        });

        if (banners.length === 0) {

            return res.json({
                status: 0,
                message: "Banner list not found"
            });

        }

        const data = banners.map(banner => {

            const item = banner.toJSON();

            item.image = item.image
                ? baseUrl + '/' + item.image.replace(/\\/g, '/')
                : null;

            return item;

        });

        return res.json({

            status: 1,
            data

        });

    } catch (err) {

        console.log(err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

exports.verify_mail = async (req, res) => {
    try {
        const { email, type } = req.body;

        const missingFields = [];

        if (!email) missingFields.push("Email");
        if (!type) missingFields.push("Type");

        if (missingFields.length) {
            return res.json({
                status: 0,
                message: `${missingFields.join(" and ")} ${missingFields.length > 1 ? "are" : "is"} required`
            });
        }

        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();

        let existingUser = null;

        if (type === 'merchant') {
            existingUser = await Merchant.findOne({
                where: { email }
            });
        } else if (type === 'receptionist') {
            existingUser = await Receptionist.findOne({
                where: { email }
            });
        } else {
            return res.json({
                status: 0,
                message: "Invalid type. Must be 'merchant' or 'receptionist'"
            });
        }

        if (existingUser) {
            return res.json({
                status: 0,
                message: "Email already exists"
            });
        }

        await OtpVerify.create({
            mail: email,
            otp: randomOtp,
            status: 0
        });

        await sendMail(
           'minsway01@gmail.com',
            'OTP Sent for Registration',
            sendOtp(randomOtp, type)
        );

        return res.json({
            status: 1,
            message: "OTP sent to email"
        });

    } catch (err) {
        return res.status(500).json({
            status: 0,
            message: err.message
        });
    }
};