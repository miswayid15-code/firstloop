const { Merchant, Receptionist } = require('../models');

module.exports = async (req, res, next) => {

    try {

        if (req.user.user_type === 'merchant') {

            const merchant = await Merchant.findByPk(req.user.id);

            if (!merchant) {
                return res.json({
                    status: 0,
                    message: "Merchant not found"
                });
            }

            if (merchant.del_status == 1) {
                return res.json({
                    status: 0,
                    message: "Merchant account has been deleted"
                });
            }

            req.merchant = merchant;

            return next();
        }

        if (req.user.user_type === 'receptionist') {

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

            req.receptionist = receptionist;

            return next();
        }

        return res.json({
            status: 0,
            message: "Invalid user type"
        });

    } catch (error) {

        console.log(error);

        return res.json({
            status: 0,
            message: "Something went wronga"
        });
    }
};