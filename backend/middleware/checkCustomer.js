const { Customer } = require('../models');

module.exports = async (req, res, next) => {
    try {

        const customer = await Customer.findByPk(req.user.id);

        if (!customer) {
            return res.json({
                status: 0,
                message: "Customer not found"
            });
        }

        if (customer.del_status == 1) {
            return res.json({
                status: 0,
                message: "Customer account has been deleted"
            });
        }

        if (customer.status == 0) {
            return res.json({
                status: 0,
                message: "Customer account is inactive"
            });
        }

        req.customer = customer;

        next();

    } catch (error) {

        return res.json({
            status: 0,
            message: "Something went wronga"
        });

    }
};