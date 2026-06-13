// controllers\api\Receptionist.js
const { Receptionist, RefreshToken, Branch, Merchant, Appointment, Coupon, CouponApplied } = require('../../models');
const bcrypt = require('bcryptjs');
const { parsePhoneNumber } = require('libphonenumber-js');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const moment = require('moment');
const baseUrl = process.env.APP_URL;
exports.register = async (req, res) => {

    try {

        const { name, email, phone, password, branch_id, country_code } = req.body;

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

            console.log("PHONE ERROR:", err);

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

// fetch receptionist details by ID for edit page
exports.fetch_receptionist_by_id = async (req, res) => {

    try {

        const merchant_id = req.user.id;
        const receptionist_id = req.params.id || req.query.id;

        if (!merchant_id) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        if (!receptionist_id) {
            return res.json({
                status: 0,
                message: "Receptionist ID is required"
            });
        }

        const receptionist = await Receptionist.findOne({
            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'country_code',
                'profile_image',
                'branch_id',
                'merchant_id',
                'status',
                'createdAt',
                'updatedAt'
            ],
            where: {
                id: receptionist_id,
                merchant_id: merchant_id,
                del_status: 0
            },
            include: [
                {
                    model: Branch,
                    attributes: ['id', 'name', 'address', 'phone', 'email'],
                    required: false
                }
            ]
        });

        if (!receptionist) {
            return res.json({
                status: 0,
                message: "Receptionist not found"
            });
        }

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

        const data = receptionist.toJSON();

        data.profile_image = data.profile_image
            ? baseUrl + '/' + data.profile_image.replace(/\\/g, '/')
            : null;

        delete data.password;

        return res.json({
            status: 1,
            message: "Receptionist details fetched successfully",
            data: data
        });

    } catch (err) {

        console.log("FETCH RECEPTIONIST ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};
// update receptionist
exports.update_receptionist = async (req, res) => {

    try {

        const merchant_id = req.user.id;
        const receptionist_id = req.body.id || req.params.id;

        const { name, email, phone, branch_id, country_code, status, password } = req.body;

        if (!merchant_id) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        if (!receptionist_id) {
            return res.json({
                status: 0,
                message: "Receptionist ID is required"
            });
        }

        // Check if receptionist exists and belongs to this merchant
        const receptionist = await Receptionist.findOne({
            where: {
                id: receptionist_id,
                merchant_id: merchant_id,
                del_status: 0
            }
        });

        if (!receptionist) {
            return res.json({
                status: 0,
                message: "Receptionist not found"
            });
        }

        // Check if branch exists (if branch_id is provided)
        if (branch_id) {
            const branch = await Branch.findOne({
                where: {
                    id: branch_id,
                    merchant_id: merchant_id,
                    del_status: 0
                }
            });

            if (!branch) {
                return res.json({
                    status: 0,
                    message: "Branch not found"
                });
            }
        }

        // Check if email already exists for other receptionist
        if (email && email !== receptionist.email) {
            const emailExists = await Receptionist.findOne({
                where: {
                    email: email,
                    id: { [Op.ne]: receptionist_id },
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

        // Check if phone already exists for other receptionist
        let phoneNumber = receptionist.phone;
        
        if (phone && phone !== receptionist.phone) {
            try {
                const cleanPhone = phone.replace(/\s+/g, '');
                const fullPhone = cleanPhone.startsWith('+')
                    ? cleanPhone
                    : (country_code || receptionist.country_code) + cleanPhone;

                const num = parsePhoneNumber(fullPhone);

                if (!num.isValid()) {
                    return res.json({
                        status: 0,
                        message: "Invalid phone number"
                    });
                }

                phoneNumber = num.number;

                const phoneExists = await Receptionist.findOne({
                    where: {
                        phone: phoneNumber,
                        id: { [Op.ne]: receptionist_id },
                        del_status: 0
                    }
                });

                if (phoneExists) {
                    return res.json({
                        status: 0,
                        message: "Phone number already exists"
                    });
                }
            } catch (err) {
                console.log("PHONE ERROR:", err);
                return res.json({
                    status: 0,
                    message: "Invalid phone format"
                });
            }
        }

        // Handle profile image upload
        let profileImage = receptionist.profile_image;

        if (req.files && req.files.length > 0) {
            const profileFile = req.files.find(
                file => file.fieldname === 'profile_image'
            );

            if (profileFile) {
                profileImage = profileFile.path.replace(/\\/g, '/');
            }
        }

        // Prepare update data
        const updateData = {
            name: name || receptionist.name,
            email: email || receptionist.email,
            phone: phoneNumber,
            country_code: country_code || receptionist.country_code,
            branch_id: branch_id || receptionist.branch_id,
            profile_image: profileImage,
            status: status !== undefined ? status : receptionist.status
        };

        // Handle password update if provided
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        // Update receptionist
        await receptionist.update(updateData);

        // Fetch updated receptionist details
        const updatedReceptionist = await Receptionist.findOne({
            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'country_code',
                'profile_image',
                'branch_id',
                'merchant_id',
                'status',
                'createdAt',
                'updatedAt'
            ],
            where: {
                id: receptionist_id
            },
            include: [
                {
                    model: Branch,
                    attributes: ['id', 'name', 'address'],
                    required: false
                }
            ]
        });

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        
        const data = updatedReceptionist.toJSON();
        data.profile_image = data.profile_image
            ? baseUrl + '/' + data.profile_image.replace(/\\/g, '/')
            : null;

        return res.json({
            status: 1,
            message: "Receptionist updated successfully",
            data: data
        });

    } catch (err) {

        console.log("UPDATE RECEPTIONIST ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

exports.dashboard = async (req, res) => {

    try {

        const receptionist = await Receptionist.findByPk(req.user.id, {

            attributes: [
                'id',
                'name',
                'email',
                'phone',
                'profile_image'
            ],

            include: [

                {
                    model: Branch,

                    where: {
                        status: 1,
                        del_status: 0
                    },

                    required: false,

                    attributes: [
                        'id',
                        'name',
                        'email',
                        'phone',
                        'profile_image'
                    ],

                    include: [

                        {
                            model: Appointment,
                             limit: 10,

                            required: false,

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
                            ]
                        },

                        {
                            model: Merchant,

                            required: false,

                            attributes: [
                                'id',
                                'bus_name',
                                'name'
                            ]
                        }

                    ]

                }

            ]

        });

        if (!receptionist) {

            return res.json({
                status: 0,
                message: "Receptionist not found"
            });

        }

        // receptionist image
        if (receptionist.profile_image) {

            receptionist.profile_image =
                baseUrl + '/' +
                receptionist.profile_image.replace(/\\/g, '/');

        } else {

            receptionist.profile_image = null;

        }

        // branch details
        if (receptionist.Branch) {

            const branch = receptionist.Branch;

            // branch image
            if (branch.profile_image) {

                branch.profile_image =
                    baseUrl + '/' +
                    branch.profile_image.replace(/\\/g, '/');

            } else {

                branch.profile_image = null;

            }

            // appointment count
            branch.dataValues.appointment_count =
                branch.Appointments
                    ? branch.Appointments.length
                    : 0;

            // slot format
            if (branch.Appointments?.length > 0) {

                branch.Appointments.forEach(appointment => {

                    if (appointment.slot) {

                        appointment.slot = moment(
                            appointment.slot,
                            "HH:mm"
                        ).format("hh:mm A");

                    }

                });

            }

            // coupon count
            const coupon_count = await Coupon.count({

                where: {

                    branch_ids: {
                        [Op.contains]: [branch.id]
                    },

                    status: 1,
                    del_status: 0

                }

            });

            branch.dataValues.coupon_count =
                coupon_count;

            // redeemed users count
            const redeemed_users =
                await CouponApplied.count({

                    include: [

                        {
                            model: Coupon,

                            required: true,

                            where: {

                                branch_ids: {
                                    [Op.contains]: [branch.id]
                                },

                                status: 1,
                                del_status: 0

                            }

                        }

                    ],

                    where: {
                        status: 1,
                        del_status: 0
                    }

                });

            branch.dataValues.Redeemed_Users =
                redeemed_users;

        }

        return res.json({
            status: 1,
            message: "Receptionist Dashboard",
            data: receptionist
        });

    } catch (err) {

        console.log("DASHBOARD ERROR:", err);

        return res.json({
            status: 0,
            message: "Error",
            error: err.message
        });

    }

};

exports.fetch_coupon = async (req, res) => {

    try {

        const receptionist = await Receptionist.findByPk(req.user.id, {

            attributes: [
                'id'
            ],

            include: [
                {
                    model: Branch,

                    attributes: [
                        'id',
                        'name'
                    ],

                    where: {
                        status: 1,
                        del_status: 0
                    },

                    required: false
                }
            ]
        });

        if (!receptionist) {

            return res.json({
                status: 0,
                message: "Receptionist not found"
            });

        }

        let coupons = [];

        if (receptionist.Branch) {

            const branch = receptionist.Branch;

            coupons = await Coupon.findAll({

                attributes: [
                    'merchant_id',
                    'code',
                    'percentage',
                    'min_amount',
                    'usage_limit',
                    'start_date',
                    'banner_image',
                    'end_date'
                ],

                where: {

                    branch_ids: {
                        [Op.contains]: [branch.id]
                    },

                    status: 1,
                    del_status: 0
                }

            });

        }

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

        const data = coupons.map(item => {

            const cpn = item.toJSON();

            cpn.banner_image = cpn.banner_image
                ? baseUrl + '/' + cpn.banner_image.replace(/\\/g, '/')
                : null;

            cpn.is_expired =
                new Date() > new Date(cpn.end_date) ? 1 : 0;

            return cpn;

        });

        return res.json({
            status: 1,
            message: "Receptionist Coupon",
            data: data
        });

    } catch (err) {

        console.log("ERROR:", err);

        return res.json({
            status: 0,
            message: "Error",
            error: err.message
        });

    }

};

exports.fetch_appointment = async (req, res) => {

    try {

        const receptionist = await Receptionist.findByPk(req.user.id, {

            attributes: [
                'id',
            ],

            include: [

                {
                    model: Branch,

                    where: {
                        status: 1,
                        del_status: 0
                    },

                    required: false,

                    attributes: [
                        'id',
                        'name',

                    ],

                    include: [

                        {
                            model: Appointment,
                             limit: 10,

                            required: false,

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
                            ]
                        },


                    ]

                }

            ]

        });

        if (!receptionist) {

            return res.json({
                status: 0,
                message: "Receptionist not found"
            });

        }



        // branch details
        if (receptionist.Branch) {

            const branch = receptionist.Branch;

            // branch image
          

            // appointment count
            branch.dataValues.appointment_count =
                branch.Appointments
                    ? branch.Appointments.length
                    : 0;

            // slot format
            if (branch.Appointments?.length > 0) {

                branch.Appointments.forEach(appointment => {

                    if (appointment.slot) {

                        appointment.slot = moment(
                            appointment.slot,
                            "HH:mm"
                        ).format("hh:mm A");

                    }

                });

            }


        }

        return res.json({
            status: 1,
            message: "Receptionist Dashboard",
            data: receptionist
        });

    } catch (err) {

        console.log("DASHBOARD ERROR:", err);

        return res.json({
            status: 0,
            message: "Error",
            error: err.message
        });

    }

};
