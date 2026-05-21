const { Coupon, Merchant, Branch } = require('../../models');
const { Op, where } = require('sequelize');

exports.create_coupon = async (req, res) => {

    try {

        const {
            code,
            percentage,
            min_amount,
            usage_limit,
            start_time,
            branch_ids,
            end_time
        } = req.body;

        
        const merchant_id = req.user.id;

        
        let banner_image = null;

        if (
            req.files &&
            req.files.banner_image &&
            req.files.banner_image[0]
        ) {

            banner_image =
                req.files.banner_image[0].filename;

        }

       
        if (!merchant_id) {

            return res.json({
                status: 0,
                message: "Merchant not found"
            });

        }

       
        if (
            !code ||
            !percentage ||
            !start_time ||
            !end_time
        ) {

            return res.json({
                status: 0,
                message: "Required fields missing"
            });

        }

// ✅ Branch Parse
let branch_array = [];

if (typeof branch_ids === 'string') {

    branch_array = branch_ids
        .replace('[', '')
        .replace(']', '')
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));

}
else if (Array.isArray(branch_ids)) {

    branch_array = branch_ids.map(id => parseInt(id));

}

        // ✅ Branch Check
        if (
            !branch_array ||
            !Array.isArray(branch_array) ||
            branch_array.length === 0
        ) {

            return res.json({
                status: 0,
                message: "Please select branches"
            });

        }

        // ✅ Coupon Exists
        const coupon_check = await Coupon.findOne({

            where: {
                code
            }

        });

        if (coupon_check) {

            return res.json({
                status: 0,
                message: "Coupon already exists"
            });

        }

        // ✅ Validate Branches
        const valid_branches = await Branch.findAll({

            where: {
                id: branch_array,
                merchant_id,
                del_status: 0
            },

            attributes: ['id']

        });

        if (
            valid_branches.length !==
            branch_array.length
        ) {

            return res.json({
                status: 0,
                message: "Invalid branch selected"
            });

        }

        // ✅ Create Coupon
        const coupon = await Coupon.create({

            merchant_id,

            branch_ids: branch_array,

            banner_image,

            code,

            percentage,

            min_amount,

            usage_limit,

            start_time,

            end_time,

            status: 1,

            del_status: 0

        });

        return res.json({

            status: 1,
            message: "Coupon created successfully",
            data: coupon

        });

    }
    catch (err) {

        console.log(
            "CREATE COUPON ERROR:",
            err
        );

        return res.json({

            status: 0,
            message: err.message

        });

    }

};


exports.update_coupon = async (req, res) => {

    try {

        const {
            coupon_id,
            branch_ids,
            code,
            percentage,
            min_amount,
            usage_limit,
            start_time,
            end_time
        } = req.body;

        const merchant = req.user.id;



        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        const exist_coupon = await Coupon.findOne({
            where: {
                id: coupon_id,
                merchant_id: merchant.id
            }
        });

        if (!exist_coupon) {
            return res.json({
                status: 0,
                message: "Coupon not found"
            });
        }

        const coupon_check = await Coupon.findOne({
            where: {
                code,
                id: {
                    [Op.ne]: coupon_id
                }
            }
        });

        if (coupon_check) {
            return res.json({
                status: 0,
                message: "Coupon already exists"
            });
        }

        if (min_amount < 0) {
            return res.json({
                status: 0,
                message: "Minimum amount must be greater than or equal to 0"
            });
        }

        if (usage_limit < 0) {
            return res.json({
                status: 0,
                message: "Usage limit must be greater than or equal to 0"
            });
        }

        if (new Date(start_time) > new Date(end_time)) {
            return res.json({
                status: 0,
                message: "End date must be greater than start date"
            });
        }
        // check valid branch ids
        const valid_branches = await Branch.findAll({
            where: {
                id: branch_ids,
                merchant_id: merchant.id,
                del_status: 0
            },
            attributes: ['id']
        });

        if (valid_branches.length !== branch_ids.length) {
            return res.json({
                status: 0,
                message: "Invalid branch selected"
            });
        }
        await exist_coupon.update({

           branch_ids: branch_ids,
            code,
            percentage,
            min_amount,
            usage_limit,
            start_time,
            end_time

        });

        return res.json({
            status: 1,
            message: "Coupon updated successfully",
            data: exist_coupon
        });

    } catch (err) {

        console.log("FETCH ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};
exports.fetch_coupon = async (req, res) => {

    try {

        const merchant = req.user.id;

        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }
        const coupon = await Coupon.findAll({
            attributes: [
                'merchant_id',
                'code',
                'percentage',
                'min_amount',
                'usage_limit',
                'start_time',
                'end_time'
            ],
            where: {
                del_status: 0,
                merchant_id: merchant.id
            },
            order: [['id', 'DESC']]
        });

        const data = coupon.map(item => {

            const cpn = item.toJSON();

            cpn.is_expired = new Date() > new Date(cpn.end_time) ? 1 : 0;

            return cpn;
        });

        return res.json({
            status: 1,
            message: "Coupon list fetched successfully",
            data: data
        });

    } catch (err) {

        console.log("FETCH ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

exports.check_coupon = async (req, res) => {

    try {

        const merchant = req.user.id;

        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        const { code } = req.body;

        const coupon_check = await Coupon.findOne({
            where: {
                code: code,
                del_status: 0
            }
        });

        if (coupon_check) {
            return res.json({
                status: 0,
                message: "Coupon already exists"
            });
        }

        return res.json({
            status: 1,
            message: "Coupon available"
        });

    } catch (err) {

        console.log("FETCH ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

exports.generate_coupon = async (req, res) => {
    try {

        const merchant = req.user.id;


        const merchantName = req.user.bus_name || req.user.name || "MERCHANT";

        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }


        const shortName = merchantName
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase();

        let couponCode = '';
        let coupon_check = null;

        
        do {

            couponCode = shortName + Math.floor(1000 + Math.random() * 9000);

            coupon_check = await Coupon.findOne({
                where: {
                    code: couponCode,
                    del_status: 0
                }
            });

        } while (coupon_check);

        return res.json({
            status: 1,
            message: "Coupon Generated Successfully",
            data: {
                code: couponCode
            }
        });

    } catch (err) {

        console.log("COUPON GENERATE ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }
};