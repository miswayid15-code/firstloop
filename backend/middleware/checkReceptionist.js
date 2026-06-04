const { Receptionist } = require('../models');

module.exports = async (req, res, next) => {
    try {

        const receptionist = await Receptionist.findByPk(req.user.id);

        if (!receptionist) {
            return res.json({
                status: 0,
                message: "Receptionist not found"
            });
        }

        if (receptionist.del_status == 1) {
            return res.json({
                status: 0,
                message: "Receptionist account has been deleted"
            });
        }

        if (receptionist.status == 0) {
            return res.json({
                status: 0,
                message: "Receptionist account is inactive"
            });
        }

        req.receptionist = receptionist;

        next();

    } catch (error) {

        return res.json({
            status: 0,
            message: "Something went wrong"
        });

    }
};