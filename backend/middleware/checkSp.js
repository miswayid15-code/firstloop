const { SalePerson } = require('../models');

module.exports = async (req, res, next) => {
    try {

        const salePerson = await SalePerson.findByPk(req.user.id);

        if (!salePerson) {
            return res.json({
                status: 0,
                message: "Salesperson not found"
            });
        }

        req.salePerson = salePerson;

        next();

    } catch (error) {
  console.error("Salesperson middleware error:", error);
        return res.json({
            status: 0,
            message: "Something went wrong"
        });

    }
};