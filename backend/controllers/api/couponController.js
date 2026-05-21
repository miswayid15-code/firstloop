const { Coupon, Merchant, Branch } = require('../../models');
const { Op, where } = require('sequelize');
 const baseUrl = process.env.APP_URL;
exports.create_coupon = async (req, res) => {

    try {

        let {
            code,
            percentage,
            min_amount,
            usage_limit,
            start_time,
            branch_ids,
            end_time
        } = req.body;

        // ✅ Merchant ID
        const merchant_id = req.user.id;

        // ✅ Merchant Check
        if (!merchant_id) {

            return res.json({
                status: 0,
                message: "Merchant not found"
            });

        }

        // ✅ Convert branch_ids string to array
        if (typeof branch_ids === "string") {

            try {

                branch_ids = JSON.parse(branch_ids);

            } catch (err) {

                branch_ids = [];

            }

        }

        // ✅ Required Fields
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

        // ✅ Branch Check
        if (
            !branch_ids ||
            !Array.isArray(branch_ids) ||
            branch_ids.length === 0
        ) {

            return res.json({
                status: 0,
                message: "Please select branches"
            });

        }

        // ✅ Coupon Exists Check
        const coupon_check = await Coupon.findOne({

            where: {
                code: code
            }

        });

        if (coupon_check) {

            return res.json({
                status: 0,
                message: "Coupon already exists"
            });

        }

        // ✅ Percentage Validation
        if (
            Number(percentage) < 0 ||
            Number(percentage) > 100
        ) {

            return res.json({
                status: 0,
                message: "Percentage must be between 0 and 100"
            });

        }

        // ✅ Minimum Amount Validation
        if (
            min_amount &&
            Number(min_amount) < 0
        ) {

            return res.json({
                status: 0,
                message: "Minimum amount must be greater than or equal to 0"
            });

        }

        // ✅ Usage Limit Validation
        if (
            usage_limit &&
            Number(usage_limit) < 0
        ) {

            return res.json({
                status: 0,
                message: "Usage limit must be greater than or equal to 0"
            });

        }

        // ✅ Time Validation
        if (start_time >= end_time) {

            return res.json({
                status: 0,
                message: "End time must be greater than start time"
            });

        }

        // ✅ Validate Branches
        const valid_branches = await Branch.findAll({

            where: {
                id: branch_ids,
                merchant_id: merchant_id,
                del_status: 0
            },

            attributes: ['id']

        });

        if (
            valid_branches.length !== branch_ids.length
        ) {

            return res.json({
                status: 0,
                message: "Invalid branch selected"
            });

        }

        // ✅ Banner Image
        const bannerFile = req.files.find(
            file => file.fieldname === "banner_image"
        );

        const banner_image = bannerFile
            ? bannerFile.path.replace(/\\/g, '/')
            : null;

        // ✅ Create Coupon
        const coupon = await Coupon.create({

            merchant_id: merchant_id,

            branch_ids: branch_ids,

            code: code,

            percentage: percentage,

            min_amount: min_amount || 0,

            usage_limit: usage_limit || 0,

            start_time: start_time,

            end_time: end_time,

            banner_image: banner_image,

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

        return res.json({

            status: 0,
            message: err.message

        });

    }

};
exports.update_coupon = async (req, res) => {

    try {

        let {
            coupon_id,
            branch_ids,
            code,
            percentage,
            min_amount,
            usage_limit,
            start_time,
            end_time
        } = req.body;

        // ✅ Merchant ID
        const merchant_id = req.user.id;

        // ✅ Merchant Check
        if (!merchant_id) {

            return res.json({
                status: 0,
                message: "Merchant not found"
            });

        }

        // ✅ Convert branch_ids string to array
        if (typeof branch_ids === "string") {

            try {

                branch_ids = JSON.parse(branch_ids);

            } catch (err) {

                branch_ids = [];

            }

        }

        // ✅ Required Fields
        if (
            !coupon_id ||
            !code ||
            !percentage
            //|| !start_time ||
            // !end_time
        ) {

            return res.json({
                status: 0,
                message: "Required fields missing"
            });

        }

        // ✅ Branch Check
        if (
            !branch_ids ||
            !Array.isArray(branch_ids) ||
            branch_ids.length === 0
        ) {

            return res.json({
                status: 0,
                message: "Please select branches"
            });

        }

        // ✅ Coupon Exists
        const exist_coupon = await Coupon.findOne({

            where: {
                id: coupon_id,
                merchant_id: merchant_id,
                del_status: 0
            }

        });

        if (!exist_coupon) {

            return res.json({
                status: 0,
                message: "Coupon not found"
            });

        }

        // ✅ Duplicate Code Check
        const coupon_check = await Coupon.findOne({

            where: {

                code: code,

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

        // ✅ Percentage Validation
        if (
            Number(percentage) < 0 ||
            Number(percentage) > 100
        ) {

            return res.json({
                status: 0,
                message: "Percentage must be between 0 and 100"
            });

        }

        // ✅ Minimum Amount Validation
        if (
            min_amount &&
            Number(min_amount) < 0
        ) {

            return res.json({
                status: 0,
                message: "Minimum amount must be greater than or equal to 0"
            });

        }

        // ✅ Usage Limit Validation
        if (
            usage_limit &&
            Number(usage_limit) < 0
        ) {

            return res.json({
                status: 0,
                message: "Usage limit must be greater than or equal to 0"
            });

        }

        // ✅ Time Validation
        if (start_time >= end_time) {

            return res.json({
                status: 0,
                message: "End time must be greater than start time"
            });

        }

        // ✅ Validate Branches
        const valid_branches = await Branch.findAll({

            where: {
                id: branch_ids,
                merchant_id: merchant_id,
                del_status: 0
            },

            attributes: ['id']

        });

        if (
            valid_branches.length !== branch_ids.length
        ) {

            return res.json({
                status: 0,
                message: "Invalid branch selected"
            });

        }

        // ✅ Banner Image
        let banner_image = exist_coupon.banner_image;

        const bannerFile = req.files.find(
            file => file.fieldname === "banner_image"
        );

        if (bannerFile) {

            banner_image = bannerFile.path.replace(/\\/g, '/');

        }

        // ✅ Update Coupon
        await exist_coupon.update({

            branch_ids: branch_ids,

            code: code,

            percentage: percentage,

            min_amount: min_amount || 0,

            usage_limit: usage_limit || 0,

            start_time: start_time,

            end_time: end_time,

            banner_image: banner_image

        });

        return res.json({

            status: 1,
            message: "Coupon updated successfully",
            data: exist_coupon

        });

    }
    catch (err) {

        return res.json({

            status: 0,
            message: err.message

        });

    }

};

exports.fetch_coupon = async (req, res) => {

    try {

        const merchant_id = req.user.id;

        if (!merchant_id) {
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
                'banner_image',
                'end_time'
            ],
            where: {
                del_status: 0,
                merchant_id: merchant_id
            },
            order: [['id', 'DESC']]
        });

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

        const data = coupon.map(item => {

            const cpn = item.toJSON();

            cpn.banner_image = cpn.banner_image
                ? baseUrl + '/' + cpn.banner_image.replace(/\\/g, '/')
                : null;

            cpn.is_expired =
                new Date() > new Date(cpn.end_time) ? 1 : 0;

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