const { admins } = require('../models');

module.exports = async (req, res, next) => {
    try {

        const admin = await admins.findByPk(req.user.id);

        if (!admin) {
            return res.json({
                status: 0,
                message: "Admin not found"
            });
        }

        req.admin = admin;

        next();

    } catch (error) {
  console.error("Admin middleware error:", error);
        return res.json({
            status: 0,
            message: "Something went wrong"
        });

    }
};