const { Coupon, Merchant, Branch } = require('../../models');
const { Op, where } = require('sequelize');

exports.create_coupon = async (req, res) => {

    try {

        const {
            code,
            percentage,
            min_amount,
            usage_limit,
            start_date,
            branch_ids,
            end_date
        } = req.body;

        const merchant = await Merchant.findByPk(req.user.id);

        if (!merchant) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

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

        if (new Date(start_date) > new Date(end_date)) {
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
        const coupon = await Coupon.create({

            merchant_id: merchant.id,
            branch_ids: JSON.stringify(branch_ids || []),
            code,
            percentage,
            min_amount,
            usage_limit,
            start_date,
            end_date,
            status: 1,
            del_status: 0

        });

        return res.json({
            status: 1,
            message: "Coupon created successfully",
            data: coupon
        });

    } catch (err) {

        console.log("FETCH ERROR:", err);

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
            start_date,
            end_date
        } = req.body;

        const merchant = await Merchant.findByPk(req.user.id);

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

        if (new Date(start_date) > new Date(end_date)) {
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

            branch_ids: JSON.stringify(branch_ids || []),
            code,
            percentage,
            min_amount,
            usage_limit,
            start_date,
            end_date

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

        const merchant = await Merchant.findByPk(req.user.id);

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
                'start_date',
                'end_date'
            ],
            where: {
                del_status: 0,
                merchant_id: merchant.id
            },
            order: [['id', 'DESC']]
        });

        const data = coupon.map(item => {

            const cpn = item.toJSON();

            cpn.is_expired = new Date() > new Date(cpn.end_date) ? 1 : 0;

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

        const merchant = await Merchant.findByPk(req.user.id);

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