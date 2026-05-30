const { Merchant } = require('../models');

module.exports = async (req, res, next) => {
    try {

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

        if (merchant.status == 0) {
            return res.json({
                status: 0,
                message: "Merchant account is inactive"
            });
        }

        req.merchant = merchant;

        next();

    } catch (error) {

        return res.json({
            status: 0,
            message: "Something went wrong"
        });

    }
};