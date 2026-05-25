const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Sequelize } = require("sequelize");
const {
    RefreshToken,
    admins, Merchant, Branch,Receptionist
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

            process.env.JWT_SECRET,

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

        await RefreshToken.destroy({
            where: {
                user_id: req.user.id,
                user_type: 'admin'
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
                'email',
                'phone',
                'status',

                [
                    Sequelize.fn(
                        'TO_CHAR',
                        Sequelize.col('Merchant.createdAt'),
                        'DD-MM-YYYY HH12:MI AM'
                    ),
                    'createdAt'
                ],

                [
                    Sequelize.fn(
                        'COUNT',
                        Sequelize.col('Branches.id')
                    ),
                    'branch_count'
                ]

            ],

            include: [

                {
                    model: Branch,

                    where: {
                        del_status: 0,
                        status: 1
                    },

                    attributes: [],

                    required: false
                }

            ],

            group: [

                'Merchant.id'

            ],

            order: [

                ['id', 'DESC']

            ],

            subQuery: false

        });

        return res.json({

            status: 1,

            message: "Merchant List",

            data: merchants

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
                                'name',
                                'email',
                                'phone',
                                'profile_image'
                            ]

                        }

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

        // Merchant Images
        ['profile_image', 'brand_image', 'document'].forEach(field => {

            if (data[field]) {

                data[field] =
                    baseUrl + '/' + data[field].replace(/\\/g, '/');

            } else {

                data[field] = null;

            }

        });

        // Branch + Receptionist Images
        if (data.Branches && data.Branches.length > 0) {

            data.Branches = data.Branches.map(branch => {

                // Branch Image
                if (branch.profile_image) {

                    branch.profile_image =
                        baseUrl + '/' + branch.profile_image.replace(/\\/g, '/');

                } else {

                    branch.profile_image = null;

                }

                // Receptionists
                if (branch.Receptionists && branch.Receptionists.length > 0) {

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

                return branch;

            });

        }

        return res.json({
            status: 1,
            data: data
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