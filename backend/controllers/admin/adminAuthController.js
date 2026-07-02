const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Sequelize } = require("sequelize");
const { Op } = require('sequelize');
const {
    RefreshToken,
    admins, Merchant, Branch, Receptionist, Coupon, CouponApplied, Category
} = require('../../models');

exports.login = async (req, res) => {

    try {

        const { username, password } = req.body;

        // ✅ Validation
        if (!username || !password) {

            return res.json({

                status: 0,
                message: "Username and password are required"

            });

        }

        // ✅ Find Admin
        const admin = await admins.findOne({

            where: {

                username: username,
                status: 1,
                del_status: 0

            }

        });

        // ✅ Invalid Username
        if (!admin) {

            return res.json({

                status: 0,
                message: "Invalid username or password"

            });

        }

        // ✅ Password Check
        const match = await bcrypt.compare(

            password,
            admin.password

        );

        // ✅ Invalid Password
        if (!match) {

            return res.json({

                status: 0,
                message: "Invalid username or password"

            });

        }

        // ✅ Refresh Token
        const refreshToken = jwt.sign(

            {

                id: admin.id,
                type: 'admin',
                token_type: 'refresh'

            },

            process.env.JWT_REFRESH_SECRET,

            {

                expiresIn: '7d'

            }

        );

        // ✅ Store Refresh Token
        await RefreshToken.create({

            user_id: admin.id,

            user_type: 'admin',

            token: refreshToken,

            expires_at: new Date(

                Date.now() +
                7 * 24 * 60 * 60 * 1000

            )

        });

        // ✅ Access Token
        const accessToken = jwt.sign(

            {

                id: admin.id,
                username: admin.username,
                user_type: 'admin',
                token_type: 'access'

            },

            process.env.JWT_SECRET,

            {

                expiresIn: '1d'

            }

        );

        // ✅ Update Last Login
        await admin.update({

            last_login: new Date()

        });

        // ✅ Response
        return res.json({

            status: 1,

            message: "Login successful",

            access_token: accessToken,

            refresh_token: refreshToken,

            data: {

                id: admin.id,
                name: admin.name,

                role: admin.role

            }

        });

    } catch (err) {

        console.log("LOGIN ERROR:", err);

        return res.json({

            status: 0,
            message: err.message

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
                user_type: 'admin'
            }
        });

        return res.status(200).json({
            status: 1,
            message: "Logged out successfully from all devices"
        });

    } catch (err) {

        console.error("Logout Error:", err);

        return res.status(500).json({
            status: 0,
            message: "Internal server error"
        });
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
        if (!refresh_token) {
            return res.json({
                status: 0,
                message: "Refresh token required"
            });
        }

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
            process.env.JWT_REFRESH_SECRET
        );

        const admin = await admins.findOne({
            where: {
                id: decoded.id,
                status: 1,
                del_status: 0
            }
        });

        if (!admin) {
            return res.json({
                status: 0,
                message: "Admin not found"
            });
        }
        const newAccessToken = jwt.sign(
            {
                id: admin.id,
                username: admin.username,
                user_type: "admin",
                token_type: "access"
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

exports.dashboard = async (req, res) => {
    try {
        const admin = await admins.findByPk(req.user.id);
        if (!admin) {
            return res.json({
                status: 0,
                message: "Admin not found"
            });
        }

        return res.json({
            status: 1,
            message: "Admin Dashboard"
        });
    } catch (err) {
        return res.json({
            status: 0,
            message: "Error"
        });
    }
};

exports.merchant_list = async (req, res) => {

    try {

        const admin = await admins.findByPk(req.user.id);

        if (!admin) {

            return res.json({
                status: 0,
                message: "Admin not found"
            });

        }

        const merchants = await Merchant.findAll({

            where: {
                del_status: 0
            },

            attributes: [

                'id',
                'name',
                'bus_name',
                'email',
                'phone',
                'country_code',
                'status',

                [
                    Sequelize.fn(
                        'TO_CHAR',
                        Sequelize.col('Merchant.createdAt'),
                        'DD-MM-YYYY HH12:MI AM'
                    ),
                    'createdAt'
                ]

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
exports.fetchmerchant = async (req, res) => {

    try {

        const admin = await admins.findByPk(req.user.id);

        if (!admin) {

            return res.json({
                status: 0,
                message: "Admin not found"
            });

        }

        const id = req.body.id;

        if (!id) {

            return res.json({
                status: 0,
                message: "Merchant id is required"
            });

        }

        const merchant = await Merchant.findOne({

            where: {
                id: id,
                del_status: 0
            },

            include: [

                {

                    model: Branch,

                    where: {
                        del_status: 0
                    },
                    attributes: [
                        'id',
                        'name',
                        'address',
                        'email',
                        'phone',
                        'profile_image',
                        'country_code',
                        'status',
                        'visibility',
                        'age_group'
                    ],

                    required: false,

                    include: [

                        {

                            model: Receptionist,

                            where: {
                                del_status: 0
                            },

                            required: false,

                            attributes: [
                                'id',
                                'rep_id',
                                'name',
                                'country_code',
                                'profile_image',
                            ]

                        }

                    ]

                },
                {
                    model: Category,
                    required: false,
                    where: {
                        del_status: 0,
                        status: 1
                    },
                    attributes: [
                        'id',
                        'name',

                    ]



                }


            ]

        });

        if (!merchant) {

            return res.json({
                status: 0,
                message: "Merchant not found"
            });

        }

        const data = merchant.toJSON();

        const baseUrl = process.env.APP_URL;

        ['profile_image', 'brand_image', 'document'].forEach(field => {

            if (data[field]) {

                data[field] =
                    baseUrl + '/' + data[field].replace(/\\/g, '/');

            } else {

                data[field] = null;

            }

        });
        const branchMap = {};


        if (data.Branches && data.Branches.length > 0) {
            data.Branches.forEach(branch => {
                branchMap[branch.id] = branch.name;
            });
            for (const branch of data.Branches) {

                // Branch Image
                if (branch.profile_image) {

                    branch.profile_image =
                        baseUrl + '/' +
                        branch.profile_image.replace(/\\/g, '/');

                } else {

                    branch.profile_image = null;

                }

                // Receptionist Images
                if (branch.Receptionists &&
                    branch.Receptionists.length > 0) {

                    branch.Receptionists =
                        branch.Receptionists.map(receptionist => {

                            if (receptionist.profile_image) {

                                receptionist.profile_image =
                                    baseUrl + '/' +
                                    receptionist.profile_image.replace(/\\/g, '/');

                            } else {

                                receptionist.profile_image = null;

                            }

                            return receptionist;

                        });

                }

                // Fetch Coupons manually
                const coupons = await Coupon.findAll({

                    where: {
                        del_status: 0
                    },

                    attributes: ['id', 'branch_ids']

                });

                branch.coupon_count = coupons.filter(coupon => {

                    return (
                        Array.isArray(coupon.branch_ids) &&
                        coupon.branch_ids.includes(branch.id)
                    );

                }).length;

            }

        }
        const branchIds = data.Branches
            ? data.Branches.map(branch => branch.id)
            : [];

        const merchantCoupons = await Coupon.findAll({

            where: {
                merchant_id: id,
                del_status: 0
            },

            order: [['id', 'DESC']]

        });

        const couponList = merchantCoupons.map(coupon => {

            const item = coupon.toJSON();

            item.banner_image = item.banner_image
                ? baseUrl + '/' + item.banner_image.replace(/\\/g, '/')
                : null;

            item.branch_names = (item.branch_ids || []).map(id => ({
                id,
                name: branchMap[id] || null
            }));

            return item;

        });

        const totalCoupons = await Coupon.count({
            where: {
                del_status: 0,
                status: 1,
                branch_ids: {
                    [Op.overlap]: branchIds
                }
            }
        });

        const couponIds = merchantCoupons.map(coupon => coupon.id);

        const redeemedCoupons = await CouponApplied.count({
            where: {
                del_status: 0,
                status: 2,
                coupon_id: {
                    [Op.in]: couponIds
                }
            }
        });
        const total_branch = data.Branches ? data.Branches.length : 0;

        const total_receptionists = data.Branches
            ? data.Branches.reduce((total, branch) => {
                return total + (branch.Receptionists ? branch.Receptionists.length : 0);
            }, 0)
            : 0;

        const allCoupons = await Coupon.findAll({

            where: {
                del_status: 0
            },

            attributes: ['id', 'branch_ids']

        });

        const couponCountMap = {};

        allCoupons.forEach(coupon => {

            (coupon.branch_ids || []).forEach(branchId => {

                couponCountMap[branchId] =
                    (couponCountMap[branchId] || 0) + 1;

            });

        });

        if (data.Branches && data.Branches.length > 0) {

            for (const branch of data.Branches) {

                // Branch Image
                if (branch.profile_image) {

                    branch.profile_image =
                        baseUrl + '/' +
                        branch.profile_image.replace(/\\/g, '/');

                } else {

                    branch.profile_image = null;

                }

                // Receptionist Images
                if (
                    branch.Receptionists &&
                    branch.Receptionists.length > 0
                ) {

                    branch.Receptionists =
                        branch.Receptionists.map(receptionist => {

                            if (receptionist.profile_image) {

                                receptionist.profile_image =
                                    baseUrl + '/' +
                                    receptionist.profile_image.replace(/\\/g, '/');

                            } else {

                                receptionist.profile_image = null;

                            }

                            return receptionist;

                        });

                }

                // Coupon Count
                branch.coupon_count =
                    couponCountMap[branch.id] || 0;

            }

        }
        const unassignedReceptionists = await Receptionist.findAll({

            where: {
                merchant_id: id,
                del_status: 0,
                status: 1,
                branch_id: null
            },

            attributes: [
                'id',
                'rep_id',
                'name',
                'email',
                'phone',
                'country_code',
                'profile_image'
            ]

        });

        const formattedReceptionists = unassignedReceptionists.map(item => {

            const receptionist = item.toJSON();

            receptionist.profile_image = receptionist.profile_image
                ? baseUrl + '/' + receptionist.profile_image.replace(/\\/g, '/')
                : null;

            return receptionist;

        });

        data.total_branch = total_branch;
        data.total_receptionists = total_receptionists;
        data.total_coupon_count = totalCoupons;
        data.total_redeem_coupon = redeemedCoupons;
        data.unassigned_receptionists = formattedReceptionists;
        data.unassigned_receptionist_count = formattedReceptionists.length;
        data.coupon_list = couponList;
        return res.json({

            status: 1,
            message: "Merchant fetched successfully",
            data: data,


        });

    } catch (err) {

        console.log(err);

        return res.json({

            status: 0,
            message: "Error",
            error: err.message

        });

    }

};