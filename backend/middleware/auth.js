const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

    try {

        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {

            return res.json({
                status: 0,
                message: "No token"
            });

        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // only access token allowed
        if (decoded.token_type !== 'access') {

            return res.json({
                status: 0,
                message: "Access token required"
            });

        }

        req.user = decoded;

        next();

    } catch (err) {

        return res.json({
            status: 0,
            message: "Invalid token"
        });

    }

};