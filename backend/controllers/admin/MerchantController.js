const { Merchant, Coupon, RefreshToken, Branch, Receptionist, MerchantFp, Category, BranchImage, MenuImage, Appointment } = require('../../models');
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
const { Op, Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

exports.createOrUpdateMerchant = async (req, res) => {

    try {




        let merchant = null;

        const mer_id = req.body.mer_id;

        if (mer_id) {

            merchant = await Merchant.findOne({

                where: {

                    id: mer_id,
                    del_status: 0

                }

            });

            if (!merchant) {

                return res.json({

                    status: 0,
                    message: "Merchant not found"

                });

            }

        }

        // =========================
        // REQUEST DATA
        // =========================

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

        if (phone) {

            try {

                const cleanPhone = phone.replace(/\s+/g, '');

                const fullPhone = cleanPhone.startsWith('+')
                    ? cleanPhone
                    : (country_code || '') + cleanPhone;

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

                console.log("FULL PHONE:", phoneNumber);
                console.log("COUNTRY CODE:", callingCode);
                console.log("PHONE:", nationalNumber);

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

            const phoneExists = await Merchant.findOne({

                where: {

                    country_code: callingCode,
                    phone: nationalNumber,

                    ...(merchant && {
                        id: {
                            [Op.ne]: merchant.id
                        }
                    })

                }

            });

            if (phoneExists) {

                return res.json({
                    status: 0,
                    message: "Phone already exists"
                });

            }

        }

        // =========================
        // EMAIL EXISTS CHECK
        // =========================

        if (email) {

            const emailExists = await Merchant.findOne({

                where: {

                    email,

                    ...(merchant && {
                        id: {
                            [Op.ne]: merchant.id
                        }
                    })

                }

            });

            if (emailExists) {

                return res.json({
                    status: 0,
                    message: "Email already exists"
                });

            }

        }

        // =========================
        // FILE UPLOADS
        // =========================

        let fileData = {

            profile_image: merchant?.profile_image || '',
            brand_image: merchant?.brand_image || '',
            document: merchant?.document || ''

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

        // =========================
        // CREATE NEW MERCHANT
        // =========================

        if (!merchant) {

            if (!password) {

                return res.json({
                    status: 0,
                    message: "Password required"
                });

            }

            const hashedPassword = await bcrypt.hash(password, 10);

            merchant = await Merchant.create({

                ...req.body,

                country_code: callingCode,
                phone: nationalNumber,

                password: hashedPassword,

                ...fileData,

                status: 0

            });



            try {

                await sendMail(

                    email,

                    'Merchant Registration Successful',

                    RegisterTemplate(
                        'merchant',
                        merchant.name
                    )

                );

                console.log("Registration mail sent");

            } catch (mailErr) {

                console.log("MAIL ERROR:", mailErr);

            }

            return res.json({

                status: 1,

                message: "Merchant Registered Successfully",





            });

        }


        await merchant.update({

            ...req.body,

            ...(callingCode && {
                country_code: callingCode
            }),

            ...(nationalNumber && {
                phone: nationalNumber
            }),

            ...fileData,

            status: 0

        });

        return res.json({

            status: 1,

            message: "Merchant Updated Successfully"

        });

    } catch (err) {

        console.log(err);

        return res.json({

            status: 0,

            message: "Error"

        });

    }

};

exports.update_status = async (req, res) => {
    try {

        const { id, status } = req.body;

        const merchant = await Merchant.findOne({
            where: {
                id: id,
                del_status: 0
            }
        });

        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        await Merchant.update(
            {
                status: status
            },
            {
                where: {
                    id: id
                }
            }
        );

        return res.json({
            status: 1,
            message: "Merchant status updated successfully"
        });

    } catch (err) {

        console.log(err);

        return res.json({
            status: 0,
            message: "Issue with update"
        });

    }
};

exports.update_category = async (req, res) => {
    try {

        const { id, cat_id } = req.body;

        if (!id || !cat_id) {
            return res.json({
                status: 0,
                message: "Merchant and category are required"
            });
        }

        const merchant = await Merchant.findOne({
            where: {
                id: id,
                del_status: 0
            }
        });

        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        const category = await Category.findOne({
            where: {
                id: cat_id,
                del_status: 0,
                status: 1
            }
        });

        if (!category) {
            return res.json({
                status: 0,
                message: "Category not found"
            });
        }

        await merchant.update({
            cat_id: category.id,
            bus_cat: category.name
        });

        return res.json({
            status: 1,
            message: "Merchant category updated successfully",
            data: {
                cat_id: category.id,
                bus_cat: category.name
            }
        });

    } catch (err) {

        console.log(err);

        return res.json({
            status: 0,
            message: err.message || "Issue with category update"
        });

    }
};
exports.delete_status = async (req, res) => {
    try {

        const { id } = req.body;

        const merchant = await Merchant.findOne({
            where: {
                id: id,
                del_status: 0
            }
        });

        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        const deletedAt = new Date();


        const receptionists = await Receptionist.findAll({
            where: {
                merchant_id: id,
                del_status: 0
            },
            attributes: ['id']
        });

        const receptionistIds = receptionists.map(item => item.id);


        await Merchant.update(
            {
                del_status: 1,
                status: 0,
                deleted_at: deletedAt
            },
            {
                where: {
                    id: id
                }
            }
        );


        await Branch.update(
            {
                del_status: 1,
                status: 0,
                deleted_at: deletedAt
            },
            {
                where: {
                    merchant_id: id
                }
            }
        );


        await Receptionist.update(
            {
                del_status: 1,
                status: 0,
                deleted_at: deletedAt
            },
            {
                where: {
                    merchant_id: id
                }
            }
        );


        await RefreshToken.destroy({
            where: {
                user_id: id,
                user_type: 'merchant'
            }
        });


        if (receptionistIds.length > 0) {

            await RefreshToken.destroy({
                where: {
                    user_id: {
                        [Op.in]: receptionistIds
                    },
                    user_type: 'receptionist'
                }
            });

        }

        return res.json({
            status: 1,
            message: "Merchant, Branches and Receptionists deleted successfully"
        });

    } catch (err) {

        console.log(err);

        return res.json({
            status: 0,
            message: err.message || "Issue with update"
        });

    }
};


exports.receptionistsbyid = async (req, res) => {
    try {

        const { id } = req.body;

        if (!id) {
            return res.json({
                status: 0,
                message: "Receptionist id is required"
            });
        }

        const resp = await Receptionist.findOne({
            where: {
                id: id,
                del_status: 0
            },
            attributes: [
                'id',
                'name',
                'email',
                'country_code',
                'phone',
                'createdAt',
                'profile_image',
                'branch_id'
            ],
            include: [
                {
                    model: Branch,
                    attributes: [
                        'name'
                    ],
                    required: false
                }
            ]
        });

        if (!resp) {
            return res.json({
                status: 0,
                message: "Receptionist not found"
            });
        }

        const data = resp.toJSON();

        data.branch_name = data.Branch
            ? data.Branch.name
            : null;

        delete data.Branch;

        data.profile_image = data.profile_image
            ? `${baseUrl}/${data.profile_image}`
            : null;

        return res.json({
            status: 1,
            message: "Receptionist fetched successfully",
            data
        });

        return res.json({
            status: 1,
            message: "Receptionist fetched successfully",
            data
        });

    } catch (err) {

        console.log("Error:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }
};

exports.receptionistsEdit = async (req, res) => {
    try {

        const { id } = req.body;

        if (!id) {
            return res.json({
                status: 0,
                message: "Receptionist id is required"
            });
        }

        const receptionist = await Receptionist.findOne({
            where: {
                id,
                del_status: 0
            }
        });

        if (!receptionist) {
            return res.json({
                status: 0,
                message: "Receptionist not found"
            });
        }

        let profile_image = receptionist.profile_image;

        if (req.files && req.files.length > 0) {

            req.files.forEach(file => {

                if (file.fieldname === 'profile_image') {
                    profile_image = file.path.replace(/\\/g, '/');
                }

            });

        }

        // Phone validation
        if (req.body.phone) {

            try {

                const cleanPhone = req.body.phone.replace(/\s+/g, '');

                const countryCode = req.body.country_code || '';

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

                req.body.country_code = `+${num.countryCallingCode}`;
                req.body.phone = num.nationalNumber;

            } catch (err) {

                return res.json({
                    status: 0,
                    message: "Invalid phone format"
                });

            }

            const phoneExists = await Receptionist.findOne({
                where: {
                    country_code: req.body.country_code,
                    phone: req.body.phone,
                    id: {
                        [Op.ne]: receptionist.id
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

        // Email validation
        if (req.body.email) {

            const emailExists = await Receptionist.findOne({
                where: {
                    email: req.body.email,
                    id: {
                        [Op.ne]: receptionist.id
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

        // Remove fields that should not be updated
        delete req.body.id;
        delete req.body.branch_id;

        await receptionist.update({
            ...req.body,
            profile_image
        });

        return res.json({
            status: 1,
            message: "Receptionist updated successfully"
        });

    } catch (err) {

        console.log(err);

        return res.json({
            status: 0,
            message: err.message
        });

    }
};

exports.receptionistsRegister = async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            password,
            country_code,
            mer_id
        } = req.body;

        if (!mer_id) {

            return res.json({
                status: 0,
                message: "Merchant id is required"
            });

        }

        const merchant = await Merchant.findOne({
            where: {
                id: mer_id,
                del_status: 0
            }
        });

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

        // Phone exists check
        const phexists = await Receptionist.findOne({
            where: {
                country_code: callingCode,
                phone: nationalNumber,
                del_status: 0
            }
        });

        if (phexists) {

            return res.json({
                status: 0,
                message: "Phone already exists"
            });

        }

        // Email exists check
        const exists = await Receptionist.findOne({
            where: {
                email,
                del_status: 0
            }
        });

        if (exists) {

            return res.json({
                status: 0,
                message: "Email already exists"
            });

        }

        // Profile image upload
        let profileImage = '';

        if (req.files && req.files.length > 0) {

            const profileFile = req.files.find(
                file => file.fieldname === 'profile_image'
            );

            if (profileFile) {

                profileImage = profileFile.path.replace(/\\/g, '/');

            }

        }

        // Password hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create receptionist
        const receptionist = await Receptionist.create({

            merchant_id: merchant.id,

            branch_id: null,

            name,
            email,

            country_code: callingCode,
            phone: nationalNumber,

            password: hashedPassword,

            profile_image: profileImage,

            status: 1,
            del_status: 0

        });

        return res.json({

            status: 1,
            message: "Receptionist registered successfully",
            data: {
                id: receptionist.id,
                merchant_id: receptionist.merchant_id,
                branch_id: receptionist.branch_id,
                name: receptionist.name,
                email: receptionist.email
            }

        });

    } catch (err) {

        console.log("REGISTER ERROR:", err);

        return res.json({
            status: 0,
            message: err.message || "Error"
        });

    }

};
exports.branchRegister = async (req, res) => {

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

            mer_id, city, state, country
        } = req.body;

        // console.log("BODY:", req.body);
        // console.log("mer_id:", mer_id);

        if (
            !name ||
            !email ||
            !phone ||
            !mer_id
        ) {

            return res.json({
                status: 0,
                message: "Required fields missing"
            });

        }

        if (
            open_time &&
            close_time &&
            open_time >= close_time
        ) {

            return res.json({
                status: 0,
                message: "Close time must be greater than open time"
            });

        }

        let nationalNumber;
        let callingCode;

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

        } catch (err) {

            return res.json({
                status: 0,
                message: "Invalid phone format"
            });

        }

        // Email Exists Check
        const emailExists = await Branch.findOne({
            where: { email }
        });

        if (emailExists) {

            return res.json({
                status: 0,
                message: "Email already exists"
            });

        }

        // Phone Exists Check
        const phoneExists = await Branch.findOne({
            where: {
                country_code: callingCode,
                phone: nationalNumber
            }
        });

        if (phoneExists) {

            return res.json({
                status: 0,
                message: "Phone already exists"
            });

        }

        // Merchant Check
        const merchant = await Merchant.findByPk(mer_id);

        if (!merchant) {

            return res.json({
                status: 0,
                message: "Invalid merchant"
            });

        }

        // Files
        const files = req.files || [];

        const profileFiles = files.filter((file) => file.fieldname === 'profile_image');
        const galleryFiles = files.filter((file) => file.fieldname === 'images' || file.fieldname === 'image');
        const menuFiles = files.filter((file) => file.fieldname === 'menu_images' || file.fieldname === 'menu_image');

        const profile_image =
            profileFiles.length > 0
                ? profileFiles[0].path.replace(/\\/g, '/')
                : null;

        // Create Branch
        const branch = await Branch.create({

            name,

            email,

            country_code: callingCode,

            phone: nationalNumber,

            profile_image,

            lat,

            lon,

            address,

            description,

            open_time,

            close_time,

            merchant_id: mer_id,

            status: 1,

            del_status: 0,
            city, state, country

        });

        // Save gallery images
        if (galleryFiles.length > 0) {

            const imageData = galleryFiles.map((file) => ({

                branch_id: branch.id,

                image: file.path.replace(/\\/g, '/')

            }));

            await BranchImage.bulkCreate(imageData);

        }

        // Save menu images
        if (menuFiles.length > 0) {

            const menuImageData = menuFiles.map((file) => ({

                branch_id: branch.id,

                image: file.path.replace(/\\/g, '/'),

                status: 1

            }));

            await MenuImage.bulkCreate(menuImageData);

        }

        return res.json({

            status: 1,

            message: "Branch created successfully",

            branch_id: branch.id

        });

    } catch (err) {

        console.log("BRANCH ERROR:", err);

        return res.json({

            status: 0,

            message: err.message

        });

    }

};

exports.branchUpdate = async (req, res) => {

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
            country_code, city, state, country
        } = req.body;



        // ✅ Branch ID Check
        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID required"
            });

        }

        const branch = await Branch.findOne({

            where: {
                id: branch_id,
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
        if (
            open_time &&
            close_time &&
            open_time >= close_time
        ) {

            return res.json({
                status: 0,
                message:
                    "Close time must be greater than open time"
            });

        }

        // ✅ Files
        const files = req.files || [];

        const profileFiles = files.filter((file) => file.fieldname === 'profile_image');
        const galleryFiles = files.filter((file) => file.fieldname === 'images' || file.fieldname === 'image');

        let profile_image =
            branch.profile_image;

        // ✅ Update Profile Image
        if (profileFiles.length > 0) {

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
                profileFiles[0].path.replace(/\\/g, '/');

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

            open_time:
                open_time || branch.open_time,

            close_time:
                close_time || branch.close_time,
            city,
            state,
            country

        });

        // ✅ Sync gallery images — keep selected existing, remove unselected, add new uploads
        const shouldSyncGallery =
            req.body.gallery_sync === '1' ||
            req.body.gallery_sync === 1 ||
            req.body.existing_image_ids !== undefined ||
            req.body.old_images !== undefined ||
            galleryFiles.length > 0;

        if (shouldSyncGallery) {

            let existingImageIds = req.body.existing_image_ids;
            let oldImages = req.body.old_images;

            if (!Array.isArray(existingImageIds)) {
                existingImageIds = existingImageIds ? [existingImageIds] : [];
            }

            if (!Array.isArray(oldImages)) {
                oldImages = oldImages ? [oldImages] : [];
            }

            existingImageIds = existingImageIds
                .map((imageId) => String(imageId).trim())
                .filter(Boolean);

            const normalizeImagePath = (value) => {
                if (!value) {
                    return '';
                }

                let pathValue = String(value);

                try {
                    if (pathValue.startsWith('http')) {
                        pathValue = new URL(pathValue).pathname;
                    }
                } catch (err) {
                    // keep raw value when URL parsing fails
                }

                return pathValue.replace(/^\/+/, '').replace(/\\/g, '/');
            };

            const oldImagePaths = oldImages
                .map((imagePath) => normalizeImagePath(imagePath))
                .filter(Boolean);

            const currentImages =
                await BranchImage.findAll({

                    where: { branch_id }

                });

            for (const img of currentImages) {

                const keepById = existingImageIds.includes(String(img.id));
                const keepByPath = oldImagePaths.includes(normalizeImagePath(img.image));

                if (!keepById && !keepByPath) {

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

                    await img.destroy();

                }

            }

            if (galleryFiles.length > 0) {

                const imageData =
                    galleryFiles.map((file) => ({

                        branch_id,

                        image:
                            file.path.replace(/\\/g, '/')

                    }));

                await BranchImage.bulkCreate(
                    imageData
                );

            }

        }

        // ✅ Sync menu images — keep selected existing, remove unselected, add new uploads
        const shouldSyncMenu =
            req.body.menu_sync === '1' ||
            req.body.menu_sync === 1 ||
            req.body.existing_menu_image_ids !== undefined ||
            req.body.old_menu_images !== undefined ||
            menuFiles.length > 0;

        if (shouldSyncMenu) {

            let existingMenuImageIds = req.body.existing_menu_image_ids;
            let oldMenuImages = req.body.old_menu_images;

            if (!Array.isArray(existingMenuImageIds)) {
                existingMenuImageIds = existingMenuImageIds ? [existingMenuImageIds] : [];
            }

            if (!Array.isArray(oldMenuImages)) {
                oldMenuImages = oldMenuImages ? [oldMenuImages] : [];
            }

            existingMenuImageIds = existingMenuImageIds
                .map((imageId) => String(imageId).trim())
                .filter(Boolean);

            const normalizeImagePath = (value) => {
                if (!value) {
                    return '';
                }

                let pathValue = String(value);

                try {
                    if (pathValue.startsWith('http')) {
                        pathValue = new URL(pathValue).pathname;
                    }
                } catch (err) {
                    // keep raw value when URL parsing fails
                }

                return pathValue.replace(/^\/+/, '').replace(/\\/g, '/');
            };

            const oldMenuImagePaths = oldMenuImages
                .map((imagePath) => normalizeImagePath(imagePath))
                .filter(Boolean);

            const currentMenuImages =
                await MenuImage.findAll({

                    where: { branch_id }

                });

            for (const img of currentMenuImages) {

                const keepById = existingMenuImageIds.includes(String(img.id));
                const keepByPath = oldMenuImagePaths.includes(normalizeImagePath(img.image));

                if (!keepById && !keepByPath) {

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
                                "Menu delete error:",
                                err.message
                            );

                        }

                    }

                    await img.destroy();

                }

            }

            if (menuFiles.length > 0) {

                const menuImageData =
                    menuFiles.map((file) => ({

                        branch_id,

                        image:
                            file.path.replace(/\\/g, '/'),

                        status: 1

                    }));

                await MenuImage.bulkCreate(
                    menuImageData
                );

            }

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
exports.fetch_branch_id = async (req, res) => {
    try {

        const branch_id = parseInt(req.params.id);

        if (!branch_id) {
            return res.json({
                status: 0,
                message: "Branch ID required"
            });
        }

        const baseUrl = process.env.APP_URL;

        const [
            branch,
            coupons,
            pendingCount,
            approvedCount,
            rejectedCount
        ] = await Promise.all([

            Branch.findOne({
                where: {
                    id: branch_id,
                    del_status: 0
                },

                attributes: [
                    'id',
                    'name',
                    'email',
                    'phone',
                    'profile_image',
                    'lat',
                    'lon',
                    'city',
                    'state',
                    'address',
                    'merchant_id',
                    'description',
                    'open_time',
                    'close_time'
                ],

                include: [
                    {
                        model: BranchImage,
                        attributes: ['id', 'image'],
                        required: false
                    },
                    {
                        model: MenuImage,
                        attributes: ['id', 'image'],
                        required: false
                    },
                    {
    model: Appointment,
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
    required: false
}
                    
                ]
            }),

            Coupon.findAll({
                attributes: [
                    'id',
                    'merchant_id',
                    'code',
                    'percentage',
                    'min_amount',
                    'usage_limit',
                    'start_date',
                    'end_date',
                    'banner_image'
                ],

                where: {
                    del_status: 0,
                    status: 1,
                    [Op.and]: Sequelize.literal(
                        `${branch_id} = ANY("branch_ids")`
                    )
                },

                order: [['id', 'DESC']]
            }),

            Appointment.count({
                where: {
                    br_id: branch_id,
                    status: 0
                }
            }),

            Appointment.count({
                where: {
                    br_id: branch_id,
                    status: 1
                }
            }),

            Appointment.count({
                where: {
                    br_id: branch_id,
                    status: 2
                }
            })
        ]);

        if (!branch) {
            return res.json({
                status: 0,
                message: "Branch not found"
            });
        }

        const data = branch.toJSON();

        // Profile Image
        data.profile_image = data.profile_image
            ? `${baseUrl}/${data.profile_image.replace(/\\/g, '/')}`
            : null;

        // Branch Images
        if (data.BranchImages) {
            data.BranchImages = data.BranchImages.map(img => ({
                ...img,
                image: img.image
                    ? `${baseUrl}/${img.image.replace(/\\/g, '/')}`
                    : null
            }));
        }

        // Menu Images
        if (data.MenuImages) {
            data.MenuImages = data.MenuImages.map(img => ({
                ...img,
                image: img.image
                    ? `${baseUrl}/${img.image.replace(/\\/g, '/')}`
                    : null
            }));
        }

        // Coupons
        const couponData = coupons.map(item => {

            const cpn = item.toJSON();

            cpn.banner_image = cpn.banner_image
                ? `${baseUrl}/${cpn.banner_image.replace(/\\/g, '/')}`
                : null;

            cpn.is_expired =
                cpn.end_date &&
                    new Date() > new Date(cpn.end_date)
                    ? 1
                    : 0;

            return cpn;
        });

        const status_count = {

            pending_appointment: pendingCount,

            approved_appointment: approvedCount,

            rejected_appointment: rejectedCount,

            total_coupon: couponData.length,

            active_coupon: couponData.filter(
                item => item.is_expired === 0
            ).length,

            expired_coupon: couponData.filter(
                item => item.is_expired === 1
            ).length
        };

        return res.json({
            status: 1,
            data,
            coupon: couponData,
            status_count
        });

    } catch (err) {

        console.log("BRANCH FETCH ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }
};

exports.create_coupon = async (req, res) => {

    try {

        let {
            code,
            percentage,
            min_amount,
            usage_limit,
            start_date,
            branch_ids,
            end_date,
            mer_id
        } = req.body;

        if (typeof branch_ids === "string") {

            try {

                branch_ids = JSON.parse(branch_ids);

            } catch (err) {

                branch_ids = [];

            }

        }

        if (
            !code ||
            percentage === undefined ||
            !start_date ||
            !end_date ||
            !mer_id
        ) {

            return res.json({
                status: 0,
                message: "Required fields missing"
            });

        }

        if (
            !branch_ids ||
            !Array.isArray(branch_ids) ||
            branch_ids.length === 0
        ) {

            return res.json({
                status: 0,
                message: "Please select branches"
            });

        }

        const coupon_check = await Coupon.findOne({

            where: {
                code: code
            }

        });

        if (coupon_check) {

            return res.json({
                status: 0,
                message: "Coupon already exists"
            });

        }

        if (
            Number(percentage) < 0 ||
            Number(percentage) > 100
        ) {

            return res.json({
                status: 0,
                message: "Percentage must be between 0 and 100"
            });

        }

        if (
            min_amount &&
            Number(min_amount) < 0
        ) {

            return res.json({
                status: 0,
                message: "Minimum amount must be greater than or equal to 0"
            });

        }

        if (
            usage_limit &&
            Number(usage_limit) < 0
        ) {

            return res.json({
                status: 0,
                message: "Usage limit must be greater than or equal to 0"
            });

        }

        const formatDate = (date) => {

            if (!date) return null;

            if (date.includes('/')) {

                const parts = date.split('/');

                return `${parts[2]}-${parts[1]}-${parts[0]}`;

            }

            if (date.includes('-')) {

                const parts = date.split('-');

                if (parts[0].length === 2) {

                    return `${parts[2]}-${parts[1]}-${parts[0]}`;

                }

                return date;

            }

            return null;

        };

        start_date = formatDate(start_date);
        end_date = formatDate(end_date);

        if (
            !start_date ||
            !end_date
        ) {

            return res.json({
                status: 0,
                message: "Invalid date format"
            });

        }

        if (new Date(start_date) >= new Date(end_date)) {

            return res.json({
                status: 0,
                message: "End date must be greater than start date"
            });

        }

        const valid_branches = await Branch.findAll({

            where: {
                id: branch_ids,
                merchant_id: mer_id,
                del_status: 0
            },

            attributes: ['id']

        });

        if (
            valid_branches.length !== branch_ids.length
        ) {

            return res.json({
                status: 0,
                message: "Invalid branch selected"
            });

        }

        const bannerFile = req.files
            ? req.files.find(file => file.fieldname === "banner_image")
            : null;

        const banner_image = bannerFile
            ? bannerFile.path.replace(/\\/g, '/')
            : null;

        const coupon = await Coupon.create({

            merchant_id: mer_id,

            branch_ids: branch_ids,

            code: code,

            percentage: Number(percentage),

            min_amount: min_amount || 0,

            usage_limit: usage_limit || 0,

            start_date: start_date,

            end_date: end_date,

            banner_image: banner_image,

            status: 1,

            del_status: 0

        });

        return res.json({

            status: 1,
            message: "Coupon created successfully",
            data: coupon

        });

    } catch (err) {

        console.log("FULL ERROR:", err);

        return res.json({

            status: 0,
            message: err.message

        });

    }

};

exports.update_coupon = async (req, res) => {

    try {

        let {
            coupon_id,
            branch_ids,
            code,
            percentage,
            min_amount,
            usage_limit,
            start_date,
            end_date,
        mer_id
        } = req.body;

       
const merchant_id = mer_id;

if (!merchant_id) {

    return res.json({
        status: 0,
        message: "Merchant not found"
    });

}


        if (typeof branch_ids === "string") {

            try {

                branch_ids = JSON.parse(branch_ids);

            } catch (err) {

                branch_ids = [];

            }

        }


        if (
            !coupon_id ||
            !code ||
            !percentage
            || !start_date ||
            !end_date
        ) {

            return res.json({
                status: 0,
                message: "Required fields missing"
            });

        }


        if (
            !branch_ids ||
            !Array.isArray(branch_ids) ||
            branch_ids.length === 0
        ) {

            return res.json({
                status: 0,
                message: "Please select branches"
            });

        }


        const exist_coupon = await Coupon.findOne({

            where: {
                id: coupon_id,
                merchant_id: merchant_id,
                del_status: 0
            }

        });

        if (!exist_coupon) {

            return res.json({
                status: 0,
                message: "Coupon not found"
            });

        }


        const coupon_check = await Coupon.findOne({

            where: {

                code: code,

                id: {
                    [Op.ne]: coupon_id
                }

            }

        });

        if (coupon_check) {

            return res.json({
                status: 0,
                message: "Coupon already exists"
            });

        }

       
        if (
            Number(percentage) < 0 ||
            Number(percentage) > 100
        ) {

            return res.json({
                status: 0,
                message: "Percentage must be between 0 and 100"
            });

        }

        
        if (
            min_amount &&
            Number(min_amount) < 0
        ) {

            return res.json({
                status: 0,
                message: "Minimum amount must be greater than or equal to 0"
            });

        }

        
        if (
            usage_limit &&
            Number(usage_limit) < 0
        ) {

            return res.json({
                status: 0,
                message: "Usage limit must be greater than or equal to 0"
            });

        }

   
        if (start_date >= end_date) {

            return res.json({
                status: 0,
                message: "End time must be greater than start time"
            });

        }

       
        const valid_branches = await Branch.findAll({

            where: {
                id: branch_ids,
                merchant_id: merchant_id,
                del_status: 0
            },

            attributes: ['id']

        });

        if (
            valid_branches.length !== branch_ids.length
        ) {

            return res.json({
                status: 0,
                message: "Invalid branch selected"
            });

        }

        
        let banner_image = exist_coupon.banner_image;

        const bannerFile = req.files.find(
            file => file.fieldname === "banner_image"
        );

        if (bannerFile) {

            banner_image = bannerFile.path.replace(/\\/g, '/');

        }


        
const formatDate = (date) => {

    if (!date) return null;

   
    if (date.includes('/')) {

        const parts = date.split('/');

        return `${parts[2]}-${parts[1]}-${parts[0]}`;

    }

  
    if (date.includes('-')) {

        const parts = date.split('-');

        // already YYYY-MM-DD
        if (parts[0].length === 4) {

            return date;

        }

        return `${parts[2]}-${parts[1]}-${parts[0]}`;

    }

    return null;

};

start_date = formatDate(start_date);
end_date = formatDate(end_date);

// console.log("START DATE:", start_date);
// console.log("END DATE:", end_date);
       
        await exist_coupon.update({

            branch_ids: branch_ids,

            code: code,

            percentage: percentage,

            min_amount: min_amount || 0,

            usage_limit: usage_limit || 0,

            start_date: start_date,

            end_date: end_date,

            banner_image: banner_image

        });

        return res.json({

            status: 1,
            message: "Coupon updated successfully",
            data: exist_coupon

        });

    }
    catch (err) {

        return res.json({

            status: 0,
            message: err.message

        });

    }

};