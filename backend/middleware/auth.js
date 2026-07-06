const jwt = require('jsonwebtoken');

module.exports = (...roles) => {

    return (req, res, next) => {

        try {

            const token =
                req.headers.authorization?.split(' ')[1];

            if (!token) {

                return res.status(401).json({
                    status: 0,
                    message: "No token"
                });

            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            // console.log("TOKEN DATA:", decoded);

            // access token check
            if (decoded.token_type !== 'access') {

                return res.status(401).json({
                    status: 0,
                    message: "Access token required"
                });

            }

            // console.log(
            //     "USER TYPE---:",
            //     decoded.user_type
            // );

            // console.log(
            //     "REQUIRED ROLES:",
            //     roles
            // );
            // role check
            if (

                roles.length > 0 &&
                !roles.includes(decoded.user_type)

            ) {

                console.log("ROLE NOT MATCHED");

                return res.status(401).json({
                    status: 0,
                    message: "Unauthorized access"
                });

            }

            // console.log("ROLE MATCHED");

            req.user = decoded;

            next();

        } catch (err) {

            console.log("AUTH ERROR:", err);

            return res.status(401).json({
                status: 0,
                message: "Invalid token"
            });

        }

    };

};