const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
    RefreshToken,
    admins
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

exports.dashboard=async(req,res)=>{
    try{
        const admin = await admins.findByPk(req.user.id);
        if(!admin){
            return res.json({
                status: 0,
                message: "Admin not found"
            });
        }

        return res.json({
            status: 1,
            message: "Admin Dashboard"
        }); }catch(err){
        return res.json({
            status: 0,
            message: "Error"
        });
    }
};