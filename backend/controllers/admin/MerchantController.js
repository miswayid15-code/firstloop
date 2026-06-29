const { Merchant, Coupon, RefreshToken, Branch, BranchTiming, Receptionist, MerchantFp, Category, BranchImage, MenuImage, Appointment, CouponApplied, Customer } = require('../../models');
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

const normalizeMerchantStatus = (status, fallback = 1) => {
    if (status === undefined || status === null || status === '') {
        return fallback;
    }

    return Number(status) === 0 ? 0 : 1;
};

exports.createOrUpdateMerchant = async (req, res) => {

    try {




        let merchant = null;

        const mer_id = req.body.mer_id;

        if (mer_id) {
            // console.log("HI");
            // console.log("Body",res.body);

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

                status: merchantStatus

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

            status: merchantStatus

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

            country_code,
            receptionist_id,
            mer_id,
            city,
            state,
            country,
            zip_code,
            timings,
            visibility,
            age_group
        } = req.body;

        console.log("BODY:", req.body);
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
            country_code: callingCode,
            phone: nationalNumber,
            profile_image,
            lat,
            lon,
            address,
            description,

            merchant_id: mer_id,
            status: 1,
            del_status: 0,
            city,
            state,
            country,
            zip_code,
            visibility: visibility !== undefined ? visibility : 0,
            age_group: age_group || 'All Age'

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
    console.log("Update branch BODY:", req.body);
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
            country_code,
            city,
            state,
            country,
            zip_code,
            receptionist_id,
            timings,
            visibility,
            age_group
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

            email: email || branch.email,

            country_code: callingCode,

            phone: nationalNumber,

            profile_image,

            lat: lat || branch.lat,

            lon: lon || branch.lon,

            address: address || branch.address,

            description: description || branch.description,
            city: city || branch.city,

            state: state || branch.state,

            country: country || branch.country,

            zip_code: zip_code || branch.zip_code,
            visibility: visibility !== undefined ? visibility : branch.visibility,
            age_group: age_group || branch.age_group
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
                    'country_code',
                    'profile_image',
                    'lat',
                    'lon',
                    'city',
                    'zip_code',
                    'country',
                    'state',
                    'address',
                    'merchant_id',
                    'description',
                    'visibility',
                    'age_group'
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

        const redeemedCouponCount = await CouponApplied.count({
            where: {
                coupon_id: {
                    [Op.in]: couponIds
                },
                status: 1
            }
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
            get_item
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
                'name',
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


