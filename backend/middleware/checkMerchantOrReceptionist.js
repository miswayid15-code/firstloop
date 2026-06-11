const { Merchant, Receptionist } = require('../models');

module.exports = async (req, res, next) => {

    try {
        console.log("TOKEN USER TYPE:", req.user.user_type);
console.log("TOKEN ID:", req.user.id);

merchant = await Merchant.findByPk(req.user.id);
console.log("MERCHANT:", merchant);

receptionist = await Receptionist.findByPk(req.user.id);
console.log("RECEPTIONIST:", receptionist);

        let merchant = null;
        let receptionist = null;

        merchant = await Merchant.findByPk(req.user.id);

        if (merchant) {

            if (merchant.del_status == 1) {

                return res.json({
                    status: 0,
                    message: "Merchant account has been deleted"
                });

            }

            // if (merchant.status == 0) {

            //     return res.json({
            //         status: 0,
            //         message: "Merchant account is inactive"
            //     });

            // }

            req.merchant = merchant;

            return next();

        }

        receptionist = await Receptionist.findByPk(req.user.id);

        if (receptionist) {

            if (receptionist.del_status == 1) {

                return res.json({
                    status: 0,
                    message: "Receptionist account has been deleted"
                });

            }

            // if (receptionist.status == 0) {

            //     return res.json({
            //         status: 0,
            //         message: "Receptionist account is inactive"
            //     });

            // }

            req.receptionist = receptionist;

            return next();

        }

        return res.json({
            status: 0,
            message: "User not found"
        });

    } catch (error) {

        return res.json({
            status: 0,
            message: "Something went wrong"
        });

    }

};