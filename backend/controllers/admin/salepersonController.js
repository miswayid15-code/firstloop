
const {
    Merchant,
    Coupon,
    RefreshToken,
    Branch,
    Receptionist,
    CustomerFp,
    Customer,
    SalePerson,
} = require('../../models');
const bcrypt = require('bcryptjs');
const { parsePhoneNumber } = require('libphonenumber-js');
const jwt = require('jsonwebtoken');
const baseUrl = process.env.APP_URL;
const sendMail = require('../../helpers/sendMail');
const RegisterTemplate = require('../../helpers/RegisterTemplate');
const ResetsTemplate = require('../../helpers/ResetsTemplate');
const { otpTemplate } = require('../../helpers/mailTemplate');
const { Op } = require('sequelize');
const axios = require("axios");
const moment = require('moment');


const { formatIST } = require('../../helpers/dateHelper.js');
exports.list = async (req, res) => {
    try {
        const salePersons = await SalePerson.findAll({
            where: { del_status: 0 },
            attributes: [
                'id',
                'name',
                'phone',
                'country_code',
                'email',
                'code',
                'address',
                'city',
                'state',
                'country',
                'gender',
                'dob',
                'lat',
                'lon',
                'status',
                'del_status',
                'createdAt'
            ],
            order: [['id', 'DESC']]
        });

        if (salePersons.length === 0) {
            return res.json({
                status: 0,
                message: "No sales persons found"
            });
        }

        return res.json({
            status: 1,
            message: "Sales Person List",
            data: salePersons
        });

    } catch (err) {
        console.error("ERROR:", err);
        return res.json({
            status: 0,
            message: "Something went wrong"
        });
    }
};
exports.register = async (req, res) => {
    try {

        const {
            name,
            email,
            phone,
            country_code,
            code,
            dob,
            gender,
            address,
            lat,
            lon,
            city,
            state,
            country,
            password
        } = req.body;
        // console.log("REQ BODY:", req.body);
        // =========================
        // PHONE VALIDATION
        // =========================

        let nationalNumber = null;
        let callingCode = country_code || null;

        if (phone && phone.trim() !== '') {
            try {

                const cleanPhone = phone.replace(/\s+/g, '');

                const fullPhone = cleanPhone.startsWith('+')
                    ? cleanPhone
                    : (country_code || '') + cleanPhone;

                const num = parsePhoneNumber(fullPhone);

                if (!num.isValid()) {
                    return res.json({
                        status: 0,
                        message: "Invalid phone"
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

        // =========================
        // PHONE EXISTS CHECK
        // =========================

        const phoneExists = await SalePerson.findOne({
            where: {
                country_code: callingCode,
                phone: nationalNumber,
                del_status: 0
            }
        });

        if (phoneExists) {
            return res.json({
                status: 0,
                message: "Phone already exists"
            });
        }

        // =========================
        // EMAIL EXISTS CHECK
        // =========================

        if (email) {
            const emailExists = await SalePerson.findOne({
                where: {
                    email: email.trim().toLowerCase(),
                    del_status: 0
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
        // CODE EXISTS CHECK
        // =========================

        const codeExists = await SalePerson.findOne({
            where: {
                code,
                del_status: 0
            }
        });

        if (codeExists) {
            return res.json({
                status: 0,
                message: "Code already exists"
            });
        }

        // =========================
        // CREATE SALES PERSON
        // =========================

        const salePerson = await SalePerson.create({

            name,

            email: email
                ? email.trim().toLowerCase()
                : null,

            phone: nationalNumber,

            country_code: callingCode,

            code,

            dob: dob || null,

            gender: gender || null,

            address: address || null,

            city: city || null,

            state: state || null,

            country: country || null,

            lat: lat || null,

            lon: lon || null,

            status: 1,
            password: bcrypt.hashSync(password, 10),

            del_status: 0

        });

        return res.json({
            status: 1,
            message: "Sales Person Registered Successfully",
            data: salePerson
        });

    } catch (err) {

        console.log("ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: err.message
        });

    }
};


exports.update = async (req, res) => {
    try {

        const {
            id,
            name,
            email,
            phone,
            country_code,
            code,
            dob,
            gender,
            address,
            lat,
            lon,
            city,
            state,
            country,
            password
        } = req.body;

        if (!id) {
            return res.json({
                status: 0,
                message: "Sales Person ID is required"
            });
        }

        const salePerson = await SalePerson.findOne({
            where: {
                id,
                del_status: 0
            }
        });

        if (!salePerson) {
            return res.json({
                status: 0,
                message: "Sales Person not found"
            });
        }

        // =========================
        // PHONE VALIDATION
        // =========================

        let nationalNumber = salePerson.phone;
        let callingCode = salePerson.country_code;

        if (phone) {
            try {

                const cleanPhone = phone.replace(/\s+/g, '');

                const rawCountryCode = country_code || salePerson.country_code || '';
                const normalizedCountryCode = rawCountryCode.startsWith('+')
                    ? rawCountryCode
                    : `+${rawCountryCode}`;

                const fullPhone = cleanPhone.startsWith('+')
                    ? cleanPhone
                    : `${normalizedCountryCode}${cleanPhone}`;

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

            const phoneExists = await SalePerson.findOne({
                where: {
                    country_code: callingCode,
                    phone: nationalNumber,
                    id: {
                        [Op.ne]: id
                    },
                    del_status: 0
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

            const emailExists = await SalePerson.findOne({
                where: {
                    email: email.trim().toLowerCase(),
                    id: {
                        [Op.ne]: id
                    },
                    del_status: 0
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
        // CODE EXISTS CHECK
        // =========================

        if (code) {

            const codeExists = await SalePerson.findOne({
                where: {
                    code,
                    id: {
                        [Op.ne]: id
                    },
                    del_status: 0
                }
            });

            if (codeExists) {
                return res.json({
                    status: 0,
                    message: "Code already exists"
                });
            }
        }

        // =========================
        // UPDATE SALES PERSON
        // =========================

        const updateData = {

            name: name ?? salePerson.name,

            email: email
                ? email.trim().toLowerCase()
                : salePerson.email,

            phone: nationalNumber,

            country_code: callingCode,

            code: code ?? salePerson.code,

            dob: dob ?? salePerson.dob,

            gender: gender ?? salePerson.gender,

            address: address ?? salePerson.address,

            city: city ?? salePerson.city,

            state: state ?? salePerson.state,

            country: country ?? salePerson.country,

            lat: lat ?? salePerson.lat,

            lon: lon ?? salePerson.lon

        };

        // Update password only if a new password is provided
        if (password && password.trim() !== '') {
            updateData.password = bcrypt.hashSync(password, 10);
        }

        await salePerson.update(updateData);

        await salePerson.update(updateData);
        const updatedSalePerson = await SalePerson.findByPk(id);

        return res.json({
            status: 1,
            message: "Sales Person updated successfully",
            data: updatedSalePerson
        });

    } catch (err) {

        console.log("ERROR:", err);

        return res.status(500).json({
            status: 0,
            message: err.message
        });

    }
};

exports.fetch_list = async (req, res) => {
    try {

        const { id } = req.body;

        const salePersons = await SalePerson.findAll({

            where: {
                id,
                del_status: 0
            },

            attributes: [
                'id',
                'name',
                'phone',
                'country_code',
                'email',
                'code',
                'dob',
                'gender',
                'address',
                'city',
                'state',
                'country',
                'lat',
                'lon',
                'status',
                'createdAt'
            ],

            order: [['id', 'DESC']]

        });

        if (!salePersons || salePersons.length === 0) {
            return res.json({
                status: 0,
                message: "Sales Person not found"
            });
        }

        return res.json({
            status: 1,
            data: salePersons
        });

    } catch (err) {

        console.log("FETCH ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }
};

exports.update_status = async (req, res) => {
    try {

        const { id, status } = req.body;

        const salePerson = await SalePerson.findOne({
            where: {
                id,
                del_status: 0
            }
        });

        if (!salePerson) {
            return res.json({
                status: 0,
                message: "Sales Person not found"
            });
        }

        await SalePerson.update(
            {
                status
            },
            {
                where: {
                    id
                }
            }
        );

        return res.json({
            status: 1,
            message: "Sales Person status updated successfully"
        });

    } catch (err) {

        console.log(err);

        return res.json({
            status: 0,
            message: "Issue with status update"
        });

    }
};
exports.generateSalePersonCode = async (req, res) => {
    try {
        let code;
        let exists = true;

        while (exists) {
            code = "SP" + Math.floor(100000 + Math.random() * 900000);

            exists = await SalePerson.findOne({
                where: {
                    code,
                    del_status: 0
                }
            });
        }

        return res.json({
            status: 1,
            message: "Code generated successfully",
            code
        });
    } catch (err) {
        console.error("ERROR generating code:", err);
        return res.json({
            status: 0,
            message: "Something went wrong"
        });
    }
};
exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const salePerson = await SalePerson.findOne({
            where: { email }
        });

        if (!salePerson) {

            return res.json({
                status: 0,
                message: "Account not found"
            });

        }

        if (salePerson.del_status == 1) {

            return res.json({
                status: 0,
                message: "Account deleted"
            });

        }

        if (salePerson.status != 1) {

            return res.json({
                status: 0,
                message: "Account inactive"
            });

        }

        const match = await bcrypt.compare(
            password,
            salePerson.password
        );

        if (!match) {

            return res.json({
                status: 0,
                message: "Invalid password"
            });

        }

        const refreshToken = jwt.sign(
            {
                id: salePerson.id,
                user_type: 'salesperson',
                token_type: 'refresh'
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: '30d'
            }
        );

        await RefreshToken.create({

            user_id: salePerson.id,
            user_type: 'salesperson',
            token: refreshToken,
            expires_at: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            )

        });

        const accessToken = jwt.sign(
            {
                id: salePerson.id,
                email: salePerson.email,
                user_type: 'salesperson',
                token_type: 'access'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '10d'
            }
        );

        data = {
            id: salePerson.id,
            name: salePerson.name,
            code: salePerson.code,
            role: 'salesperson',
            createdAt: salePerson.createdAt,
        }

        return res.json({

            status: 1,
            message: "Login successful",
            data: data,
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

exports.logout = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                status: 0,
                message: "Unauthorized"
            });
        }
        await RefreshToken.destroy({
            where: {
                user_id: req.user.id,
                user_type: 'salesperson'
            }
        });
        return res.status(200).json({
            status: 1,
            message: "Logged out successfully"
        });
    } catch (err) {
        console.error("Logout Error:", err);
        return res.status(500).json({
            status: 0,
            message: "Internal server error"
        });
    }
};

exports.merchant_list = async (req, res) => {

    try {

        const salePersons = await SalePerson.findByPk(req.user.id);

        if (!salePersons) {

            return res.json({
                status: 0,
                message: "Salesperson not found"
            });

        }
        // const [dbInfo] = await Merchant.sequelize.query(`
        //     SELECT
        //         current_database() AS database,
        //         current_setting('TimeZone') AS timezone,
        //         NOW() AS now
        // `);

        // console.log("DB INFO:", dbInfo);
        const merchants = await Merchant.findAll({

            where: {
                // del_status: 0,
                code: salePersons.code
            },

            attributes: [

                'id',
                'name',
                'bus_name',
                'email',
                'phone',
                'country_code',
                'status',
                'createdAt'
            ],

            include: [

                {
                    model: Branch,

                    where: {
                        del_status: 0,

                    },

                    attributes: ['id'],

                    required: false
                }

            ],

            order: [

                ['id', 'DESC']

            ]

        });

        const data = merchants.map(item => {

            const merchant = item.toJSON();

            merchant.branch_count = merchant.Branches
                ? merchant.Branches.length
                : 0;

            delete merchant.Branches;
            // const moment = require('moment-timezone');

            merchant.createdAt = formatIST(merchant.createdAt);


            return merchant;


        });

        return res.json({

            status: 1,

            message: "Merchant List",

            data

        });

    } catch (err) {

        console.log("MERCHANT LIST ERROR:", err);

        return res.json({

            status: 0,

            message: "Error",

            error: err.message

        });

    }

};

exports.referred_merchants = async (req, res) => {
    try {
        const { id } = req.body;
        const salePerson = await SalePerson.findByPk(id);
        if (!salePerson) {
            return res.json({
                status: 0,
                message: "Salesperson not found"
            });
        }

        const merchants = await Merchant.findAll({
            where: {
                code: salePerson.code
            },
            attributes: [
                'id',
                'name',
                'bus_name',
                'email',
                'phone',
                'country_code',
                'status',
                'createdAt'
            ],
            include: [
                {
                    model: Branch,
                    where: {
                        del_status: 0,
                    },
                    attributes: ['id'],
                    required: false
                }
            ],
            order: [
                ['id', 'DESC']
            ]
        });

        const data = merchants.map(item => {
            const merchant = item.toJSON();
            merchant.branch_count = merchant.Branches
                ? merchant.Branches.length
                : 0;
            delete merchant.Branches;
            merchant.createdAt = formatIST(merchant.createdAt);
            return merchant;
        });

        return res.json({
            status: 1,
            message: "Referred Merchant List",
            data
        });
    } catch (err) {
        console.log("REFERRED MERCHANT LIST ERROR:", err);
        return res.json({
            status: 0,
            message: "Error",
            error: err.message
        });
    }
};