const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.json({ status: 0, message: "No token" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // attach user

        next();
    }
    catch (err) {
        return res.json({ status: 0, message: "Invalid token" });
    }
}