const { Banner, Receptionist, Merchant, OtpVerify, CustomerOtpVerify, Customer, AppSetting, Notification, Support } = require('../../models');
const { sendOtp } = require('../../helpers/sendOtp');
const sendMail = require('../../helpers/sendMail');
const { where } = require('sequelize');
exports.banner_list = async (req, res) => {

    try {

        const baseUrl = process.env.APP_URL;

        const { country_code } = req.body;
        console.log("country_code", country_code)

        const whereClause = {
            status: 1,
            del_status: 0
        };

        if (country_code) {
            whereClause.country_code = country_code;
        }

        const banners = await Banner.findAll({

            where: whereClause,


            attributes: [
                'id',
                'title',
                'image',
                'country_code'
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
                ? baseUrl + '/uploads/Banner/' + item.image.replace(/\\/g, '/')
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

        // const randomOtp = 111111;
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

        const existingOtp = await OtpVerify.findOne({
            where: { mail: email }
        });

        if (existingOtp) {
            await existingOtp.update({
                otp: randomOtp,
                status: 0
            });
        } else {
            await OtpVerify.create({
                mail: email,
                otp: randomOtp,
                status: 0
            });
        }

        await sendMail(
            email,
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

exports.verify_otp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const missingFields = [];

        if (!email) missingFields.push("Email");
        if (!otp) missingFields.push("OTP");

        if (missingFields.length) {
            return res.json({
                status: 0,
                message: `${missingFields.join(" and ")} ${missingFields.length > 1 ? "are" : "is"} required`
            });
        }

        const record = await OtpVerify.findOne({
            where: { mail: email }
        });

        if (!record) {
            return res.json({
                status: 0,
                message: "No OTP record found for this email"
            });
        }

        if (record.otp != otp) {
            return res.json({
                status: 0,
                message: "Invalid OTP"
            });
        }

        // Delete OTP after successful verification
        await record.destroy();

        return res.json({
            status: 1,
            message: "OTP verified successfully"
        });

    } catch (err) {
        console.log("Error:", err);

        return res.status(500).json({
            status: 0,
            message: "An error occurred while verifying the OTP"
        });
    }
};


exports.customer_verify_mail = async (req, res) => {
    try {
        const { email } = req.body;
        type = "customer";


        if (!email) {
            return res.json({
                status: 0,
                message: "Email is empty"
            });
        }

        // const randomOtp = 111111;
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();

        existingUser = await Customer.findOne({
            where: { email }
        });

        if (existingUser) {
            return res.json({
                status: 0,
                message: "Email already exists"
            });
        }

        const existingOtp = await CustomerOtpVerify.findOne({
            where: { mail: email }
        });

        if (existingOtp) {
            await existingOtp.update({
                otp: randomOtp,
                status: 0
            });
        } else {
            await CustomerOtpVerify.create({
                mail: email,
                otp: randomOtp,
                status: 0
            });
        }

        await sendMail(
            email,
            'OTP Sent for Registration Verification',
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

exports.customer_verify_otp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const missingFields = [];

        if (!email) missingFields.push("Email");
        if (!otp) missingFields.push("OTP");

        if (missingFields.length) {
            return res.json({
                status: 0,
                message: `${missingFields.join(" and ")} ${missingFields.length > 1 ? "are" : "is"} required`
            });
        }

        const record = await CustomerOtpVerify.findOne({
            where: { mail: email }
        });

        if (!record) {
            return res.json({
                status: 0,
                message: "No OTP record found for this email"
            });
        }

        if (record.otp != otp) {
            return res.json({
                status: 0,
                message: "Invalid OTP"
            });
        }

        // Delete OTP after successful verification
        await record.destroy();

        return res.json({
            status: 1,
            message: "OTP verified successfully"
        });

    } catch (err) {
        console.log("Error:", err);

        return res.status(500).json({
            status: 0,
            message: "An error occurred while verifying the OTP"
        });
    }
};


exports.checkVersion = async (req, res) => {
    const platform = req.body.platform || req.query.platform;
    const version = parseInt(req.body.cur_version || req.query.cur_version || 0);

    if (!["ios", "android"].includes(platform)) {
        return res.json({
            status: 0,
            result: "fail",
            text: "Invalid platform"
        });
    }

    return res.json(
        version >= 1
            ? {
                status: 1,
                result: "success",
                text: "Request successfully completed!"
            }
            : {
                status: 2,
                result: "fail",
                text: "Site under construction"
            }
    );
};

exports.check_MerchantVersion = async (req, res) => {
    try {
        const mv = req.body.cur_version || req.query.cur_version;
        const platform = (req.body.platform || req.query.platform || "unknown").toLowerCase();

        const appstatus = await AppSetting.findOne({
            where: { id: 1 },
            attributes: ['app_status']
        });
        if (!appstatus || appstatus.app_status === false) {
            return res.json({
                status: 2,
                result: "fail",
                text: "Site under construction",
                web_url: process.env.Web_URL + "/under-construction"
            });
        }

        const minVersions = {
            ios: 5,
            android: 5,
            unknown: 0,
        };

        const minRequired = minVersions[platform] ?? minVersions.unknown;
        const isValid = !isNaN(mv) && Number(mv) >= minRequired;

        if (isValid) {
            return res.json({
                status: 1,
                result: "Success",
                text: "Request Successfully Completed!",
                // current_version: Number(mv),
                min_required_version: minRequired,
                update_required: false,
            });
        }

        return res.json({
            status: 0,
            result: "fail",
            text: `Update Required - Version ${mv} is outdated. Minimum required: ${minRequired}`,
            // current_version: Number(mv) || 0,
            min_required_version: minRequired,
            update_required: true,
            store_url:
                platform === "ios"
                    ? "https://apps.apple.com/your-app"
                    : "https://play.google.com/store/apps/details?id=your.package",
        });
    } catch (error) {
        console.error("Version Check Error:", error);

        return res.status(500).json({
            status: 0,
            result: "fail",
            text: "Internal Server Error",
        });
    }
};


exports.check_CustomerVersion = async (req, res) => {
    try {
        const mv = req.body.cur_version || req.query.cur_version;
        const platform = (req.body.platform || req.query.platform || "unknown").toLowerCase();

        const appstatus = await AppSetting.findOne({
            where: { id: 2 },
            attributes: ['app_status']
        });
        if (!appstatus || appstatus.app_status === false) {
            return res.json({
                status: 2,
                result: "fail",
                text: "Site under construction",
                web_url: process.env.Web_URL + "/under-construction"
            });
        }

        const minVersions = {
            ios: 0,
            android: 0,
            unknown: 0,
        };

        const minRequired = minVersions[platform] ?? minVersions.unknown;
        const isValid = !isNaN(mv) && Number(mv) >= minRequired;

        if (isValid) {
            return res.json({
                status: 1,
                result: "Success",
                text: "Request Successfully Completed!",
                // current_version: Number(mv),
                // min_required_version: minRequired,
                update_required: false,
            });
        }

        return res.json({
            status: 0,
            result: "fail",
            text: `Update Required - Version ${mv} is outdated. Minimum required: ${minRequired}`,
            // current_version: Number(mv) || 0,
            // min_required_version: minRequired,
            update_required: true,
            store_url:
                platform === "ios"
                    ? "https://apps.apple.com/your-app"
                    : "https://play.google.com/store/apps/details?id=your.package",
        });
    } catch (error) {
        console.error("Version Check Error:", error);

        return res.status(500).json({
            status: 0,
            result: "fail",
            text: "Internal Server Error",
        });
    }
};



exports.get_notification_list = async (req, res) => {
    try {

        const { user_id, user_type } = req.body;

        if (!user_id) {
            return res.status(400).json({
                status: 0,
                message: "User ID is required."
            });
        }

        if (!["merchant", "receptionist", "customer"].includes(user_type)) {
            return res.status(400).json({
                status: 0,
                message: "Invalid user type."
            });
        }

        const notification = await Notification.findAll({
            where: {
                user_id,
                user_type,
                is_read: false
            }
        })
        if (!notification) {
            return res.json({
                status: 1,
                message: "No notifications found.",
                data: []
            });
        }
        if (notification.length === 0) {
            return res.json({
                status: 1,
                message: "No notifications found.",
                data: []
            });
        }

        return res.json({
            status: 1,
            message: "Success",
            data: notification
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            status: 0,
            message: "Network issue."
        });

    }
};


exports.update_notification = async (req, res) => {
    try {
        const { user_id, user_type } = req.body;

        if (!user_id) {
            return res.status(400).json({
                status: 0,
                message: "User ID is required."
            });
        }

        if (!["merchant", "receptionist", "customer"].includes(user_type)) {
            return res.status(400).json({
                status: 0,
                message: "Invalid user type."
            });
        }

        const [updatedCount] = await Notification.update(
            {
                is_read: true
            },
            {
                where: {
                    user_id,
                    user_type
                }
            }
        );

        return res.json({
            status: 1,
            message: updatedCount > 0
                ? "Notifications marked as read."
                : "No notifications found.",
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            status: 0,
            message: "Network issue."
        });
    }
};

exports.create_support = async (req, res) => {
    try {

        const {
            name,
            phone,
            email,
            description, type, submit_type
        } = req.body;

        // Validation
        if (!name) {
            return res.json({
                status: 0,
                message: "Name is required."
            });
        }

        if (!phone) {
            return res.json({
                status: 0,
                message: "Phone number is required."
            });
        }

        if (!email) {
            return res.json({
                status: 0,
                message: "Email is required."
            });
        }

        if (!description) {
            return res.json({
                status: 0,
                message: "Description is required."
            });
        }

        // Create Support
        const support = await Support.create({
            name,
            phone,
            email,
            description,
            status: 0, type, submit_type
        });

        return res.json({
            status: 1,
            message: "Support request submitted successfully.",
            data: support
        });

    } catch (err) {

        console.error("CREATE SUPPORT ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: "Something went wrong.",
            error: err.message
        });

    }
};


exports.check_delete_account = async (req, res) => {
    try {
        const { user_type, id } = req.body;

        if (!user_type || !id) {
            return res.status(400).json({
                status: 0,
                message: "User type and ID are required."
            });
        }

        if (![1, 2, 3].includes(Number(user_type))) {
            return res.status(400).json({
                status: 0,
                message: "Invalid user type."
            });
        }

        let user = null;

        switch (Number(user_type)) {
            case 1: 
                user = await Merchant.findOne({
                    where: { id }
                });
                break;

            case 2: 
                user = await Receptionist.findOne({
                    where: { id }
                });
                break;

            case 3:
                user = await Customer.findOne({
                    where: { id }
                });
                break;
        }

        if (!user) {
            return res.status(404).json({
                status: 0,
                message: "User not found."
            });
        }

        if (user.del_status === 1) {
            return res.status(200).json({
                status: 1,
                is_deleted: true,
                message: "This account has been deleted."
            });
        }

        return res.status(200).json({
            status: 1,
            is_deleted: false,
            message: "This account is active."
        });

    } catch (err) {
        console.error("CHECK DELETE ACCOUNT ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: "Something went wrong.",
            error: err.message
        });
    }
};
