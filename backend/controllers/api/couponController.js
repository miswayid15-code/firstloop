const { Coupon, Merchant, Branch, CouponApplied, Customer, CouponCat } = require('../../models');
const { Op, Sequelize, where } = require('sequelize');
const baseUrl = process.env.APP_URL;

exports.fetch_coupon_categories = async (req, res) => {
    try {
        const categories = await CouponCat.findAll({
            where: {
                del_status: 0
            },
            attributes: ['id', 'name'],
            order: [['id', 'ASC']]
        });

        return res.json({
            status: 1,
            message: "Categories fetched successfully",
            data: categories
        });

    }
    catch (err) {
        console.log("FETCH ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });
    }
}


exports.create_coupon = async (req, res) => {

    try {

        let {
            code,
            percentage,
            min_amount,
            cat_id,
            usage_limit,
            start_date,
            branch_ids,
            end_date
        } = req.body;


        const merchant_id = req.user.id;


        if (!merchant_id) {

            return res.json({
                status: 0,
                message: "Merchant not found"
            });

        }


        if (typeof branch_ids === "string") {

            try {

                branch_ids = JSON.parse(branch_ids);

            } catch (err) {

                branch_ids = [];

            }

        }


        if (
            !code ||
            !percentage ||
            !start_date ||
            !end_date
        ) {

            return res.json({
                status: 0,
                message: "Required fields missing"
            });

        }


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


        if (
            Number(percentage) < 0 ||
            Number(percentage) > 100
        ) {

            return res.json({
                status: 0,
                message: "Percentage must be between 0 and 100"
            });

        }


        if (
            min_amount &&
            Number(min_amount) < 0
        ) {

            return res.json({
                status: 0,
                message: "Minimum amount must be greater than or equal to 0"
            });

        }


        if (
            usage_limit &&
            Number(usage_limit) < 0
        ) {

            return res.json({
                status: 0,
                message: "Usage limit must be greater than or equal to 0"
            });

        }


        if (start_date >= end_date) {

            return res.json({
                status: 0,
                message: "End time must be greater than start time"
            });

        }


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


        const bannerFile = req.files.find(
            file => file.fieldname === "banner_image"
        );

        const banner_image = bannerFile
            ? bannerFile.path.replace(/\\/g, '/')
            : null;

        const formatDate = (date) => {

            if (!date) return null;

            // already YYYY-MM-DD
            if (date.includes('/')) {

                const parts = date.split('/');

                return `${parts[2]}-${parts[1]}-${parts[0]}`;

            }

            if (date.includes('-')) {

                const parts = date.split('-');

                // DD-MM-YYYY
                if (parts[0].length === 2) {

                    return `${parts[2]}-${parts[1]}-${parts[0]}`;

                }

                // already YYYY-MM-DD
                return date;

            }

            return null;

        };

        start_date = formatDate(start_date);
        end_date = formatDate(end_date);

        // console.log(start_date);
        // console.log(end_date);

        const coupon = await Coupon.create({

            merchant_id: merchant_id,

            branch_ids: branch_ids,
            cat_id: cat_id,


            code: code,

            percentage: percentage,

            min_amount: min_amount || 0,

            usage_limit: usage_limit || 0,

            start_date: start_date,

            end_date: end_date,

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

        // console.log("ERROR MESSAGE:", err.message);
        // console.log("ERROR STACK:", err.stack);
        console.log("FULL ERROR:", err);

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
            cat_id,
            branch_ids,
            code,
            percentage,
            min_amount,
            usage_limit,
            start_date,
            end_date
        } = req.body;


        const merchant_id = req.user.id;


        if (!merchant_id) {

            return res.json({
                status: 0,
                message: "Merchant not found"
            });

        }


        if (typeof branch_ids === "string") {

            try {

                branch_ids = JSON.parse(branch_ids);

            } catch (err) {

                branch_ids = [];

            }

        }


        if (
            !coupon_id ||
            !code ||
            !percentage
            || !start_date ||
            !end_date
        ) {

            return res.json({
                status: 0,
                message: "Required fields missing"
            });

        }


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


        if (
            Number(percentage) < 0 ||
            Number(percentage) > 100
        ) {

            return res.json({
                status: 0,
                message: "Percentage must be between 0 and 100"
            });

        }


        if (
            min_amount &&
            Number(min_amount) < 0
        ) {

            return res.json({
                status: 0,
                message: "Minimum amount must be greater than or equal to 0"
            });

        }


        if (
            usage_limit &&
            Number(usage_limit) < 0
        ) {

            return res.json({
                status: 0,
                message: "Usage limit must be greater than or equal to 0"
            });

        }


        if (start_date >= end_date) {

            return res.json({
                status: 0,
                message: "End time must be greater than start time"
            });

        }


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


        let banner_image = exist_coupon.banner_image;

        const bannerFile = req.files.find(
            file => file.fieldname === "banner_image"
        );

        if (bannerFile) {

            banner_image = bannerFile.path.replace(/\\/g, '/');

        }



        const formatDate = (date) => {

            if (!date) return null;


            if (date.includes('/')) {

                const parts = date.split('/');

                return `${parts[2]}-${parts[1]}-${parts[0]}`;

            }


            if (date.includes('-')) {

                const parts = date.split('-');

                // already YYYY-MM-DD
                if (parts[0].length === 4) {

                    return date;

                }

                return `${parts[2]}-${parts[1]}-${parts[0]}`;

            }

            return null;

        };

        start_date = formatDate(start_date);
        end_date = formatDate(end_date);

        // console.log("START DATE:", start_date);
        // console.log("END DATE:", end_date);

        await exist_coupon.update({

            branch_ids: branch_ids,

            code: code,
            cat_id: cat_id,


            percentage: percentage,

            min_amount: min_amount || 0,

            usage_limit: usage_limit || 0,

            start_date: start_date,

            end_date: end_date,

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

// fetch coupon
exports.fetch_coupon = async (req, res) => {

    try {

        const merchant_id = req.user.id;
        const branch_id = req.query.branch_id;

        if (!merchant_id) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        const whereCondition = {
            del_status: 0,
            merchant_id: merchant_id
        };

        if (branch_id) {
            whereCondition.branch_ids = {
                [Op.contains]: [parseInt(branch_id)]
            };
        }

        const coupon = await Coupon.findAll({
            attributes: [
                'id',
                'merchant_id',
                'cat_id',
                'branch_ids',
                'code',
                'percentage',
                'min_amount',
                'usage_limit',
                'start_date',
                'banner_image',
                'end_date',
                'status'
            ],
            where: whereCondition,
            order: [['id', 'DESC']]
        });

        const branches = await Branch.findAll({
            attributes: ['id', 'name'],
            where: {
                merchant_id: merchant_id,
                del_status: 0
            }
        });

        const branchMap = {};
        branches.forEach(branch => {
            branchMap[branch.id] = branch.name;
        });

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

        const data = coupon.map(item => {

            const cpn = item.toJSON();

            cpn.banner_image = cpn.banner_image
                ? baseUrl + '/' + cpn.banner_image.replace(/\\/g, '/')
                : null;

            cpn.is_expired = new Date() > new Date(cpn.end_date) ? 1 : 0;

            cpn.applicable_to_all_branches = !cpn.branch_ids || cpn.branch_ids.length === 0;




            cpn.branches = [];
            if (cpn.branch_ids && cpn.branch_ids.length > 0) {
                cpn.branches = cpn.branch_ids
                    .filter(bid => branchMap[bid])
                    .map(bid => ({
                        id: bid,
                        name: branchMap[bid]
                    }));
            }
            delete cpn.branch_ids;
            return cpn;
        });

        return res.json({
            status: 1,
            message: "Coupon list fetched successfully",
            data: data,
            filters: {
                branch_id: branch_id || null
            }
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

exports.claim_coupon = async (req, res) => {

    try {

        const user = req.merchant || req.receptionist;

        const userType = req.merchant
            ? 'merchant'
            : 'receptionist';

        const {
            coupon_id,
            coupon_applied_id,
            status,
            cancel_reason
        } = req.body;

        if (
            !coupon_id ||
            status === undefined || !coupon_applied_id
        ) {

            return res.json({

                status: 0,
                message: "Coupon ID/RequestId and status are required"

            });

        }

        const couponExists = await Coupon.findOne({

            where: {
                id: coupon_id,
                del_status: 0
            }

        });

        if (!couponExists) {

            return res.json({

                status: 0,
                message: "Coupon not found"

            });

        }


        if (userType === 'merchant') {

            if (couponExists.merchant_id != user.id) {

                return res.json({

                    status: 0,
                    message: "You are not authorized to access this coupon"

                });

            }

        }


        if (userType === 'receptionist') {

            if (couponExists.merchant_id != user.merchant_id) {

                return res.json({

                    status: 0,
                    message: "You are not authorized to access this coupon"

                });

            }

            const branchIds = couponExists.branch_ids || [];

            if (!branchIds.includes(Number(user.branch_id))) {

                return res.json({

                    status: 0,
                    message: "This coupon is not assigned to your branch"

                });

            }

        }

        const coupon = await CouponApplied.findOne({

            where: {

                id: coupon_applied_id,
                coupon_id: coupon_id
            }

        });

        if (!coupon) {

            return res.json({

                status: 0,
                message: "Coupon Applied is not found"

            });

        }

        const updateData = {

            status: status

        };

        if (Number(status) === 1) {

            updateData.approved_by = userType;

            updateData.approved_by_id = user.id;
            updateData.used_at = new Date();

            updateData.cancel_by = null;

            updateData.cancel_reason = null;

        }

        if (Number(status) === 2) {

            updateData.cancel_by = userType;

            updateData.cancel_reason = cancel_reason || null;
            updateData.approved_by = null;
            updateData.approved_by_id = null;
            updateData.used_at = null;

        }

        await CouponApplied.update(
            updateData,
            {
                where: {
                    id: coupon_applied_id,
                    coupon_id: coupon_id
                }
            }
        );

        const updatedCoupon = await CouponApplied.findOne({

            where: {

                id: coupon_applied_id

            }

        });

        return res.json({

            status: 1,

            message: "Coupon Updated successfully",

            data: updatedCoupon

        });

    }

    catch (err) {

        console.log(
            "COUPON UPDATE ERROR:",
            err
        );

        return res.json({

            status: 0,

            message: err.message

        });

    }

};

exports.redeem_customer = async (req, res) => {

    try {

        const { br_id } = req.body;

        const user = req.merchant || req.receptionist;

        const userType = req.merchant
            ? 'merchant'
            : 'receptionist';

        const couponWhere = {
            del_status: 0
        };

        if (userType === 'merchant') {

            couponWhere.merchant_id = user.id;

        } else {

            couponWhere.merchant_id = user.merchant_id;

        }

        const couponApplieds = await CouponApplied.findAll({

            where: {
                del_status: 0
            },

            attributes: [
                'id',
                'coupon_code',
                'percentage',
                'cus_id',
                'coupon_id',
                'status',
                'approved_by',
                'approved_by_id',
                'branch_id',
                'cancel_by',
                'cancel_reason'
            ],

            include: [
                {
                    model: Coupon,
                    attributes: ['id', 'branch_ids'],
                    required: true,
                    where: {
                        ...couponWhere,

                        // Receptionist -> only own branch
                        ...(userType === 'receptionist' && {
                            branch_ids: {
                                [Op.contains]: [Number(user.branch_id)]
                            }
                        }),

                        // Merchant -> filter by selected branch
                        ...(userType === 'merchant' &&
                            br_id &&
                            Number(br_id) > 0 && {
                                branch_ids: {
                                    [Op.contains]: [Number(br_id)]
                                }
                            })
                    }
                },
                {
                    model: Customer,
                    attributes: [
                        'id',
                        'name',
                        'email',
                        'phone'
                    ],
                    required: false
                }
            ],

            order: [['id', 'DESC']]

        });

        // Get branch ids from CouponApplied.branch_id
        const allBranchIds = [];

        couponApplieds.forEach(item => {

            if (item.branch_id) {

                allBranchIds.push(item.branch_id);

            }

        });

        const branches = await Branch.findAll({

            where: {
                id: [...new Set(allBranchIds)]
            },

            attributes: [
                'id',
                'name'
            ]

        });

        const branchMap = {};

        branches.forEach(branch => {

            branchMap[branch.id] = branch.name;

        });

        const data = couponApplieds.map(item => {

            const row = item.toJSON();

            row.customer_name = row.Customer
                ? row.Customer.name
                : null;

            row.customer_email = row.Customer
                ? row.Customer.email
                : null;

            row.customer_phone = row.Customer
                ? row.Customer.phone
                : null;

            // Branch name from CouponApplied.branch_id
            row.branch_name = branchMap[row.branch_id] || null;

            delete row.Customer;
            delete row.Coupon;

            return row;

        });

        return res.json({

            status: 1,
            message: "Redeemed customers fetched successfully",
            data

        });

    } catch (err) {

        console.log(
            "REDEEM CUSTOMER ERROR:",
            err
        );

        return res.json({

            status: 0,
            message: err.message

        });

    }

};

exports.applied_coupons = async (req, res) => {

    try {

        const { branch_id } = req.body;

        if (!branch_id) {

            return res.json({
                status: 0,
                message: "Branch ID is required"
            });

        }

        const coupons = await CouponApplied.findAll({

            where: {
                del_status: 0
            },

            attributes: [
                'id',
                'cus_id',
                'coupon_id',
                'branch_id',
                'coupon_code',
                'percentage',
                'used_at',
                'approved_by',
                'approved_by_id',
                'cancel_by',
                'cancel_reason',
                'status'
            ],
            where: {
                branch_id: branch_id,
                del_status: 0
            },
            include: [

                {
                    model: Coupon,
                    attributes: [
                        // 'id',

                        // 'code'
                    ],
                    // where: Sequelize.literal(`${parseInt(branch_id)} = ANY("Coupon"."branch_ids")`),
                    required: true
                },

                {
                    model: Customer,
                    attributes: [
                        'id',
                        'name',

                    ],
                    required: false
                }

            ],

            order: [['id', 'DESC']]

        });

        return res.json({

            status: 1,

            message: "Applied coupons fetched successfully",

            data: coupons

        });

    } catch (err) {

        console.log("ERROR:", err);

        return res.json({

            status: 0,

            message: err.message

        });

    }

};


// fetch coupon details 
exports.fetch_coupon_by_id = async (req, res) => {

    try {

        const merchant_id = req.user.id;
        const coupon_id = req.params.id || req.query.id;

        if (!merchant_id) {
            return res.json({
                status: 0,
                message: "Merchant not found"
            });
        }

        if (!coupon_id) {
            return res.json({
                status: 0,
                message: "Coupon ID is required"
            });
        }

        const coupon = await Coupon.findOne({
            attributes: [
                'id',
                'merchant_id',
                'cat_id',
                'branch_ids',
                'code',
                'percentage',
                'min_amount',
                'usage_limit',
                'start_date',
                'banner_image',
                'end_date',
                'status'
            ],
            where: {
                id: coupon_id,
                merchant_id: merchant_id,
                del_status: 0
            }
        });

        if (!coupon) {
            return res.json({
                status: 0,
                message: "Coupon not found"
            });
        }

        const category = await CouponCat.findOne({
            attributes: ['id', 'name'],
            where: {
                id: coupon.cat_id,
                del_status: 0
            }
        });


        let branches = [];
        if (coupon.branch_ids && coupon.branch_ids.length > 0) {
            branches = await Branch.findAll({
                attributes: ['id', 'name'],
                where: {
                    id: { [Op.in]: coupon.branch_ids },
                    merchant_id: merchant_id,
                    del_status: 0
                },
                order: [['name', 'ASC']]
            });
        }

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

        const data = coupon.toJSON();

        data.banner_image = data.banner_image
            ? baseUrl + '/' + data.banner_image.replace(/\\/g, '/')
            : null;


        data.category = category ? {
            id: category.id,
            name: category.name
        } : null;

        data.branches = branches;


        delete data.branch_ids;

        return res.json({
            status: 1,
            message: "Coupon details fetched successfully",
            data: data
        });

    } catch (err) {

        console.log("FETCH COUPON BY ID ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });

    }

};