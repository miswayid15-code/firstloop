const { Branch, Merchant, BranchImage, BranchTiming, MenuImage, Receptionist, Appointment, Customer, Coupon, CouponApplied, UserNotificationToken } = require('../../models');
const { Op } = require('sequelize');
const { db, admin } = require('../../config/firebase');
const { parsePhoneNumber } = require('libphonenumber-js');

const fs = require('fs');
const path = require('path');
const { json } = require('sequelize');
const { sendPushNotification, getNotificationTemplate } = require("../../helpers/notificationHelper");
// const { generateBranchPasslock } = require("../../helpers/passlockHelper");
exports.register = async (req, res) => {
    if (req.body.lat === '') req.body.lat = null;
    if (req.body.lon === '') req.body.lon = null;

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
            age_group, city, state, country,
            //  passlock
        } = req.body;

        const merchant_id = req.user.id;

        // console.log("MERCHANT ID:", merchant_id);

        // ✅ Required Fields
        if (
            !name
            // ||!passlock
        ) {

            // console.log("VALIDATION FAILED: Required fields missing");

            return res.json({
                status: 0,
                message: "Required fields missing"
            });

        }
        // const existingPasslock = await Branch.findOne({
        //     where: { passlock }
        // });

        // if (existingPasslock) {
        //     return res.json({
        //         status: 0,
        //         message: "Passlock already exists."
        //     });
        // }

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

            if (phone && phone.trim() !== "") {

                const cleanPhone = phone.replace(/\s+/g, '');

                console.log("CLEAN PHONE:", cleanPhone);

                const fullPhone = cleanPhone.startsWith('+')
                    ? cleanPhone
                    : country_code + cleanPhone;

                // console.log("FULL PHONE:", fullPhone);

                const num = parsePhoneNumber(fullPhone);

                // console.log("PARSED PHONE:", num);

                if (!num.isValid()) {
                    return res.json({
                        status: 0,
                        message: "Invalid phone number"
                    });
                }

                callingCode = `+${num.countryCallingCode}`;
                nationalNumber = num.nationalNumber;
                phoneNumber = num.number;

            } else {
                // Phone is empty
                callingCode = country_code;
                nationalNumber = null;
                phoneNumber = null;
            }

        } catch (err) {

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

        // if (emailExists) {

        //     // console.log("EMAIL ALREADY EXISTS");

        //     return res.json({

        //         status: 0,

        //         message: "Email already exists"

        //     });

        // }

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

        // if (phoneExists) {

        //     // console.log("PHONE ALREADY EXISTS");

        //     return res.json({

        //         status: 0,

        //         message: "Phone already exists"

        //     });

        // }

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
        const files = req.files || [];

        // Profile image
        const profileFile = files.find(
            file => file.fieldname === "profile_image"
        );

        // Branch gallery images
        const branchImages = files.filter(
            file => file.fieldname === "image" || file.fieldname === "images"
        );

        // Profile image path
        const pending_profile_image = profileFile
            ? profileFile.path.replace(/\\/g, '/')
            : null;
        // console.log("PROFILE IMAGE:", profile_image);

        // ✅ Create Branch
        // console.log("CREATING BRANCH");

        const branch =
            await Branch.create({

                name,

                email: email?.trim() ? email : null,

                country_code: callingCode,

                phone: nationalNumber?.trim() ? nationalNumber : null,

                profile_image: null,
                pending_profile_image,
                profile_image_status: 0,

                lat,

                lon,

                address,
                country,
                state: state?.trim() || null,
                city: city?.trim() || null,

                description,
                visibility,
                age_group,


                merchant_id,

                status: 1,

                del_status: 0,
                // passlock


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
        if (branchImages.length > 0) {

            const imageData = branchImages.map(file => ({
                branch_id: branch.id,
                image: null,
                pending_image: file.path.replace(/\\/g, '/'),
                image_status: 0,
                rejected_reason: null
            }));

            await BranchImage.bulkCreate(imageData);
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
                'pending_profile_image',
                'lat',
                'lon',
                'address',
                'merchant_id',
                'description',
                'open_time',
                'close_time',
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
                ? `${baseUrl}/${branchData.profile_image.replace(/\\/g, '/')}`
                : branchData.pending_profile_image
                    ? `${baseUrl}/${branchData.pending_profile_image.replace(/\\/g, '/')}`
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
    if (req.body.lat === '') req.body.lat = null;
    if (req.body.lon === '') req.body.lon = null;

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
            age_group,
            city, state, country
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


        const files = req.files || [];

        const profileFile = files.find(
            file => file.fieldname === "profile_image"
        );

        const branchImages = files.filter(
            file => file.fieldname === "images" || file.fieldname === "image"
        );

        let pending_profile_image = branch.pending_profile_image;

        if (profileFile) {

            if (branch.pending_profile_image) {

                const oldProfile = path.join(
                    __dirname,
                    "../../",
                    branch.pending_profile_image
                );

                if (fs.existsSync(oldProfile)) {
                    try {
                        fs.unlinkSync(oldProfile);
                    } catch (err) {
                        console.log("Profile delete error:", err.message);
                    }
                }
            }

            pending_profile_image = profileFile.path.replace(/\\/g, "/");
        }

        // ✅ Update Branch
        const updateData = {

            name: name || branch.name,
            email: email || branch.email,
            country_code: callingCode,
            phone: nationalNumber,

            lat: lat || branch.lat,
            lon: lon || branch.lon,

            address: address || branch.address,
            city: city || branch.city,
            state: state || branch.state,
            country: country || branch.country,

            description: description || branch.description,

            visibility: visibility || branch.visibility,
            age_group: age_group || branch.age_group
        };

        if (profileFile) {
            updateData.pending_profile_image = pending_profile_image;
            updateData.profile_image_status = 0;
            updateData.rejected_reason = null;
        }

        await branch.update(updateData);
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
        if (branchImages.length > 0) {

            const oldPendingImages = await BranchImage.findAll({
                where: {
                    branch_id,
                    image_status: 0
                }
            });

            for (const img of oldPendingImages) {

                if (img.pending_image) {

                    const filePath = path.join(
                        __dirname,
                        "../../",
                        img.pending_image
                    );

                    if (fs.existsSync(filePath)) {
                        try {
                            fs.unlinkSync(filePath);
                        } catch (err) {
                            console.log(err.message);
                        }
                    }
                }
            }

            await BranchImage.destroy({
                where: {
                    branch_id,
                    image_status: 0
                }
            });

            const imageData = branchImages.map(file => ({
                branch_id,
                image: null,
                pending_image: file.path.replace(/\\/g, "/"),
                image_status: 0,
                rejected_reason: null
            }));

            await BranchImage.bulkCreate(imageData);
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
                        attributes: ['id', 'image', 'status', 'pending_image', 'image_status', 'rejected_reason']
                    },
                    {
                        model: MenuImage,
                        attributes: ['id', 'image', 'status', 'pending_image', 'image_status', 'rejected_reason']
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
                    'pending_profile_image',
                    'profile_image_status',
                    'lat',
                    'lon',
                    'address',
                    'merchant_id',
                    'description',
                    'country_code',
                    'visibility',
                    'age_group',
                    'lat', 'lon', 'city', 'state', 'country'
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

        const profileImagePath =
            data.profile_image_status === 1
                ? data.profile_image
                : data.pending_profile_image;

        data.profile_image = data.pending_profile_image
            ? `${baseUrl}/${data.pending_profile_image.replace(/\\/g, '/')}`
            : null;
        if (data.BranchImages) {
            data.BranchImages = data.BranchImages.map(img => {
                const imagePath = img.image_status === 1 ? img.image : img.pending_image;

                return {
                    id: img.id,
                    image: img.pending_image
                        ? `${baseUrl}/${img.pending_image.replace(/\\/g, '/')}`
                        : null,
                    image_status: img.image_status,
                    rejected_reason: img.rejected_reason
                };
            });
        }

        // Menu images URL
        if (data.MenuImages) {
            data.MenuImages = data.MenuImages.map(img => {
                const imagePath = img.image_status === 1 ? img.image : img.pending_image;

                return {
                    id: img.id,
                    image: img.pending_image
                        ? `${baseUrl}/${img.pending_image.replace(/\\/g, '/')}`
                        : null,
                    image_status: img.image_status,
                    rejected_reason: img.rejected_reason
                };
            });
        }

        // Counts
        data.active_coupon = active_coupon;
        data.redeemed_coupon = redeemed_coupon;
        data.appointment_count = appointment;
        data.chat_count = snapshot.size;
        delete data.pending_profile_image;
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

            image: null, // No approved image yet

            pending_image: file.path.replace(/\\/g, '/'),

            image_status: 0, // 0 = Pending

            rejected_reason: null

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
                'status',
                'pending_image',
                'image_status',
                'rejected_reason'
            ],

            order: [['id', 'DESC']]

        });

        const data = images.map(item => ({

            id: item.id,

            branch_id: item.branch_id,

            image: item.image
                ? baseUrl + '/' + item.image.replace(/\\/g, '/')
                : null,
            pending_image: item.pending_image
                ? `${baseUrl}/${item.pending_image.replace(/\\/g, '/')}`
                : null,

            image_status: item.image_status,

            rejected_reason: item.rejected_reason,

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


            if (menuImage.pending_image) {

                const oldPath = path.join(
                    __dirname,
                    '../../',
                    menuImage.pending_image
                );

                if (fs.existsSync(oldPath)) {

                    try {
                        fs.unlinkSync(oldPath);
                    } catch (err) {
                        console.log(err.message);
                    }
                }
            }

            await menuImage.update({

                pending_image: file.path.replace(/\\/g, '/'),

                image_status: 0,

                rejected_reason: null

            });

        }

        // insert extra new images
        if (files.length > update_ids.length) {

            const newFiles = files.slice(update_ids.length);

            const imageData = newFiles.map(file => ({

                branch_id,



                pending_image: file.path.replace(/\\/g, '/'),

                image_status: 0,

                rejected_reason: null

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
        let notification;

        if (Number(status) === 1) {

            updateData.approved_by =
                'receptionist';

            updateData.approved_by_id =
                receptionist_id;
            notification = 'approved';

        }


        if (Number(status) === 2) {

            updateData.cancel_by =
                'receptionist';

            updateData.cancel_reason =
                cancel_reason || null;
            notification = 'cancelled';

        }


        await appointment.update(updateData);
        // Get branch
        const branch = await Branch.findByPk(appointment.br_id);

        if (branch) {

            // console.log("\n========== APPOINTMENT NOTIFICATION START ==========");
            // console.log("Notification Status:", notification);
            // console.log("Appointment:", appointment.toJSON ? appointment.toJSON() : appointment);
            // console.log("Branch:", branch.toJSON ? branch.toJSON() : branch);

            // Notification template based on status
            const customerNotification = getNotificationTemplate(
                "appointment",
                "b2c",
                notification,
                notification === "cancelled" ? "Receptionist" : null,
                notification === "cancelled" ? cancel_reason : null
            );

            const merchantNotification = getNotificationTemplate(
                "appointment",
                "b2b",
                notification,
                notification === "cancelled" ? "Receptionist" : null,
                notification === "cancelled" ? cancel_reason : null
            );

            const receptionistNotification = getNotificationTemplate(
                "appointment",
                "b2b",
                notification,
                notification === "cancelled" ? "Receptionist" : null,
                notification === "cancelled" ? cancel_reason : null
            );

            // console.log("Customer Template:", customerNotification);
            // console.log("Merchant Template:", merchantNotification);
            // console.log("Receptionist Template:", receptionistNotification);

            // Common notification data
            const notificationData = {
                type: "appointment",
                appointment_id: appointment.id,
                branch_id: appointment.br_id,
            };

            if (notification === "cancelled") {
                notificationData.cancel_by = "receptionist";
                notificationData.cancel_reason = cancel_reason || "";
            }

            // console.log("Notification Payload:", notificationData);

            // ================= Customer =================
            try {

                // console.log("\n========== CUSTOMER ==========");
                // console.log("Customer ID:", appointment.cus_id);

                const customerToken = await UserNotificationToken.findOne({
                    where: {
                        user_id: appointment.cus_id,
                        user_type: "customer",
                    },
                });

                // console.log("Customer Token Record:",
                //     customerToken ? customerToken.toJSON() : null);

                if (customerToken?.token) {

                    // console.log("Sending notification to customer...");

                    const response = await sendPushNotification({
                        token: customerToken.token,
                        ...customerNotification,
                        data: notificationData,
                    });

                    // console.log("Customer Response:", response);

                } else {
                    console.log("Customer token not found.");
                }

            } catch (err) {
                console.error("Customer Notification Error:", err);
            }

            // ================= Merchant =================
            try {

                // console.log("\n========== MERCHANT ==========");
                // console.log("Merchant ID:", branch.merchant_id);

                const merchantToken = await UserNotificationToken.findOne({
                    where: {
                        user_id: branch.merchant_id,
                        user_type: "merchant",
                    },
                });

                // console.log("Merchant Token Record:",
                //     merchantToken ? merchantToken.toJSON() : null);

                if (merchantToken?.token) {

                    console.log("Sending notification to merchant...");

                    const response = await sendPushNotification({
                        token: merchantToken.token,
                        ...merchantNotification,
                        data: notificationData,
                    });

                    // console.log("Merchant Response:", response);

                } else {
                    console.log("Merchant token not found.");
                }

            } catch (err) {
                console.error("Merchant Notification Error:", err);
            }

            // ================= Receptionists =================
            try {

                // console.log("\n========== RECEPTIONISTS ==========");

                const receptionists = await Receptionist.findAll({
                    where: {
                        branch_id: branch.id,
                        status: 1,
                        del_status: 0,
                    },
                });

                // console.log("Receptionists Count:", receptionists.length);

                for (const receptionist of receptionists) {

                    // console.log("--------------------------------");
                    // console.log("Receptionist:", receptionist.toJSON());

                    const receptionToken = await UserNotificationToken.findOne({
                        where: {
                            user_id: receptionist.id,
                            user_type: "receptionist",
                        },
                    });

                    // console.log(
                    //     "Receptionist Token Record:",
                    //     receptionToken ? receptionToken.toJSON() : null
                    // );

                    if (receptionToken?.token) {

                        console.log("Sending notification to receptionist:", receptionist.name);

                        const response = await sendPushNotification({
                            token: receptionToken.token,
                            ...receptionistNotification,
                            data: notificationData,
                        });

                        // console.log("Receptionist Response:", response);

                    } else {

                        console.log(
                            `No notification token found for Receptionist ID ${receptionist.id}`
                        );
                    }
                }

            } catch (err) {
                console.error("Receptionist Notification Error:", err);
            }

            // console.log("========== APPOINTMENT NOTIFICATION END ==========\n");
        }


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
                'approved_by_id',
                'remarks',
                'ref_id'
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
                'approved_by_id',
                'remarks',
                'ref_id'
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

        let notification;


        if (Number(status) === 1) {

            updateData.approved_by =
                'merchant';

            updateData.approved_by_id =
                merchant.id;


            notification = 'approved';
        }


        if (Number(status) === 2) {

            updateData.cancel_by =
                'merchant';

            updateData.cancel_reason =
                cancel_reason || null;
            notification = 'cancelled';
        }


        await appointment.update(updateData);

        const branch = await Branch.findByPk(appointment.br_id);
        if (branch) {

            // console.log("\n========== APPOINTMENT NOTIFICATION START ==========");
            // console.log("Notification Status:", notification);
            // console.log("Appointment:", appointment.toJSON ? appointment.toJSON() : appointment);
            // console.log("Branch:", branch.toJSON ? branch.toJSON() : branch);

            // Notification template based on status
            const customerNotification = getNotificationTemplate(
                "appointment",
                "b2c",
                notification,
                notification === "cancelled" ? "Receptionist" : null,
                notification === "cancelled" ? cancel_reason : null
            );

            const merchantNotification = getNotificationTemplate(
                "appointment",
                "b2b",
                notification,
                notification === "cancelled" ? "Receptionist" : null,
                notification === "cancelled" ? cancel_reason : null
            );

            const receptionistNotification = getNotificationTemplate(
                "appointment",
                "b2b",
                notification,
                notification === "cancelled" ? "Receptionist" : null,
                notification === "cancelled" ? cancel_reason : null
            );

            // console.log("Customer Template:", customerNotification);
            // console.log("Merchant Template:", merchantNotification);
            // console.log("Receptionist Template:", receptionistNotification);

            // Common notification data
            const notificationData = {
                type: "appointment",
                appointment_id: appointment.id,
                branch_id: appointment.br_id,
            };

            if (notification === "cancelled") {
                notificationData.cancel_by = "merchant";
                notificationData.cancel_reason = cancel_reason || "";
            }

            // console.log("Notification Payload:", notificationData);

            // ================= Customer =================
            try {

                // console.log("\n========== CUSTOMER ==========");
                // console.log("Customer ID:", appointment.cus_id);

                const customerToken = await UserNotificationToken.findOne({
                    where: {
                        user_id: appointment.cus_id,
                        user_type: "customer",
                    },
                });

                // console.log("Customer Token Record:",
                //     customerToken ? customerToken.toJSON() : null);

                if (customerToken?.token) {

                    // console.log("Sending notification to customer...");

                    const response = await sendPushNotification({
                        token: customerToken.token,
                        ...customerNotification,
                        data: notificationData,
                    });

                    // console.log("Customer Response:", response);

                } else {
                    console.log("Customer token not found.");
                }

            } catch (err) {
                console.error("Customer Notification Error:", err);
            }

            // ================= Merchant =================
            try {

                // console.log("\n========== MERCHANT ==========");
                // console.log("Merchant ID:", branch.merchant_id);

                const merchantToken = await UserNotificationToken.findOne({
                    where: {
                        user_id: branch.merchant_id,
                        user_type: "merchant",
                    },
                });

                // console.log("Merchant Token Record:",
                //     merchantToken ? merchantToken.toJSON() : null);

                if (merchantToken?.token) {

                    console.log("Sending notification to merchant...");

                    const response = await sendPushNotification({
                        token: merchantToken.token,
                        ...merchantNotification,
                        data: notificationData,
                    });

                    // console.log("Merchant Response:", response);

                } else {
                    console.log("Merchant token not found.");
                }

            } catch (err) {
                console.error("Merchant Notification Error:", err);
            }

            // ================= Receptionists =================
            try {

                // console.log("\n========== RECEPTIONISTS ==========");

                const receptionists = await Receptionist.findAll({
                    where: {
                        branch_id: branch.id,
                        status: 1,
                        del_status: 0,
                    },
                });

                // console.log("Receptionists Count:", receptionists.length);

                for (const receptionist of receptionists) {

                    // console.log("--------------------------------");
                    // console.log("Receptionist:", receptionist.toJSON());

                    const receptionToken = await UserNotificationToken.findOne({
                        where: {
                            user_id: receptionist.id,
                            user_type: "receptionist",
                        },
                    });

                    // console.log(
                    //     "Receptionist Token Record:",
                    //     receptionToken ? receptionToken.toJSON() : null
                    // );

                    if (receptionToken?.token) {

                        console.log("Sending notification to receptionist:", receptionist.name);

                        const response = await sendPushNotification({
                            token: receptionToken.token,
                            ...receptionistNotification,
                            data: notificationData,
                        });

                        // console.log("Receptionist Response:", response);

                    } else {

                        console.log(
                            `No notification token found for Receptionist ID ${receptionist.id}`
                        );
                    }
                }

            } catch (err) {
                console.error("Receptionist Notification Error:", err);
            }

            // console.log("========== APPOINTMENT NOTIFICATION END ==========\n");
        }
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


// exports.generate_branch_passlock = async (req, res) => {
//     try {
//         const passlock = await generateBranchPasslock();

//         return res.json({
//             status: 1,
//             message: "Passlock generated successfully.",
//             passlock
//         });

//     } catch (error) {
//         console.error("Generate Branch Passlock API Error:", error);

//         return res.json({
//             status: 0,
//             message: "Failed to generate passlock.",
//             error: error.message
//         });
//     }
// };

exports.reception_book_appointment = async (req, res) => {
    try {

    }
    catch (err) {
        console.log("Err", err);
        return res.status(401).json({
            status: 0,
            message: "Network Issues"
        })
    }
}