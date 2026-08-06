const { Merchant, Coupon, RefreshToken, Branch, BranchTiming, Receptionist, MerchantFp, Category, BranchImage, MenuImage, Appointment, CouponApplied, Customer, sequelize } = require('../../models');

const bcrypt = require('bcryptjs');
const { parsePhoneNumber } = require('libphonenumber-js');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const admin = require('../../config/firebase');
const crypto = require('crypto');
const sendMail = require('../../helpers/sendMail');
const { otpTemplate } = require('../../helpers/mailTemplate');
const { sendAccountStatus } = require('../../helpers/sendAccountStatus');
const ResetsTemplate = require('../../helpers/ResetsTemplate');
const RegisterTemplate = require('../../helpers/RegisterTemplate');
const { formatIST } = require('../../helpers/dateHelper.js');
// const mapFiles = require('../../helpers/merchantFileMapper');
const baseUrl = process.env.APP_URL;
const { Op, Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { sendPushNotification } = require("../../helpers/notificationHelper");
const normalizeMerchantStatus = (status, fallback = 1) => {
    if (status === undefined || status === null || status === '') {
        return fallback;
    }

    return Number(status) === 0 ? 0 : 1;
};

exports.createOrUpdateMerchant = async (req, res) => {
    if (req.body.lat === '') req.body.lat = null;
    if (req.body.lon === '') req.body.lon = null;

    try {




        let merchant = null;

        const mer_id = req.body.mer_id;

        if (mer_id) {
            console.log("HI");
            console.log("Body", req.body);


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

                // console.log("FULL PHONE:", phoneNumber);
                // console.log("COUNTRY CODE:", callingCode);
                // console.log("PHONE:", nationalNumber);

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

        const merchantStatus = normalizeMerchantStatus(
            req.body.status,
            merchant?.status ?? 1
        );

        // =========================
        // CREATE NEW MERCHANT
        // =========================
        let hashedPassword = null;

        if (password && password.trim() !== "") {
            hashedPassword = await bcrypt.hash(password.trim(), 10);
        }

        if (!merchant) {

            if (!password) {

                return res.json({
                    status: 0,
                    message: "Password required"
                });

            }


            // console.log('hashedPassword',hashedPassword)

            merchant = await Merchant.create({

                ...req.body,


                country_code: callingCode,
                phone: nationalNumber,

                password: hashedPassword,

                ...fileData,

                status: merchantStatus

            });



            try {

                await sendMail(

                    email,

                    'Merchant Registration Successful',

                    RegisterTemplate(
                        'merchant',
                        merchant.name,
                        'active'
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

            status: merchantStatus,
               ...(hashedPassword && {
        password: hashedPassword
    })

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
        try {
            console.log("=== MAIL PROCESS START ===");
            console.log("Merchant Email:", merchant.email);
            console.log("Merchant Name:", merchant.name);
            console.log("Status:", status);

            console.log("Generating email template...");

            const emailTemplate = sendAccountStatus(
                status,
                'merchant',
                merchant.name
            );

            console.log("Email template generated successfully.");

            console.log("Sending email...");

            await sendMail(
                merchant.email,
                'Merchant Status Update',
                emailTemplate
            );

            console.log("Email sent successfully.");
            console.log("=== MAIL PROCESS END ===");

        } catch (mailErr) {

            console.log("=== MAIL ERROR ===");
            console.log("Merchant Email:", merchant.mail);
            console.log("Merchant Name:", merchant.name);
            console.log("Status:", status);
            console.log("Error Message:", mailErr.message);
            console.log("Full Error:", mailErr);
            console.log("=== END MAIL ERROR ===");

        }
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

exports.doc_verify = async (req, res) => {
    try {

        const { id, doc_verify } = req.body;

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
                doc_verify: doc_verify
            },
            {
                where: {
                    id: id
                }
            }
        );

        return res.json({
            status: 1,
            message: "Merchant document verify successfully"
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
        console.log("Request body", req.body);
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
        console.log("Merchant:", merchant);
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

        // Find all branches of this merchant for deleting their files
        const branches = await Branch.findAll({
            where: { merchant_id: id },
            attributes: ['id', 'profile_image', 'pending_profile_image']
        });
        const branchIds = branches.map(item => item.id);

        // Find branch gallery images
        let branchGalleryImages = [];
        if (branchIds.length > 0) {
            branchGalleryImages = await BranchImage.findAll({
                where: { branch_id: { [Op.in]: branchIds } },
                attributes: ['image', 'pending_image']
            });
        }

        // Find branch menu images
        let branchMenuImages = [];
        if (branchIds.length > 0) {
            branchMenuImages = await MenuImage.findAll({
                where: { branch_id: { [Op.in]: branchIds } },
                attributes: ['image', 'pending_image']
            });
        }

        // Find receptionists
        const receptionists = await Receptionist.findAll({
            where: {
                merchant_id: id,
                del_status: 0
            },
            attributes: ['id', 'profile_image']
        });

        const receptionistIds = receptionists.map(item => item.id);

        // Perform updates (soft-deletes)
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

        // Delete BranchImage and MenuImage database records
        if (branchIds.length > 0) {
            await BranchImage.destroy({
                where: { branch_id: { [Op.in]: branchIds } }
            });
            await MenuImage.destroy({
                where: { branch_id: { [Op.in]: branchIds } }
            });
        }

        // Helper to safely delete files physically
        const deleteFile = (filePath) => {
            if (filePath) {
                const fullPath = path.join(__dirname, '../../', filePath);
                if (fs.existsSync(fullPath)) {
                    try {
                        fs.unlinkSync(fullPath);
                    } catch (err) {
                        console.log(`Error deleting file ${filePath}:`, err.message);
                    }
                }
            }
        };

        // Physically delete merchant files
        deleteFile(merchant.profile_image);
        deleteFile(merchant.document);
        deleteFile(merchant.brand_image);

        // Physically delete branch files
        branches.forEach(branch => {
            deleteFile(branch.profile_image);
            deleteFile(branch.pending_profile_image);
        });

        // Physically delete branch gallery images
        branchGalleryImages.forEach(img => {
            deleteFile(img.image);
            deleteFile(img.pending_image);
        });

        // Physically delete branch menu images
        branchMenuImages.forEach(img => {
            deleteFile(img.image);
            deleteFile(img.pending_image);
        });

        // Physically delete receptionist files
        receptionists.forEach(receptionist => {
            deleteFile(receptionist.profile_image);
        });

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
                'rep_id',
                'name',
                'ref_name',
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

            // if (emailExists) {

            //     return res.json({
            //         status: 0,
            //         message: "Email already exists"
            //     });

            // }

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
            rep_id,
            name,
            ref_name,
            email,
            phone,
            password,
            country_code,
            mer_id,
        } = req.body;
        // console.log("body",req.body)
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

        // Phone exists
        if (nationalNumber && nationalNumber.trim() !== "") {
            const phoneExists = await Receptionist.findOne({
                where: { phone: nationalNumber.trim() }
            });

            if (phoneExists) {
                return res.json({
                    status: 0,
                    message: "Phone already exists"
                });
            }
        }

        // Email exists
        if (email && email.trim() !== "") {
            const emailExists = await Receptionist.findOne({
                where: { email: email.trim() }
            });

            // if (emailExists) {
            //     return res.json({
            //         status: 0,
            //         message: "Email already exists"
            //     });
            // }
        }


        if (!rep_id || rep_id.trim() === "") {
            return res.json({
                status: 0,
                message: "Reception ID is required"
            });
        }

        // Reception ID already exists
        const repIdExists = await Receptionist.findOne({
            where: { rep_id: rep_id.trim() }
        });

        if (repIdExists) {
            return res.json({
                status: 0,
                message: "Reception ID already exists"
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
            rep_id,

            branch_id: null,

            name,
            email: email?.trim() || null,

            country_code: callingCode,
            phone: nationalNumber,

            password: hashedPassword,

            profile_image: profileImage,
            ref_name: ref_name || null,

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
    if (req.body.lat === '') req.body.lat = null;
    if (req.body.lon === '') req.body.lon = null;

    try {

        const {
            name,
            email,
            phone,
            lat,
            lon,
            address,
            address_line_2,
            description,

            country_code,
            receptionist_id,
            mer_id,
            city,
            state,
            country,
            zip_code,
            timings,
            visibility,
            age_group,
            passlock, country_iso,profile_image_status
        } = req.body;

        // console.log("BODY:", req.body);
        // console.log("mer_id:", mer_id);

        if (
            !name ||

            // !phone ||
            !mer_id
            || !passlock
        ) {

            return res.json({
                status: 0,
                message: "Required fields missing"
            });

        }

        const existingPasslock = await Branch.findOne({
            where: { passlock }
        });

        if (existingPasslock) {
            return res.json({
                status: 0,
                message: "Passlock already exists."
            });
        }

        let nationalNumber;
        let callingCode;
        if (phone) {
            try {

                const cleanPhone = phone.replace(/\s+/g, '');

                const fullPhone = cleanPhone.startsWith('+')
                    ? cleanPhone
                    : country_code + cleanPhone;

                const num = parsePhoneNumber(fullPhone);
                console.log("num", num)
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
        }


        // Email Exists Check
        const emailExists = await Branch.findOne({
            where: { email }
        });

        // if (emailExists) {

        //     return res.json({
        //         status: 0,
        //         message: "Email already exists"
        //     });

        // }

        // Phone Exists Check
        if (phone) {
            const phoneExists = await Branch.findOne({
                where: {
                    country_code: callingCode,
                    phone: nationalNumber
                }
            });
        }


        // if (phoneExists) {

        //     return res.json({
        //         status: 0,
        //         message: "Phone already exists"
        //     });

        // }

        // Merchant Check
        const merchant = await Merchant.findByPk(mer_id);

        if (!merchant) {

            return res.json({
                status: 0,
                message: "Invalid merchant"
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
            country_code: callingCode || null,
            phone: nationalNumber,
            profile_image,
            lat,
            lon,
            address,
            address_line_2,
            description,

            merchant_id: mer_id,
            status: 1,
            del_status: 0,
            city,
            state,
            country,
            zip_code,
            profile_image_status :1,
            visibility: visibility !== undefined ? visibility : 0,
            age_group: age_group || 'All Age',
            passlock, country_iso

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
        if (receptionist_id) {

            // Remove this receptionist from any previous branch
            await Receptionist.update(
                {
                    branch_id: null
                },
                {
                    where: {
                        id: receptionist_id,
                        branch_id: {
                            [Op.ne]: null
                        }
                    }
                }
            );

            // Assign receptionist to newly created branch
            await Receptionist.update(
                {
                    branch_id: branch.id
                },
                {
                    where: {
                        id: receptionist_id
                    }
                }
            );

        }

        // Save gallery images
        if (galleryFiles.length > 0) {

            const imageData = galleryFiles.map((file) => ({

                branch_id: branch.id,

                image: file.path.replace(/\\/g, '/'),
                image_status: 1,

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
    if (req.body.lat === '') req.body.lat = null;
    if (req.body.lon === '') req.body.lon = null;
    // console.log("Update branch BODY:", req.body);

    try {

        const {
            branch_id,
            name,
            email,
            phone,
            lat,
            lon,
            address,
            address_line_2,
            description,
            country_code,
            city,
            state,
            country,
            zip_code,
            receptionist_id,
            timings,
            visibility,
            age_group, country_iso,profile_image_status
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

        //         console.log("DB Location:", branch.lat, branch.lon);
        // console.log("Request Location:", lat, lon);
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

            // if (exists) {

            //     return res.json({
            //         status: 0,
            //         message: "Email already exists"
            //     });

            // }

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

            // if (phoneExists) {

            //     return res.json({
            //         status: 0,
            //         message: "Phone already exists"
            //     });

            // }

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


        // ✅ Files
        const files = req.files || [];

        const profileFiles = files.filter((file) => file.fieldname === 'profile_image');
        const galleryFiles = files.filter((file) => file.fieldname === 'images' || file.fieldname === 'image');
        const menuFiles = files.filter(
            (file) =>
                file.fieldname === 'menu_images' ||
                file.fieldname === 'menu_image'
        );

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

            name: name || branch.name,

            email: email || null,

            country_code: callingCode,

            phone: phone ? nationalNumber : null,
            profile_image,

            lat: lat || branch.lat,

            lon: lon || branch.lon,

            address: address || branch.address,
            address_line_2: address_line_2 || branch.address_line_2,

            description: description || branch.description,
            city: city || branch.city,

            state: state || branch.state,

            country: country || branch.country,
            country_iso: country_iso || branch.country_iso,

            zip_code: zip_code || branch.zip_code,
            visibility: visibility !== undefined ? visibility : branch.visibility,
            age_group: age_group || branch.age_group,
            profile_image_status :1,
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
        if (receptionist_id) {

            // Remove current receptionist from any other branch
            await Receptionist.update(
                {
                    branch_id: null
                },
                {
                    where: {
                        id: receptionist_id,
                        branch_id: {
                            [Op.ne]: branch_id
                        }
                    }
                }
            );

            // Remove existing receptionist assigned to this branch
            await Receptionist.update(
                {
                    branch_id: null
                },
                {
                    where: {
                        branch_id: branch_id,
                        id: {
                            [Op.ne]: receptionist_id
                        }
                    }
                }
            );

            // Assign selected receptionist to current branch
            await Receptionist.update(
                {
                    branch_id: branch_id
                },
                {
                    where: {
                        id: receptionist_id
                    }
                }
            );

        }

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
                            update_branch
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
                            file.path.replace(/\\/g, '/'),
                            image_status: 1,

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
                    'country_code',
                    'profile_image',
                    'pending_profile_image',
                    'profile_image_status',
                    'lat',
                    'lon',
                    'city',
                    'zip_code',
                    'country',
                    'state',
                    'address',
                    'address_line_2',
                    'merchant_id',
                    'description',
                    'visibility',
                    'age_group',
                    'created_at',
                ],

                include: [
                    {
                        model: BranchImage,
                        attributes: ['id', 'image', 'pending_image', 'image_status', 'rejected_reason'],
                        required: false
                    },
                    {
                        model: MenuImage,
                        attributes: ['id', 'image', 'pending_image', 'image_status', 'rejected_reason'],
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
                            'approved_by_id',
                            'remarks',
                            'ref_id'
                        ],
                        required: false
                    },
                    {
                        model: Receptionist,
                        attributes: ['id', 'name'],
                    },
                    {
                        model: BranchTiming,
                        attributes: ['id', 'day', 'open_time', 'close_time', 'is_closed'],

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

        data.pending_profile_image = data.pending_profile_image
            ? `${baseUrl}/${data.pending_profile_image.replace(/\\/g, '/')}`
            : null;
        // Branch Images
        if (data.BranchImages) {
            data.BranchImages = data.BranchImages.map(img => ({
                ...img,
                image: img.image
                    ? `${baseUrl}/${img.image.replace(/\\/g, '/')}`
                    : null,
                pending_image: img.pending_image
                    ? `${baseUrl}/${img.pending_image.replace(/\\/g, '/')}`
                    : null,
            }));
        }

        // Menu Images
        if (data.MenuImages) {
            data.MenuImages = data.MenuImages.map(img => ({
                ...img,
                image: img.image
                    ? `${baseUrl}/${img.image.replace(/\\/g, '/')}`
                    : null,
                pending_image: img.pending_image
                    ? `${baseUrl}/${img.pending_image.replace(/\\/g, '/')}`
                    : null,
            }));
        }

        data.created_at = formatIST(data.created_at);
        // Coupons
        const couponData = coupons.map(item => {

            const cpn = item.toJSON();



            cpn.is_expired =
                cpn.end_date &&
                    new Date() > new Date(cpn.end_date)
                    ? 1
                    : 0;

            return cpn;
        });

        const couponIds = coupons.map(item => item.id);
        const appliedCouponCount = await CouponApplied.count({
            where: {
                coupon_id: {
                    [Op.in]: couponIds
                }
            }
        });

        // const redeemedCouponCount = await CouponApplied.count({
        //     where: {
        //         coupon_id: {
        //             [Op.in]: couponIds
        //         },
        //         status: 1
        //     }
        // });
        const redeemedCouponCount = await CouponApplied.count({
            where: {
                status: 1
            },
            include: [{
                model: Coupon,
                required: true,
                where: {
                    [Op.and]: Sequelize.literal(`${branch_id} = ANY("Coupon"."branch_ids")`)
                }
            }]
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
            ).length,
            applied_coupon: appliedCouponCount,

            redeemed_coupon: redeemedCouponCount
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
            description,

            cat_id,
            percentage,
            min_amount,
            usage_limit,
            start_date,
            branch_ids,
            end_date,
            mer_id,
            type,
            buy_item,
            get_item
        } = req.body;
        type = Number(type ?? 1);


        if (typeof branch_ids === "string") {

            try {

                branch_ids = JSON.parse(branch_ids);

            } catch (err) {

                branch_ids = [];

            }

        }

        if (
            !code ||
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
        if (![1, 2, 3].includes(Number(type))) {
            return res.json({
                status: 0,
                message: "Invalid coupon type"
            });
        }
        if (Number(type) !== 3) {

            if (!percentage) {
                return res.json({
                    status: 0,
                    message: "Discount value is required"
                });
            }

        }
        if (Number(type) === 3) {

            if (!buy_item || !get_item) {
                return res.json({
                    status: 0,
                    message: "Buy and Get fields are required"
                });
            }

        }


        // const coupon_check = await Coupon.findOne({

        //     where: {
        //         code: code
        //     }

        // });

        // if (coupon_check) {

        //     return res.json({
        //         status: 0,
        //         message: "Coupon already exists"
        //     });

        // }

        if (type == 1) {
            if (
                Number(percentage) <= 0 ||
                Number(percentage) > 100
            ) {

                return res.json({
                    status: 0,
                    message: "Percentage must be between 0 and 100"
                });

            }
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

        // if (
        //     usage_limit &&
        //     Number(usage_limit) < 0
        // ) {

        //     return res.json({
        //         status: 0,
        //         message: "Usage limit must be greater than or equal to 0"
        //     });

        // }

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
            description,
            cat_id: cat_id,
            percentage: Number(type) === 3 ? 0 : percentage,

            buy_item: Number(type) === 3 ? buy_item : null,

            get_item: Number(type) === 3 ? get_item : null,

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
            description,
            cat_id,
            branch_ids,
            code,
            percentage,
            min_amount,
            usage_limit,
            start_date,
            end_date,
            mer_id,
            type,
            buy_item,
            get_item, status
        } = req.body;


        const merchant_id = mer_id;
        type = Number(type || 1);


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
            !code
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

        if (![1, 2, 3].includes(type)) {
            return res.json({
                status: 0,
                message: "Invalid coupon type"
            });
        }

        if (type !== 3 && !percentage) {
            return res.json({
                status: 0,
                message: "Discount value is required"
            });
        }

        if (type === 3 && (!buy_item || !get_item)) {
            return res.json({
                status: 0,
                message: "Buy and Get fields are required"
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


        // const coupon_check = await Coupon.findOne({

        //     where: {

        //         code: code,

        //         id: {
        //             [Op.ne]: coupon_id
        //         }

        //     }

        // });

        // if (coupon_check) {

        //     return res.json({
        //         status: 0,
        //         message: "Coupon already exists"
        //     });

        // }
        if (type == 1) {
            if (
                Number(percentage) < 0 ||
                Number(percentage) > 100
            ) {

                return res.json({
                    status: 0,
                    message: "Percentage must be between 0 and 100"
                });

            }
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


        // if (
        //     usage_limit &&
        //     Number(usage_limit) < 0
        // ) {

        //     return res.json({
        //         status: 0,
        //         message: "Usage limit must be greater than or equal to 0"
        //     });

        // }


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


        // let banner_image = exist_coupon.banner_image;

        // const bannerFile = req.files.find(
        //     file => file.fieldname === "banner_image"
        // );

        // if (bannerFile) {

        //     banner_image = bannerFile.path.replace(/\\/g, '/');

        // }



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
            description,

            code: code,
            cat_id: cat_id,
            type,
            percentage: type === 3 ? 0 : Number(percentage),

            buy_item: type === 3 ? buy_item : null,

            get_item: type === 3 ? get_item : null,



            min_amount: min_amount || 0,

            usage_limit: usage_limit || 0,

            start_date: start_date,

            end_date: end_date,
            status: status

            // banner_image: banner_image

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

exports.delete_coupon = async (req, res) => {

    try {

        const { coupon_id } = req.body;

        if (!coupon_id) {

            return res.json({
                status: 0,
                message: "Coupon ID required"
            });

        }

        const coupon = await Coupon.findOne({

            where: {
                id: coupon_id,
                del_status: 0
            }

        });

        if (!coupon) {

            return res.json({
                status: 0,
                message: "Coupon not found"
            });

        }

        // Delete banner image from uploads
        if (coupon.banner_image) {

            const imagePath = path.join(
                process.cwd(),
                coupon.banner_image
            );

            if (fs.existsSync(imagePath)) {

                fs.unlinkSync(imagePath);

            }

        }

        await coupon.update({

            del_status: 1

        });

        return res.json({

            status: 1,
            message: "Coupon deleted successfully"

        });

    }

    catch (err) {

        console.log("DELETE ERROR:", err);

        return res.json({

            status: 0,
            message: err.message

        });

    }

};

exports.delete_branch = async (req, res) => {

    try {
        const { branch_id } = req.body;
        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID is required"
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

        const images = await BranchImage.findAll({
            where: { branch_id }
        });

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

        // ✅ get menu images
        const menuImages = await MenuImage.findAll({
            where: { branch_id }
        });

        // ✅ delete menu image files
        menuImages.forEach(img => {

            if (img.image) {

                const filePath = path.join(
                    __dirname,
                    '../../',
                    img.image
                );

                if (fs.existsSync(filePath)) {

                    try {

                        fs.unlinkSync(filePath);

                    } catch (err) {

                        console.log(
                            "Menu file delete error:",
                            err.message
                        );

                    }

                }

            }

        });

        // ✅ delete menu image records
        await MenuImage.destroy({
            where: { branch_id }
        });

        // ✅ soft delete branch
        await branch.update({
            del_status: 1
        });

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


exports.delete_receptionist = async (req, res) => {

    try {

        const { receptionist_id } = req.body;

        if (!receptionist_id) {

            return res.json({
                status: 0,
                message: "Receptionist ID is required"
            });

        }

        const receptionist = await Receptionist.findOne({

            where: {
                id: receptionist_id,
                del_status: 0
            }

        });

        if (!receptionist) {

            return res.json({
                status: 0,
                message: "Receptionist not found"
            });

        }

        // Delete profile image
        if (receptionist.profile_image) {

            const profilePath = path.join(
                __dirname,
                '../../',
                receptionist.profile_image
            );

            if (fs.existsSync(profilePath)) {

                try {

                    fs.unlinkSync(profilePath);

                } catch (err) {

                    console.log(
                        "Profile delete error:",
                        err.message
                    );

                }

            }

        }

        // Soft delete receptionist
        await receptionist.update({

            del_status: 1

        });

        return res.json({

            status: 1,
            message: "Receptionist deleted successfully"

        });

    }

    catch (err) {

        console.log(
            "RECEPTIONIST DELETE ERROR:",
            err
        );

        return res.json({

            status: 0,
            message: err.message

        });

    }

};

exports.receptionist_list = async (req, res) => {

    try {

        const { merchant_id } = req.body;

        if (!merchant_id) {

            return res.json({
                status: 0,
                message: "Merchant not found"
            });

        }



        const receptionist = await Receptionist.findAll({

            where: {
                merchant_id: merchant_id,
                del_status: 0,
                status: 1
            },

            order: [['id', 'DESC']],

            attributes: [
                'id',
                'rep_id',
                'name',
                'ref_name',
                'email',
                'phone',
                'branch_id',
                [
                    Sequelize.literal(`
                        CASE
                            WHEN branch_id IS NULL THEN 0
                            ELSE 1
                        END
                    `),
                    'is_branch'
                ]
            ]

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


exports.applied_coupons = async (req, res) => {

    try {

        const { branch_id } = req.body;

        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID is required"
            });

        }

        const coupons = await CouponApplied.findAll({

            where: {
                del_status: 0
            },

            attributes: [
                'id',
                'cus_id',
                'coupon_id',
                'branch_id',
                'coupon_code',
                'percentage',
                'used_at',
                'approved_by',
                'approved_by_id',
                'cancel_by',
                'cancel_reason',
                'status'
            ], where: {
                branch_id: branch_id,
                del_status: 0
            },

            include: [

                {
                    model: Coupon,
                    attributes: [
                        // 'id',

                        // 'code'
                    ],

                    required: true
                },

                {
                    model: Customer,
                    attributes: [
                        'id',
                        'name',

                    ],
                    required: false
                }

            ],

            order: [['id', 'DESC']]

        });

        return res.json({

            status: 1,

            message: "Applied coupons fetched successfully",

            data: coupons

        });

    } catch (err) {

        console.log("ERROR:", err);

        return res.json({

            status: 0,

            message: err.message

        });

    }

};


exports.claim_coupon = async (req, res) => {

    try {


        const user = req.user;

        const {
            coupon_id,
            status,
            cancel_reason
        } = req.body;
        // console.log("REQUEST BODY:", req.body);
        if (
            !coupon_id ||
            status === undefined
        ) {

            return res.json({

                status: 0,
                message: "Coupon ID and status are required"

            });

        }

        const coupon = await CouponApplied.findOne({

            where: {

                id: coupon_id

            }

        });

        if (!coupon) {

            return res.json({

                status: 0,
                message: "Coupon Applied is not found"

            });

        }
        const couponExists = await Coupon.findOne({

            where: {
                id: coupon.coupon_id,
                del_status: 0
            }

        });

        if (!couponExists) {

            return res.json({

                status: 0,
                message: "Coupon not found"

            });

        }

        const updateData = {

            status: status

        };

        if (Number(status) === 1) {

            updateData.approved_by = "Admin";

            updateData.approved_by_id = user.id;
            updateData.used_at = new Date();

            updateData.cancel_by = null;

            updateData.cancel_reason = null;

        }

        if (Number(status) === 2) {

            updateData.cancel_by = "Admin";

            updateData.cancel_reason = cancel_reason || null;
            updateData.approved_by = null;
            updateData.approved_by_id = null;
            updateData.used_at = null;

        }

        await CouponApplied.update(
            updateData,
            {
                where: {
                    id: coupon_id
                }
            }
        );

        const updatedCoupon = await CouponApplied.findOne({

            where: {

                id: coupon_id

            }

        });

        return res.json({

            status: 1,

            message: "Coupon Updated successfully",



        });

    }

    catch (err) {

        console.log(
            "COUPON UPDATE ERROR:",
            err
        );

        return res.json({

            status: 0,

            message: err.message

        });

    }

};

exports.delete_claim_coupon = async (req, res) => {
    try {

        const { coupon_id } = req.body;

        if (!coupon_id) {
            return res.json({
                status: 0,
                message: "Coupon ID is required"
            });
        }

        const coupon = await CouponApplied.findOne({
            where: {
                id: coupon_id,
                del_status: 0
            }
        });

        if (!coupon) {
            return res.json({
                status: 0,
                message: "Coupon claim not found"
            });
        }

        await CouponApplied.update(
            {
                del_status: 1
            },
            {
                where: {
                    id: coupon_id
                }
            }
        );

        return res.json({
            status: 1,
            message: "Coupon claim deleted successfully"
        });

    } catch (err) {

        console.log("COUPON DELETE ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }
};



exports.update_appointment = async (req, res) => {

    try {

        const user = req.user;

        const {
            appointment_id,
            status,
            cancel_reason
        } = req.body;

        if (!appointment_id || status === undefined) {

            return res.json({
                status: 0,
                message: "Appointment ID and status are required"
            });

        }

        const appointment = await Appointment.findOne({
            where: {
                id: appointment_id
            }
        });

        if (!appointment) {

            return res.json({
                status: 0,
                message: "Appointment not found"
            });

        }

        const updateData = {
            status: Number(status)
        };

        // Approved
        if (Number(status) === 1) {

            updateData.approved_by = 'Admin';
            updateData.approved_by_id = user.id;

            updateData.cancel_by = null;
            updateData.cancel_reason = null;

        }

        // Rejected / Cancelled
        if (Number(status) === 2) {

            updateData.cancel_by = 'Admin';
            updateData.cancel_reason = cancel_reason || null;

            updateData.approved_by = null;
            updateData.approved_by_id = null;

        }

        await appointment.update(updateData);

        const updatedAppointment = await Appointment.findOne({
            where: {
                id: appointment_id
            }
        });

        return res.json({

            status: 1,
            message: "Appointment status updated successfully",
            data: updatedAppointment

        });

    } catch (err) {

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


exports.branch_id = async (req, res) => {

    try {

        const branch_id = req.params.id;

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
            },



            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'country_code',
                'profile_image',
                'lat',
                'lon',
                'address',
                'merchant_id',
                'visibility',
                'age_group'

            ]

        });

        if (!branch) {

            return res.json({
                status: 0,
                message: "Branch not found"
            });

        }

        const baseUrl = process.env.APP_URL;

        const data = branch.toJSON();

        // ✅ profile image url
        data.profile_image = data.profile_image
            ? baseUrl + '/' + data.profile_image.replace(/\\/g, '/')
            : null;



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


exports.generate_coupon = async (req, res) => {
    try {
        const { id } = req.body;

        const merchant = await Merchant.findOne({
            where: {
                id,
                del_status: 0
            },
            attributes: ["name", "bus_name"]
        });

        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        const merchantName = (merchant.bus_name || merchant.name || "MERCHANT").trim();

        const shortName = merchantName
            .split(/\s+/)
            .map(word => word.charAt(0))
            .join("")
            .toUpperCase();

        let couponCode;
        let couponCheck;

        do {
            couponCode = `${shortName}${Math.floor(1000 + Math.random() * 9000)}`;

            couponCheck = await Coupon.findOne({
                where: {
                    code: couponCode,
                    del_status: 0
                }
            });
        } while (couponCheck);

        return res.json({
            status: 1,
            message: "Coupon Generated Successfully",
            data: {
                code: couponCode
            }
        });

    } catch (err) {
        console.error("COUPON GENERATE ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });
    }
};
exports.generate_rep_id = async (req, res) => {
    try {

        const { id } = req.body;

        const merchant = await Merchant.findOne({
            where: {
                id,
                del_status: 0
            },
            attributes: ["name", "bus_name"]
        });


        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        const merchantName = merchant.bus_name || merchant.name || "MERCHANT";

        // Create initials from merchant name
        const shortName = merchantName
            .trim()
            .split(/\s+/)
            .map(word => word.charAt(0))
            .join("")
            .toUpperCase();

        let repId = "";
        let exists;

        do {
            repId = `REP-${shortName}${Math.floor(1000 + Math.random() * 9000)}`;

            exists = await Receptionist.findOne({
                where: {
                    rep_id: repId
                }
            });

        } while (exists);

        return res.json({
            status: 1,
            message: "Reception ID generated successfully",
            data: {
                rep_id: repId
            }
        });

    } catch (err) {

        console.error("RECEPTION ID GENERATE ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }
};


exports.branch_report = async (req, res) => {
    try {

        const branch_id = parseInt(req.params.id);
        const from_date = req.query.from_date || req.query.fromdate;
        const to_date = req.query.to_date || req.query.end_date;

        if (!branch_id) {
            return res.json({
                status: 0,
                message: "Branch ID required"
            });
        }

        const baseUrl = process.env.APP_URL;

        const dateFilter = {};

        if (from_date && to_date) {
            dateFilter.created_at = {
                [Op.between]: [
                    new Date(`${from_date} 00:00:00`),
                    new Date(`${to_date} 23:59:59`)
                ]
            };
        } else if (from_date) {
            dateFilter.created_at = {
                [Op.gte]: new Date(`${from_date} 00:00:00`)
            };
        } else if (to_date) {
            dateFilter.created_at = {
                [Op.lte]: new Date(`${to_date} 23:59:59`)
            };
        }

        // ===========================
        // Coupon List
        // ===========================
        const coupons = await Coupon.findAll({
            where: {
                del_status: 0,
                status: 1,
                [Op.and]: Sequelize.literal(`${branch_id} = ANY("branch_ids")`),
                ...dateFilter
            },
            attributes: [
                "id",
                "merchant_id",
                "code",
                "percentage",
                "min_amount",
                "usage_limit",
                "start_date",
                "end_date",
                "banner_image",
                "created_at"
            ],
            order: [["id", "DESC"]]
        });

        const couponData = coupons.map(item => {

            const coupon = item.toJSON();

            if (coupon.banner_image) {
                coupon.banner_image =
                    `${baseUrl}/${coupon.banner_image.replace(/\\/g, "/")}`;
            }

            coupon.is_expired =
                coupon.end_date &&
                    new Date() > new Date(coupon.end_date)
                    ? 1
                    : 0;

            return coupon;
        });

        const couponIds = coupons.map(c => c.id);

        // ===========================
        // Appointment List
        // ===========================
        const appointments = await Appointment.findAll({
            where: {
                br_id: branch_id,
                ...dateFilter
            },
            include: [
                {
                    model: Customer,
                    attributes: ["id", "name"],
                }
            ],
            attributes: [
                "id",
                "cus_id",
                "br_id",
                "br_name",
                "appointment_date",
                "slot",
                "status",
                "cancel_by",
                "cancel_reason",
                "approved_by",
                "approved_by_id",
                "created_at"
            ],
            order: [["appointment_date", "DESC"]]
        });

        // ===========================
        // Applied Coupons
        // ===========================
        const appliedCoupons = await CouponApplied.findAll({
            where: {
                coupon_id: {
                    [Op.in]: couponIds
                },
                ...dateFilter
            },
            include: [
                {
                    model: Customer,
                    attributes: ["id", "name"],
                }
            ],
            order: [["id", "DESC"]]
        });



        // ===========================
        // Summary Counts
        // ===========================
        const [
            pendingAppointment,
            approvedAppointment,
            rejectedAppointment
        ] = await Promise.all([

            Appointment.count({
                where: {
                    br_id: branch_id,
                    status: 0,
                    ...dateFilter
                }
            }),

            Appointment.count({
                where: {
                    br_id: branch_id,
                    status: 1,
                    ...dateFilter
                }
            }),

            Appointment.count({
                where: {
                    br_id: branch_id,
                    status: 2,
                    ...dateFilter
                }
            })
        ]);

        const report = {

            pending_appointment: pendingAppointment,

            approved_appointment: approvedAppointment,

            rejected_appointment: rejectedAppointment,

            total_coupon: couponData.length,

            active_coupon: couponData.filter(c => c.is_expired === 0).length,

            expired_coupon: couponData.filter(c => c.is_expired === 1).length,

            applied_coupon: appliedCoupons.length,


        };

        // ===========================
        // Graph Data Queries
        // ===========================
        const couponAppliedGraph = await CouponApplied.findAll({
            where: {
                coupon_id: { [Op.in]: couponIds },
                ...dateFilter
            },
            attributes: [
                [sequelize.fn("DATE", sequelize.col("CouponApplied.created_at")), "date"],
                [sequelize.fn("COUNT", sequelize.col("CouponApplied.id")), "count"],
            ],
            group: [sequelize.fn("DATE", sequelize.col("CouponApplied.created_at"))],
            order: [[sequelize.fn("DATE", sequelize.col("CouponApplied.created_at")), "ASC"]],
            raw: true,
        });

        const appointmentGraph = await Appointment.findAll({
            where: {
                br_id: branch_id,
                ...dateFilter
            },
            attributes: [
                [sequelize.fn("DATE", sequelize.col("Appointment.created_at")), "date"],
                [sequelize.fn("COUNT", sequelize.col("Appointment.id")), "count"],
            ],
            group: [sequelize.fn("DATE", sequelize.col("Appointment.created_at"))],
            order: [[sequelize.fn("DATE", sequelize.col("Appointment.created_at")), "ASC"]],
            raw: true,
        });

        const getDatesInRange = (start, end, graphData) => {
            if (!start && !end) {
                const uniqueDates = new Set();
                graphData.forEach(g => {
                    if (g.date) uniqueDates.add(g.date);
                });
                const sorted = Array.from(uniqueDates).sort();
                if (sorted.length > 1) return sorted;

                // Default last 7 days
                const dates = [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const yr = d.getFullYear();
                    const mo = String(d.getMonth() + 1).padStart(2, '0');
                    const dy = String(d.getDate()).padStart(2, '0');
                    dates.push(`${yr}-${mo}-${dy}`);
                }
                return dates;
            }

            const dates = [];
            const current = new Date(start);
            const stop = new Date(end);
            while (current <= stop) {
                const yr = current.getFullYear();
                const mo = String(current.getMonth() + 1).padStart(2, '0');
                const dy = String(current.getDate()).padStart(2, '0');
                dates.push(`${yr}-${mo}-${dy}`);
                current.setDate(current.getDate() + 1);
            }
            return dates;
        };

        const allDates = getDatesInRange(from_date, to_date, [...couponAppliedGraph, ...appointmentGraph]);

        const coupMap = Object.fromEntries(couponAppliedGraph.map(r => [r.date, parseInt(r.count)]));
        const apptMap = Object.fromEntries(appointmentGraph.map(r => [r.date, parseInt(r.count)]));

        const graphs = {
            coupon_applied_per_day: allDates.map(date => ({
                date,
                count: coupMap[date] || 0
            })),
            appointments_per_day: allDates.map(date => ({
                date,
                count: apptMap[date] || 0
            }))
        };

        return res.json({
            status: 1,
            report,
            graphs,
            lists: {
                appointments,
                coupons: couponData,
                applied_coupons: appliedCoupons,

            }
        });

    } catch (err) {

        console.log("BRANCH REPORT ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });
    }



};
exports.fetch_branch_pending_img = async (req, res) => {
    try {

        const branch_id = parseInt(req.params.id);

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
            },
            attributes: [
                'id',
                'merchant_id',
                'name',
                'profile_image',
                'pending_profile_image',
                'profile_image_status',
                'rejected_reason'
            ],
            include: [
                {
                    model: BranchImage,
                    attributes: [
                        'id',
                        'image',
                        'pending_image',
                        'image_status',
                        'rejected_reason'
                    ],
                    where: {
                        image_status: {
                            [Op.in]: [0, 2]
                        }
                    },
                    required: false
                },
                {
                    model: MenuImage,
                    attributes: [
                        'id',
                        'image',
                        'pending_image',
                        'image_status',
                        'rejected_reason'
                    ],
                    where: {
                        image_status: {
                            [Op.in]: [0, 2]
                        }
                    },
                    required: false
                }
            ]
        });

        if (!branch) {
            return res.json({
                status: 0,
                message: "Branch not found"
            });
        }

        const baseUrl = process.env.APP_URL;

        const data = branch.toJSON();

        // Branch Profile Images
        data.profile_image = data.profile_image
            ? `${baseUrl}/${data.profile_image.replace(/\\/g, '/')}`
            : null;

        data.pending_profile_image = data.pending_profile_image
            ? `${baseUrl}/${data.pending_profile_image.replace(/\\/g, '/')}`
            : null;

        // Branch Images
        data.BranchImages = (data.BranchImages || []).map(item => ({
            ...item,
            image: item.image
                ? `${baseUrl}/${item.image.replace(/\\/g, '/')}`
                : null,
            pending_image: item.pending_image
                ? `${baseUrl}/${item.pending_image.replace(/\\/g, '/')}`
                : null
        }));

        // Menu Images
        data.MenuImages = (data.MenuImages || []).map(item => ({
            ...item,
            image: item.image
                ? `${baseUrl}/${item.image.replace(/\\/g, '/')}`
                : null,
            pending_image: item.pending_image
                ? `${baseUrl}/${item.pending_image.replace(/\\/g, '/')}`
                : null
        }));

        return res.json({
            status: 1,
            data
        });

    } catch (err) {
        console.log("FETCH BRANCH PENDING IMAGE ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });
    }
};

exports.verify_branch_pending_img = async (req, res) => {
    try {
        const { branch_id, type, image_id, status, rejected_reason } = req.body;

        if (!branch_id || !type || status === undefined) {
            return res.json({
                status: 0,
                message: "branch_id, type, and status are required"
            });
        }

        if (Number(status) === 2 && !rejected_reason) {
            return res.json({
                status: 0,
                message: "rejected_reason is required when rejecting"
            });
        }

        const branch = await Branch.findOne({
            where: {
                id: branch_id,
                del_status: 0
            }
        });
        if (!branch) {
            return res.status(401).json({
                status: 0,
                message: "Branch is not available"
            })
        }
        const bId = parseInt(branch_id);

        if (type === 'profile') {
            const branch = await Branch.findOne({
                where: { id: bId, del_status: 0 }
            });

            if (!branch) {
                return res.json({ status: 0, message: "Branch not found" });
            }

            if (Number(status) === 1) {
                // Approve
                const oldProfile = branch.profile_image;
                const newProfile = branch.pending_profile_image;

                if (!newProfile) {
                    return res.json({ status: 0, message: "No pending profile image to approve" });
                }

                await branch.update({
                    profile_image: newProfile,
                    pending_profile_image: null,
                    profile_image_status: 1,
                    rejected_reason: null
                });

                // Delete old profile image file if exists
                if (oldProfile && oldProfile !== newProfile) {
                    const filePath = path.join(__dirname, '../../', oldProfile);
                    if (fs.existsSync(filePath)) {
                        try {
                            fs.unlinkSync(filePath);
                        } catch (err) {
                            console.log("Delete old profile error:", err.message);
                        }
                    }
                }

                return res.json({ status: 1, message: "Branch profile image approved successfully" });
            } else if (Number(status) === 2) {
                // Reject
                await branch.update({
                    profile_image_status: 2,
                    rejected_reason: rejected_reason
                });

                return res.json({ status: 1, message: "Branch profile image rejected successfully" });
            }
        } else if (type === 'branch_image') {
            if (!image_id) {
                return res.json({ status: 0, message: "image_id is required" });
            }

            const imgId = parseInt(image_id);
            const branchImage = await BranchImage.findOne({
                where: { id: imgId, branch_id: bId }
            });

            if (!branchImage) {
                return res.json({ status: 0, message: "Branch image record not found" });
            }

            if (Number(status) === 1) {
                // Approve
                const oldImg = branchImage.image;
                const newImg = branchImage.pending_image;

                if (!newImg) {
                    return res.json({ status: 0, message: "No pending image to approve" });
                }

                await branchImage.update({
                    image: newImg,
                    pending_image: null,
                    image_status: 1,
                    rejected_reason: null
                });

                // Delete old image file if exists
                if (oldImg && oldImg !== newImg) {
                    const filePath = path.join(__dirname, '../../', oldImg);
                    if (fs.existsSync(filePath)) {
                        try {
                            fs.unlinkSync(filePath);
                        } catch (err) {
                            console.log("Delete old branch image error:", err.message);
                        }
                    }
                }

                return res.json({ status: 1, message: "Branch image approved successfully" });
            } else if (Number(status) === 2) {
                // Reject
                await branchImage.update({
                    image_status: 2,
                    rejected_reason: rejected_reason
                });

                return res.json({ status: 1, message: "Branch image rejected successfully" });
            }
        } else if (type === 'menu_image') {
            if (!image_id) {
                return res.json({ status: 0, message: "image_id is required" });
            }

            const imgId = parseInt(image_id);
            const menuImage = await MenuImage.findOne({
                where: { id: imgId, branch_id: bId }
            });

            if (!menuImage) {
                return res.json({ status: 0, message: "Menu image record not found" });
            }

            if (Number(status) === 1) {
                // Approve
                const oldImg = menuImage.image;
                const newImg = menuImage.pending_image;

                if (!newImg) {
                    return res.json({ status: 0, message: "No pending menu image to approve" });
                }

                await menuImage.update({
                    image: newImg,
                    pending_image: null,
                    image_status: 1,
                    rejected_reason: null
                });

                // Delete old image file if exists
                if (oldImg && oldImg !== newImg) {
                    const filePath = path.join(__dirname, '../../', oldImg);
                    if (fs.existsSync(filePath)) {
                        try {
                            fs.unlinkSync(filePath);
                        } catch (err) {
                            console.log("Delete old menu image error:", err.message);
                        }
                    }
                }

                return res.json({ status: 1, message: "Menu image approved successfully" });
            } else if (Number(status) === 2) {
                // Reject
                await menuImage.update({
                    image_status: 2,
                    rejected_reason: rejected_reason
                });

                return res.json({ status: 1, message: "Menu image rejected successfully" });
            }
        } else {
            return res.json({ status: 0, message: "Invalid verification type" });
        }


        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: branch.merchant_id,
                user_type: "merchant"
            }
        });

        try {
            await sendPushNotification({
                token: notificationToken?.token,
                title: Number(status) === 1 ? "Profile Image Approved" : "Profile Image Rejected",
                body: Number(status) === 1
                    ? "Your branch profile image has been approved successfully."
                    : `Your branch profile image has been rejected.${rejected_reason ? ` Reason: ${rejected_reason}` : ""}`,
                data: {
                    type: "branch_list",
                }
            });
        } catch (error) {
            console.error("Push Notification Error:", error);
        }
    } catch (err) {
        console.log("VERIFY BRANCH PENDING IMAGE ERROR:", err);
        return res.json({ status: 0, message: err.message });
    }
};

exports.notification_list = async (req, res) => {
    try {

        // console.time("notification_list");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const [
            newMerchant,
            newCustomer,
            newBranch,
            todayAppointment,
            todayCouponRedeem,
            pendingMenuImage,
            pendingBranchImage,
            pendingProfileImage
        ] = await Promise.all([

            Merchant.count({
                raw: true,
                where: {
                    createdAt: {
                        [Op.gte]: today,
                        [Op.lt]: tomorrow
                    },
                    del_status: 0
                }
            }),

            Customer.count({
                raw: true,
                where: {
                    createdAt: {
                        [Op.gte]: today,
                        [Op.lt]: tomorrow
                    },
                    del_status: 0
                }
            }),

            Branch.count({
                raw: true,
                where: {
                    created_at: {
                        [Op.gte]: today,
                        [Op.lt]: tomorrow
                    },
                    del_status: 0
                }
            }),

            Appointment.count({
                raw: true,
                where: {
                    created_at: {
                        [Op.gte]: today,
                        [Op.lt]: tomorrow
                    }
                }
            }),

            CouponApplied.count({
                raw: true,
                where: {
                    created_at: {
                        [Op.gte]: today,
                        [Op.lt]: tomorrow
                    }
                }
            }),

            MenuImage.count({
                raw: true,
                where: {
                    image_status: 0
                }
            }),

            BranchImage.count({
                raw: true,
                where: {
                    image_status: 0
                }
            }),

            Branch.count({
                raw: true,
                where: {
                    profile_image_status: 0,
                    del_status: 0
                }
            })

        ]);


        return res.status(200).json({
            status: 1,
            message: "Notification list fetched successfully",
            data: [
                {
                    type: 1,
                    title: "New Merchant",
                    count: newMerchant
                },
                {
                    type: 2,
                    title: "New Customer",
                    count: newCustomer
                },
                {
                    type: 3,
                    title: "New Branch",
                    count: newBranch
                },
                {
                    type: 4,
                    title: "Today's Appointments",
                    count: todayAppointment
                },
                {
                    type: 5,
                    title: "Today's Coupon Redeem",
                    count: todayCouponRedeem
                },
                {
                    type: 6,
                    title: "Pending Menu Images",
                    count: pendingMenuImage
                },
                {
                    type: 7,
                    title: "Pending Branch Images",
                    count: pendingBranchImage
                },
                {
                    type: 8,
                    title: "Pending Branch Profile Images",
                    count: pendingProfileImage
                }
            ]
        });

    } catch (err) {
        console.error("notification_list:", err);

        return res.status(500).json({
            status: 0,
            message: "Network Issue",
            error: err.message
        });
    }
};