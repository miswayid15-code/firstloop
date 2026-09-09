const jwt = require('jsonwebtoken');

module.exports = (...roles) => {

    return (req, res, next) => {

        try {

            // console.log('\n========== AUTH MIDDLEWARE ==========');
            // console.log('METHOD:', req.method);
            // console.log('URL:', req.originalUrl);
            // console.log('REQUIRED ROLES:', roles);

            const authHeader = req.headers.authorization;

            // console.log(
            //     'AUTH HEADER:',
            //     authHeader ? 'Present' : 'Missing'
            // );

            const token = authHeader?.split(' ')[1];

            // =========================
            // TOKEN CHECK
            // =========================

            if (!token) {

                console.log('AUTH ERROR: Token not found');

                return res.status(401).json({
                    status: 0,
                    message: "No token"
                });

            }

            // console.log(
            //     'TOKEN:',
            //     token.substring(0, 20) + '...'
            // );

            // =========================
            // JWT VERIFY
            // =========================

            let decoded;

            try {

                decoded = jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

                // console.log('TOKEN VERIFIED SUCCESSFULLY');

            } catch (jwtError) {

                console.log('JWT VERIFY ERROR');
                console.log('NAME:', jwtError.name);
                console.log('MESSAGE:', jwtError.message);

                if (jwtError.name === 'TokenExpiredError') {
                    console.log('TOKEN EXPIRED AT:', jwtError.expiredAt);
                }

                if (jwtError.name === 'JsonWebTokenError') {
                    console.log('INVALID JWT TOKEN');
                }

                return res.status(401).json({
                    status: 0,
                    message: "Invalid token"
                });

            }

            // console.log('TOKEN DATA:', decoded);

            // =========================
            // TOKEN TYPE CHECK
            // =========================

            // console.log(
            //     'TOKEN TYPE:',
            //     decoded.token_type
            // );

            if (decoded.token_type !== 'access') {

                // console.log(
                //     'AUTH ERROR: Invalid token type:',
                //     decoded.token_type
                // );

                return res.status(401).json({
                    status: 0,
                    message: "Access token required"
                });

            }

            // =========================
            // ROLE CHECK
            // =========================

            // console.log(
            //     'USER TYPE:',
            //     decoded.user_type
            // );

            // console.log(
            //     'REQUIRED ROLES:',
            //     roles
            // );

            if (
                roles.length > 0 &&
                !roles.includes(decoded.user_type)
            ) {

                // console.log('ROLE NOT MATCHED');
                // console.log(
                //     'User role:',
                //     decoded.user_type
                // );
                // console.log(
                //     'Allowed roles:',
                //     roles
                // );

                return res.status(401).json({
                    status: 0,
                    message: "Unauthorized access"
                });

            }

            // console.log('ROLE MATCHED');
            // console.log('AUTH SUCCESS');

            // =========================
            // SET USER
            // =========================

            req.user = decoded;

            next();

        } catch (err) {

            console.log('\n========== AUTH ERROR ==========');
            console.log('ERROR NAME:', err.name);
            console.log('ERROR MESSAGE:', err.message);
            console.log('ERROR STACK:', err.stack);

            return res.status(401).json({
                status: 0,
                message: "Invalid token"
            });

        }

    };

};