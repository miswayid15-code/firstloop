const { Branch, Merchant, BranchImage, BranchTiming, MenuImage, Receptionist, Appointment, Customer, Coupon, CouponApplied } = require('../../models');
const { Op } = require('sequelize');
const { db, admin } = require('../../config/firebase');
const { parsePhoneNumber } = require('libphonenumber-js');

const fs = require('fs');
const path = require('path');
const { json } = require('sequelize');
const { sendPushNotification } = require("../../helpers/notificationHelper");
exports.register = async (req, res) => {

    // console.log("========== CREATE BRANCH API ==========");
    // console.log("BODY:", req.body);
    // console.log("USER:", req.user);

    try {

        const {
            name,
            email,
            phone,
            lat,
            lon,
            address,
            description,
            open_time,
            close_time,
            country_code,
            timings,
            visibility,
            age_group
        } = req.body;

        const merchant_id = req.user.id;

        // console.log("MERCHANT ID:", merchant_id);

        // ✅ Required Fields
        if (
            !name ||
            !email ||
            !phone
        ) {

            // console.log("VALIDATION FAILED: Required fields missing");

            return res.json({
                status: 0,
                message: "Required fields missing"
            });

        }


        let timingData = [];

        if (timings) {

            timingData = typeof timings === "string"
                ? JSON.parse(timings)
                : timings;

            for (const item of timingData) {

                if (!item.is_closed) {

                    if (
                        !item.open_time ||
                        !item.close_time
                    ) {

                        return res.json({
                            status: 0,
                            message: `Opening and closing time are required for day ${item.day}`
                        });

                    }

                    // if (item.open_time >= item.close_time) {

                    //     return res.json({
                    //         status: 0,
                    //         message: `Closing time must be greater than opening time for day ${item.day}`
                    //     });

                    // }
                }
            }
        }


        // console.log("TIME VALIDATION PASSED");

        // ✅ Phone Validation
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

        // ✅ Email Exists Check
        // console.log("CHECKING EMAIL:", email);

        const emailExists =
            await Branch.findOne({

                where: { email }

            });

        // console.log("EMAIL EXISTS RESULT:", emailExists);

        if (emailExists) {

            // console.log("EMAIL ALREADY EXISTS");

            return res.json({

                status: 0,

                message: "Email already exists"

            });

        }

        // console.log("EMAIL VALIDATION PASSED");

        // ✅ Phone Exists Check
        // console.log("CHECKING PHONE EXISTS");

        const phoneExists =
            await Branch.findOne({

                where: {

                    country_code: callingCode,

                    phone: nationalNumber

                }

            });

        // console.log("PHONE EXISTS RESULT:", phoneExists);

        if (phoneExists) {

            // console.log("PHONE ALREADY EXISTS");

            return res.json({

                status: 0,

                message: "Phone already exists"

            });

        }

        // console.log("PHONE VALIDATION PASSED");

        // ✅ Merchant Check
        // console.log("CHECKING MERCHANT");

        const merchant =
            await Merchant.findByPk(
                merchant_id
            );

        // console.log("MERCHANT RESULT:", merchant);

        if (!merchant) {

            // console.log("INVALID MERCHANT");

            return res.json({

                status: 0,

                message: "Invalid merchant"

            });

        }

        // console.log("MERCHANT VALIDATION PASSED");

        // ✅ Files
        const files =
            req.files || [];

        // console.log("FILES:", files);
        // console.log("FILES COUNT:", files.length);

        // ✅ First image as profile image
        const profile_image =
            files.length > 0
                ? files[0].path.replace(/\\/g, '/')
                : null;

        // console.log("PROFILE IMAGE:", profile_image);

        // ✅ Create Branch
        // console.log("CREATING BRANCH");

        const branch =
            await Branch.create({

                name,

                email,

                country_code: callingCode,

                phone: nationalNumber,

                profile_image,

                lat,

                lon,

                address,

                description,
                visibility,
                age_group,


                merchant_id,

                status: 1,

                del_status: 0,


            });

        if (timingData.length > 0) {

            const branchTimings = timingData.map(item => ({

                branch_id: branch.id,

                day: item.day,

                open_time: item.is_closed ? null : item.open_time,

                close_time: item.is_closed ? null : item.close_time,

                is_closed: item.is_closed || false

            }));

            await BranchTiming.bulkCreate(branchTimings);

        }

        // console.log("BRANCH CREATED:", branch);

        // ✅ Save Multiple Images
        if (files.length > 0) {

            // console.log("SAVING BRANCH IMAGES");

            const imageData =
                files.map(file => ({

                    branch_id: branch.id,

                    image:
                        file.path.replace(/\\/g, '/')

                }));

            // console.log("IMAGE DATA:", imageData);

            const imageInsert =
                await BranchImage.bulkCreate(
                    imageData
                );

            // console.log(
            //     "BRANCH IMAGES INSERTED:",
            //     imageInsert
            // );

        }

        // console.log("BRANCH CREATED SUCCESSFULLY");
        // console.log("======================================");

        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant_id,
                user_type: "merchant"
            }
        });



        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "🎉 Branch Created!",
                body: `Your branch "${name}" has been created successfully. 🏢`
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }
        return res.json({

            status: 1,

            message:
                "Branch created successfully",

            branch_id: branch.id

        });

    } catch (err) {

        console.log(
            "BRANCH ERROR:",
            err
        );

        console.log(
            "ERROR MESSAGE:",
            err.message
        );

        console.log(
            "ERROR STACK:",
            err.stack
        );

        // console.log("======================================");

        return res.json({

            status: 0,

            message: err.message

        });

    }

};

exports.fetch_list = async (req, res) => {

    try {

        const merchant_id = req.user.id;

        const baseUrl = process.env.APP_URL;

        const branches = await Branch.findAll({

            where: {
                merchant_id,
                del_status: 0
            },

            include: [{
                model: BranchImage,
                attributes: ['id', 'image']
            }],

            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'profile_image',
                'lat',
                'lon',
                'address',
                'merchant_id',
                'description',
                'open_time',
                'close_time'
            ],

            order: [['id', 'DESC']]

        });

        if (!branches || branches.length === 0) {

            return res.json({
                status: 0,
                message: "Branch list not found"
            });

        }

        const data = branches.map(branch => {

            const branchData = branch.toJSON();

            // ✅ profile image url
            branchData.profile_image = branchData.profile_image
                ? baseUrl + '/' + branchData.profile_image.replace(/\\/g, '/')
                : null;

            // ✅ branch images
            if (branchData.BranchImages && branchData.BranchImages.length > 0) {

                branchData.BranchImages = branchData.BranchImages.map(img => ({
                    ...img,
                    image: img.image
                        ? baseUrl + '/' + img.image.replace(/\\/g, '/')
                        : null
                }));

            }

            return branchData;

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

exports.delete_branch = async (req, res) => {

    try {

        const merchant_id = req.user.id;

        const branch_id = req.body.branch_id;

        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID is required"
            });

        }

        // ✅ check branch
        const branch = await Branch.findOne({

            where: {
                id: branch_id,
                merchant_id,
                del_status: 0
            }

        });

        if (!branch) {

            return res.json({
                status: 0,
                message: "Branch not found"
            });

        }

        // ✅ delete profile image
        if (branch.profile_image) {

            const profilePath = path.join(__dirname, '../../', branch.profile_image);

            if (fs.existsSync(profilePath)) {

                try {

                    fs.unlinkSync(profilePath);

                } catch (err) {

                    console.log("Profile delete error:", err.message);

                }

            }

        }

        // ✅ get branch images
        const images = await BranchImage.findAll({
            where: { branch_id }
        });

        // ✅ delete image files
        images.forEach(img => {

            if (img.image) {

                const filePath = path.join(__dirname, '../../', img.image);

                if (fs.existsSync(filePath)) {

                    try {

                        fs.unlinkSync(filePath);

                    } catch (err) {

                        console.log("File delete error:", err.message);

                    }

                }

            }

        });

        // ✅ delete image records
        await BranchImage.destroy({
            where: { branch_id }
        });

        // ✅ soft delete branch
        await branch.update({
            del_status: 1
        });
        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant_id,
                user_type: "merchant"
            }
        });



        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: " Branch Deleted Successfully",
                body: "The branch has been deleted successfully. ✅"
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }

        return res.json({
            status: 1,
            message: "Branch deleted successfully"
        });

    } catch (err) {

        console.log("BRANCH ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

exports.update_branch = async (req, res) => {

    try {

        const {
            branch_id,
            name,
            email,
            phone,
            lat,
            lon,
            address,
            description,
            open_time,
            close_time,
            country_code,
            timings,
            visibility,
            age_group
        } = req.body;

        const merchant_id = req.user.id;
        let timingData = [];

        if (timings) {

            timingData = typeof timings === "string"
                ? JSON.parse(timings)
                : timings;

            for (const item of timingData) {

                if (!item.is_closed) {

                    if (!item.open_time || !item.close_time) {

                        return res.json({
                            status: 0,
                            message: `Opening and closing time are required for day ${item.day}`
                        });

                    }

                    // Optional validation
                    // if (item.open_time >= item.close_time) {
                    //     return res.json({
                    //         status: 0,
                    //         message: `Closing time must be greater than opening time for day ${item.day}`
                    //     });
                    // }

                }

            }

        }

        // ✅ Branch ID Check
        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID required"
            });

        }

        // ✅ Find Branch
        const branch = await Branch.findOne({

            where: {
                id: branch_id,
                merchant_id,
                del_status: 0
            }

        });

        if (!branch) {

            return res.json({
                status: 0,
                message: "Branch not found"
            });

        }

        // ✅ Email Exists Check
        if (email) {

            const exists = await Branch.findOne({

                where: {

                    email,

                    id: {
                        [require('sequelize').Op.ne]:
                            branch_id
                    }

                }

            });

            if (exists) {

                return res.json({
                    status: 0,
                    message: "Email already exists"
                });

            }

        }

        // ✅ Phone Validation
        let phoneNumber = branch.phone;
        let nationalNumber = branch.phone;
        let callingCode = branch.country_code;

        if (phone) {

            try {

                const cleanPhone =
                    phone.replace(/\s+/g, '');

                const fullPhone =
                    cleanPhone.startsWith('+')
                        ? cleanPhone
                        : country_code + cleanPhone;

                const num =
                    parsePhoneNumber(fullPhone);

                if (!num.isValid()) {

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

            } catch (err) {

                console.log(
                    "PHONE ERROR:",
                    err
                );

                return res.json({
                    status: 0,
                    message: "Invalid phone format"
                });

            }

            // ✅ Phone Exists Check
            const phoneExists =
                await Branch.findOne({

                    where: {

                        country_code: callingCode,

                        phone: nationalNumber,

                        id: {
                            [require('sequelize').Op.ne]:
                                branch_id
                        }

                    }

                });

            if (phoneExists) {

                return res.json({
                    status: 0,
                    message: "Phone already exists"
                });

            }

        }

        // ✅ Time Validation


        // ✅ Files
        const files = req.files || [];

        let profile_image =
            branch.profile_image;

        // ✅ Update Profile Image
        if (files.length > 0) {

            // delete old profile image
            if (branch.profile_image) {

                const oldProfile =
                    path.join(
                        __dirname,
                        '../../',
                        branch.profile_image
                    );

                if (fs.existsSync(oldProfile)) {

                    try {

                        fs.unlinkSync(oldProfile);

                    } catch (err) {

                        console.log(
                            "Profile delete error:",
                            err.message
                        );

                    }

                }

            }

            profile_image =
                files[0].path.replace(/\\/g, '/');

        }

        // ✅ Update Branch
        await branch.update({

            name:
                name || branch.name,

            email:
                email || branch.email,

            country_code:
                callingCode,

            phone:
                nationalNumber,

            profile_image,

            lat:
                lat || branch.lat,

            lon:
                lon || branch.lon,

            address:
                address || branch.address,

            description:
                description || branch.description,

            visibility:
                visibility || branch.visibility,
            age_group:
                age_group || branch.age_group,


        });

        // ✅ Replace Branch Timings
        if (timingData.length > 0) {

            // Delete old timings
            await BranchTiming.destroy({
                where: {
                    branch_id
                }
            });

            // Insert new timings
            const branchTimings = timingData.map(item => ({

                branch_id,

                day: item.day,

                open_time: item.is_closed
                    ? null
                    : item.open_time,

                close_time: item.is_closed
                    ? null
                    : item.close_time,

                is_closed: item.is_closed || false

            }));

            await BranchTiming.bulkCreate(branchTimings);

        }

        // ✅ Replace Branch Images
        if (files.length > 0) {

            const oldImages =
                await BranchImage.findAll({

                    where: { branch_id }

                });

            // delete old images
            oldImages.forEach(img => {

                const filePath =
                    path.join(
                        __dirname,
                        '../../',
                        img.image
                    );

                if (fs.existsSync(filePath)) {

                    try {

                        fs.unlinkSync(filePath);

                    } catch (err) {

                        console.log(
                            "Delete error:",
                            err.message
                        );

                    }

                }

            });

            // remove old db records
            await BranchImage.destroy({

                where: { branch_id }

            });

            // insert new images
            const imageData =
                files.map(f => ({

                    branch_id,

                    image:
                        f.path.replace(/\\/g, '/')

                }));

            await BranchImage.bulkCreate(
                imageData
            );

        }

        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant_id,
                user_type: "merchant"
            }
        });



        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "🎉 Update Successful!",
                body: `The branch "${name}" has been updated successfully. 🏢`
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }

        return res.json({

            status: 1,

            message:
                "Branch updated successfully"

        });

    } catch (err) {

        console.log(
            "UPDATE ERROR:",
            err
        );

        return res.json({

            status: 0,

            message: err.message

        });

    }

};

exports.branch_id = async (req, res) => {
    try {
        const branch_id = req.params.id;

        if (!branch_id) {
            return res.json({
                status: 0,
                message: "Branch ID required"
            });
        }

        const [
            branch,
            active_coupon,
            redeemed_coupon,
            appointment,
            snapshot
        ] = await Promise.all([
            Branch.findOne({
                where: {
                    id: branch_id,
                    del_status: 0
                },
                include: [
                    {
                        model: BranchImage,
                        attributes: ['id', 'image']
                    },
                    {
                        model: Receptionist,
                        attributes: ['id', 'name']
                    }, {
                        model: BranchTiming,
                        attributes: ['id', 'day', 'open_time', 'close_time', 'is_closed']
                    }
                ],
                attributes: [
                    'id',
                    'name',
                    'email',
                    'phone',
                    'profile_image',
                    'lat',
                    'lon',
                    'address',
                    'merchant_id',
                    'description',
                    'country_code',
                    'visibility',
                    'age_group'
                ]

            }),

            Coupon.count({
                where: {
                    status: 1,
                    del_status: 0,
                    branch_ids: {
                        [Op.contains]: [Number(branch_id)]
                    }
                }
            }),

            CouponApplied.count({
                where: {
                    status: 1,
                    del_status: 0,
                    branch_id: Number(branch_id)
                }
            }),

            Appointment.count({
                where: {
                    status: 1,
                    br_id: Number(branch_id)
                }
            }),

            db.collection('chats')
                .where('branchId', '==', String(branch_id))
                .get()
        ]);

        if (!branch) {
            return res.json({
                status: 0,
                message: "Branch not found"
            });
        }

        const baseUrl = process.env.APP_URL;
        const data = branch.toJSON();

        // Profile image URL
        data.profile_image = data.profile_image
            ? `${baseUrl}/${data.profile_image.replace(/\\/g, '/')}`
            : null;

        // Branch images URL
        if (data.BranchImages) {
            data.BranchImages = data.BranchImages.map(img => ({
                ...img,
                image: img.image
                    ? `${baseUrl}/${img.image.replace(/\\/g, '/')}`
                    : null
            }));
        }



        // Counts
        data.active_coupon = active_coupon;
        data.redeemed_coupon = redeemed_coupon;
        data.appointment_count = appointment;
        data.chat_count = snapshot.size;

        return res.json({
            status: 1,
            data
        });

    } catch (err) {
        console.log("BRANCH FETCH ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });
    }
};

// ================= REGISTER MENU IMAGE =================

exports.register_menu_image = async (req, res) => {

    try {

        const merchant_id = req.user.id;

        const branch_id = req.body?.branch_id;

        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID required"
            });

        }


        const branch = await Branch.findOne({

            where: {
                id: branch_id,
                merchant_id,
                del_status: 0
            }

        });

        if (!branch) {

            return res.json({
                status: 0,
                message: "Branch not found or unauthorized"
            });

        }

        const files = req.files || [];

        if (files.length === 0) {

            return res.json({
                status: 0,
                message: "Images required"
            });

        }

        const imageData = files.map(file => ({

            branch_id,

            image: file.path.replace(/\\/g, '/'),

            status: 1

        }));

        await MenuImage.bulkCreate(imageData);

        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant_id,
                user_type: "merchant"
            }
        });



        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "✅ Menu Image Uploaded",
                body: `Your menu image has been uploaded successfully for ${branch.name}. 📸`
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }

        return res.json({
            status: 1,
            message: "Menu images added successfully"
        });

    } catch (err) {

        console.log("MENU IMAGE ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

// ================= FETCH MENU IMAGES =================

exports.fetch_menu_images = async (req, res) => {

    try {

        const merchant_id = req.user.id;

        const branch_id = req.params.branch_id;

        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID required"
            });

        }

        // check branch belongs to merchant
        const branch = await Branch.findOne({

            where: {
                id: branch_id,
                merchant_id,
                del_status: 0
            }

        });

        if (!branch) {

            return res.json({
                status: 0,
                message: "Branch not found or unauthorized"
            });

        }

        const baseUrl = process.env.APP_URL;

        const images = await MenuImage.findAll({

            where: {
                branch_id
            },

            attributes: [
                'id',
                'branch_id',
                'image',
                'status'
            ],

            order: [['id', 'DESC']]

        });

        const data = images.map(item => ({

            id: item.id,

            branch_id: item.branch_id,

            image: item.image
                ? baseUrl + '/' + item.image.replace(/\\/g, '/')
                : null,

            status: item.status

        }));

        return res.json({
            status: 1,
            data
        });

    } catch (err) {

        console.log("FETCH MENU ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

// ================= UPDATE MENU IMAGE =================

exports.update_menu_image = async (req, res) => {

    try {

        const merchant_id = req.user.id;

        const branch_id = req.body?.branch_id;

        let update_ids = req.body?.update_ids || [];

        // convert string array
        if (typeof update_ids === 'string') {

            update_ids = JSON.parse(update_ids);

        }

        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID required"
            });

        }

        // check branch belongs to merchant
        const branch = await Branch.findOne({

            where: {
                id: branch_id,
                merchant_id,
                del_status: 0
            }

        });

        if (!branch) {

            return res.json({
                status: 0,
                message: "Branch not found or unauthorized"
            });

        }

        const files = req.files || [];

        if (files.length === 0) {

            return res.json({
                status: 0,
                message: "Images required"
            });

        }

        // update existing images
        for (let i = 0; i < update_ids.length; i++) {

            const image_id = update_ids[i];

            const file = files[i];

            if (!file) {
                continue;
            }

            const menuImage = await MenuImage.findOne({

                where: {
                    id: image_id,
                    branch_id
                }

            });

            if (!menuImage) {
                continue;
            }

            // delete old image
            if (menuImage.image) {

                const oldPath = path.join(
                    __dirname,
                    '../../',
                    menuImage.image
                );

                if (fs.existsSync(oldPath)) {

                    try {

                        fs.unlinkSync(oldPath);

                    } catch (err) {

                        console.log(err.message);

                    }

                }

            }

            // update image
            await menuImage.update({

                image: file.path.replace(/\\/g, '/')

            });

        }

        // insert extra new images
        if (files.length > update_ids.length) {

            const newFiles = files.slice(update_ids.length);

            const imageData = newFiles.map(file => ({

                branch_id,

                image: file.path.replace(/\\/g, '/'),

                status: 1

            }));

            await MenuImage.bulkCreate(imageData);

        }
        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant_id,
                user_type: "merchant"
            }
        });



        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "✅ Menu Image Updated",
                body: `Your menu image has been updated successfully for ${branch.name}. 📸`
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }
        return res.json({
            status: 1,
            message: "Menu images updated successfully"
        });

    } catch (err) {

        console.log("UPDATE MENU ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

// ================= DELETE MENU IMAGE =================

exports.delete_menu_image = async (req, res) => {

    try {

        const merchant_id = req.user.id;


        const { id, branch_id } = req.body;

        // check image id
        if (!id) {

            return res.json({
                status: 0,
                message: "Image ID required"
            });

        }

        // check branch id
        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID required"
            });

        }

        // check branch belongs to merchant
        const branch = await Branch.findOne({

            where: {
                id: branch_id,
                merchant_id,
                del_status: 0
            }

        });

        if (!branch) {

            return res.json({
                status: 0,
                message: "Branch not found or unauthorized"
            });

        }

        // check image exists
        const menu = await MenuImage.findOne({

            where: {
                id,
                branch_id
            }

        });

        if (!menu) {

            return res.json({
                status: 0,
                message: "Image not found"
            });

        }

        // image full path
        const filePath = path.join(
            __dirname,
            '../../',
            menu.image
        );

        // delete image file
        if (menu.image && fs.existsSync(filePath)) {

            try {

                fs.unlinkSync(filePath);

            } catch (err) {

                console.log("FILE DELETE ERROR:", err.message);

            }

        }

        // delete db row
        await menu.destroy();

        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant.id,
                user_type: "merchant"
            }
        });



        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "✅ Menu Image Removed",
                body: `The menu image has been removed successfully from ${branch.name}.`
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }

        return res.json({
            status: 1,
            message: "Image deleted successfully"
        });

    } catch (err) {

        console.log("DELETE MENU ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};


exports.appointment_list = async (req, res) => {

    try {


        const receptionist_id = req.user.id;


        const receptionist =
            await Receptionist.findOne({

                where: {

                    id: receptionist_id,

                    status: 1,

                    del_status: 0

                }

            });

        if (!receptionist) {

            return res.json({

                status: 0,
                message: "Invalid receptionist"

            });

        }


        const branch_id =
            receptionist.branch_id;
        // console.log("BRANCH ID:", branch_id);

        const appointments =
            await Appointment.findAll({

                where: {
                    br_id: branch_id
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
                    'approved_by',
                    'approved_by_id',

                ],

                order: [['id', 'DESC']]

            });
        // console.log("APPOINTMENTS:", appointments);

        if (
            !appointments ||
            appointments.length === 0
        ) {

            return res.json({

                status: 0,
                message: "No appointments found",
                data: []

            });

        }


        const formattedAppointments =
            appointments.map(item => {

                const data =
                    item.toJSON();

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

            message: "Successfully fetched",

            data: formattedAppointments

        });

    } catch (err) {

        console.log(
            "APPOINTMENT ERROR:",
            err
        );

        return res.json({

            status: 0,
            message: err.message

        });

    }

};


exports.update_appointment_status = async (req, res) => {

    try {

        const receptionist_id = req.user.id;

        const {
            appointment_id,
            status,
            cancel_reason
        } = req.body;


        if (
            !appointment_id ||
            status === undefined
        ) {

            return res.json({

                status: 0,
                message: "Appointment ID and status are required"

            });

        }


        const receptionist =
            await Receptionist.findOne({

                where: {

                    id: receptionist_id,
                    status: 1,
                    del_status: 0

                }

            });

        if (!receptionist) {

            return res.json({

                status: 0,
                message: "Invalid receptionist"

            });

        }


        const appointment =
            await Appointment.findOne({

                where: {

                    id: appointment_id,
                    br_id: receptionist.branch_id

                }

            });

        if (!appointment) {

            return res.json({

                status: 0,
                message: "Appointment not found"

            });

        }


        const updateData = {

            status: status

        };


        if (Number(status) === 1) {

            updateData.approved_by =
                'receptionist';

            updateData.approved_by_id =
                receptionist_id;

        }


        if (Number(status) === 2) {

            updateData.cancel_by =
                'receptionist';

            updateData.cancel_reason =
                cancel_reason || null;

        }


        await appointment.update(updateData);

        return res.json({

            status: 1,

            message: "Appointment status updated successfully",

            data: appointment

        });

    }

    catch (err) {

        console.log(
            "APPOINTMENT UPDATE ERROR:",
            err
        );

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




        if (!appointment_id) {

            return res.json({

                status: 0,
                message: "Appointment ID is required"

            });

        }


        const appointment = await Appointment.findOne({

            where: {

                id: appointment_id,


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
                'approved_by',
                'approved_by_id'
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
                , {
                    model: Customer,
                    attributes: [
                        'id',
                        'name',
                        'phone',
                        'email',
                        'profile_image'

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

// ================= merchant appointment =================
exports.merchant_appointment_list = async (req, res) => {
    try {

        const merchant = req.merchant;

        const branch_id =
            req.body?.branch_id ||
            req.query?.branch_id ||
            null;

        if (!branch_id) {
            return res.json({
                status: 0,
                message: "Branch ID required"
            });
        }

        const appointments = await Appointment.findAll({
            where: {
                br_id: branch_id

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
                'approved_by',
                'approved_by_id'
            ],

            order: [['id', 'DESC']]
        });

        const data = appointments.map(item => {

            const appointment = item.toJSON();

            appointment.appointment_date =
                appointment.appointment_date
                    ? new Date(appointment.appointment_date)
                        .toLocaleDateString('en-US', {
                            month: 'long',
                            day: '2-digit',
                            year: 'numeric'
                        })
                    : null;

            appointment.slot =
                appointment.slot
                    ? new Date(`1970-01-01T${appointment.slot}`)
                        .toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        })
                    : null;

            return appointment;
        });

        return res.json({
            status: 1,
            message: "Appointments fetched successfully",
            data
        });

    } catch (error) {

        console.log(error);

        return res.json({
            status: 0,
            message: "Something went wrong"
        });

    }
};

exports.update_appointment_status_by_mer = async (req, res) => {

    try {

        const merchant = req.merchant;

        const {
            appointment_id,
            status,
            cancel_reason
        } = req.body;


        if (
            !appointment_id ||
            status === undefined
        ) {

            return res.json({

                status: 0,
                message: "Appointment ID and status are required"

            });

        }



        const appointment =
            await Appointment.findOne({

                where: {

                    id: appointment_id,
                }

            });

        if (!appointment) {

            return res.json({

                status: 0,
                message: "Appointment not found"

            });

        }


        const updateData = {

            status: status

        };


        if (Number(status) === 1) {

            updateData.approved_by =
                'merchant';

            updateData.approved_by_id =
                merchant.id;

        }


        if (Number(status) === 2) {

            updateData.cancel_by =
                'merchant';

            updateData.cancel_reason =
                cancel_reason || null;

        }


        await appointment.update(updateData);

        return res.json({

            status: 1,

            message: "Appointment status updated successfully",

            data: appointment

        });

    }

    catch (err) {

        console.log(
            "APPOINTMENT UPDATE ERROR:",
            err
        );

        return res.json({

            status: 0,
            message: err.message

        });

    }

};
