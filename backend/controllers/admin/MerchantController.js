const { Merchant, Coupon, RefreshToken, Branch, Receptionist, MerchantFp } = require('../../models');
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
const { Op } = require('sequelize');
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