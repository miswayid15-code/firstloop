const { Coupon, Merchant, Branch, CouponApplied, Customer, CouponCat, UserNotificationToken } = require('../../models');
const { Op, Sequelize, where } = require('sequelize');
const baseUrl = process.env.APP_URL;
const { sendPushNotification, getNotificationTemplate } = require("../../helpers/notificationHelper");
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
            description,
            percentage,
            min_amount,
            cat_id,
            usage_limit,
            start_date,
            branch_ids,
            end_date,
            type,
            buy_item,
            get_item
        } = req.body;
        type = Number(type ?? 1);

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
        if (![1, 2, 3].includes(Number(type))) {
            return res.json({
                status: 0,
                message: "Invalid coupon type"
            });
        }
        console.log("Typesss", type)
        if (Number(type) !== 3) {

            if (!percentage) {
                return res.json({
                    status: 0,
                    message: "Discount value is required"
                });
            }

        }
        if (Number(type) === 3) {

            if (!buy_item || !get_item) {
                return res.json({
                    status: 0,
                    message: "Buy and Get fields are required"
                });
            }

        }

        // const coupon_check = await Coupon.findOne({

        //     where: {
        //         code: code
        //     }

        // });

        // if (coupon_check) {

        //     return res.json({
        //         status: 0,
        //         message: "Coupon already exists"
        //     });

        // }

        if (type == 1) {
            if (
                Number(percentage) < 0 ||
                Number(percentage) > 100
            ) {

                return res.json({
                    status: 0,
                    message: "Percentage must be between 0 and 100"
                });

            }
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


        // const bannerFile = req.files.find(
        //     file => file.fieldname === "banner_image"
        // );

        // const banner_image = bannerFile
        //     ? bannerFile.path.replace(/\\/g, '/')
        //     : null;

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
            description,
            type,

            percentage: percentage,
            percentage: Number(type) === 3 ? 0 : percentage,

            buy_item: Number(type) === 3 ? buy_item : null,

            get_item: Number(type) === 3 ? get_item : null,

            min_amount: min_amount || 0,

            usage_limit: usage_limit || 0,

            start_date: start_date,

            end_date: end_date,

            // banner_image: banner_image,
            banner_image: null,

            status: 1,

            del_status: 0

        });
        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant_id,
                user_type: "merchant"
            }
        });



        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "🎉 Coupon Created!",
                body: `Your coupon "${code}" has been created successfully.`,
                data: {
                    type: "coupon_list",
                }
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }
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
            description,
            branch_ids,
            code,
            percentage,
            min_amount,
            usage_limit,
            start_date,
            end_date,
            type,
            buy_item,
            get_item, status
        } = req.body;

        const merchant_id = req.user.id;

        type = Number(type || 1);

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

        if (![1, 2, 3].includes(type)) {
            return res.json({
                status: 0,
                message: "Invalid coupon type"
            });
        }

        if (type !== 3 && !percentage) {
            return res.json({
                status: 0,
                message: "Discount value is required"
            });
        }

        if (type === 3 && (!buy_item || !get_item)) {
            return res.json({
                status: 0,
                message: "Buy and Get fields are required"
            });
        }

        const exist_coupon = await Coupon.findOne({
            where: {
                id: coupon_id,
                merchant_id,
                del_status: 0
            }
        });

        if (!exist_coupon) {
            return res.json({
                status: 0,
                message: "Coupon not found"
            });
        }

        // const coupon_check = await Coupon.findOne({
        //     where: {
        //         code,
        //         id: {
        //             [Op.ne]: coupon_id
        //         }
        //     }
        // });

        // if (coupon_check) {
        //     return res.json({
        //         status: 0,
        //         message: "Coupon already exists"
        //     });
        // }
        if (type == 1) {


            if (
                (Number(percentage) < 0 || Number(percentage) > 100)
            ) {
                return res.json({
                    status: 0,
                    message: "Percentage must be between 0 and 100"
                });
            }
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

        // if (
        //     usage_limit &&
        //     Number(usage_limit) < 0
        // ) {
        //     return res.json({
        //         status: 0,
        //         message: "Usage limit must be greater than or equal to 0"
        //     });
        // }

        const formatDate = (date) => {

            if (!date) return null;

            if (date.includes('/')) {
                const parts = date.split('/');
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }

            if (date.includes('-')) {
                const parts = date.split('-');

                if (parts[0].length === 4) {
                    return date;
                }

                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }

            return null;
        };

        start_date = formatDate(start_date);
        end_date = formatDate(end_date);

        if (start_date >= end_date) {
            return res.json({
                status: 0,
                message: "End date must be greater than start date"
            });
        }

        const valid_branches = await Branch.findAll({
            where: {
                id: branch_ids,
                merchant_id,
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

        let banner_image = exist_coupon.banner_image;

        const bannerFile = req.files?.find(
            file => file.fieldname === "banner_image"
        );

        if (bannerFile) {
            banner_image = bannerFile.path.replace(/\\/g, '/');
        }

        await exist_coupon.update({

            branch_ids,

            cat_id,

            code,

            description,

            type,

            percentage: type === 3 ? 0 : Number(percentage),

            buy_item: type === 3 ? buy_item : null,

            get_item: type === 3 ? get_item : null,

            min_amount: min_amount || 0,

            usage_limit: usage_limit || 0,

            start_date,

            end_date,

            banner_image,
            status

        });
        const notificationToken = await UserNotificationToken.findOne({
            where: {
                user_id: merchant_id,
                user_type: "merchant"
            }
        });



        try {
            const result = await sendPushNotification({
                token: notificationToken?.token,
                title: "🎉 Coupon updated!",
                body: `Your coupon "${code}" has been updated successfully.`,
                data: {
                    type: "coupon_list",
                }
            });


        } catch (error) {
            console.error("Push Notification Error:", error);
        }
        return res.json({
            status: 1,
            message: "Coupon updated successfully",
            data: exist_coupon
        });

    } catch (err) {

        console.log(err);

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
                'status',
                'description',
                'type',
                'buy_item',
                'get_item'

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

        // const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

        const data = coupon.map(item => {

            const cpn = item.toJSON();

            // cpn.banner_image = cpn.banner_image
            //     ? baseUrl + '/' + cpn.banner_image.replace(/\\/g, '/')
            //     : null;

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


exports.fetch_coupon_details = async (req, res) => {
    try {

        const coupon_id = req.body.coupon_id;


        if (!coupon_id) {
            return res.json({
                status: 0,
                message: "coupon_id is not empty"
            });
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
                'status',
                'description',
                'type',
                'buy_item',
                'get_item'
            ],
            where: {
                id: coupon_id
            },
            order: [['id', 'DESC']]
        });
        if (!coupon) {
            return res.status(401).json({
                status: 0,
                message: "Coupon is no found"
            })
        }
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
    }
    catch (err) {
        console.log("err", err);
        return res.status(401).json({
            status: 0,
            message: err.message
        })
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
        let notification = null;

        if (Number(status) === 1) {

            updateData.approved_by = userType;

            updateData.approved_by_id = user.id;
            updateData.used_at = new Date();

            updateData.cancel_by = null;

            updateData.cancel_reason = null;
            notification = "approved";

        }

        if (Number(status) === 2) {

            updateData.cancel_by = userType;

            updateData.cancel_reason = cancel_reason || null;
            updateData.approved_by = null;
            updateData.approved_by_id = null;
            updateData.used_at = null;
            notification = "cancelled";

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

        // ================= Notifications =================

        const customerNotification = getNotificationTemplate(
            "coupon_redeem",
            "b2c",
            notification,
            notification === "cancelled" ? userType : null,
            notification === "cancelled" ? cancel_reason : null
        );

        const merchantNotification = getNotificationTemplate(
            "coupon_redeem",
            "b2b",
            notification === "cancelled" ? userType : null,
            notification === "cancelled" ? cancel_reason : null
        );

        const receptionistNotification = getNotificationTemplate(
            "coupon_redeem",
            "b2b",
            notification === "cancelled" ? userType : null,
            notification === "cancelled" ? cancel_reason : null
        );

        const notificationData = {
            type: "coupon_redeem",
            coupon_id: coupon.id,
            coupon_applied_id: coupon.id,
        };

        if (notification === "cancelled") {
            notificationData.cancel_by = userType;
            notificationData.cancel_reason = cancel_reason || "";
        }

        // ================= Customer =================
        try {

            const customerToken = await UserNotificationToken.findOne({
                where: {
                    user_id: coupon.cus_id,
                    user_type: "customer",
                },
            });

            if (customerToken?.token) {
                try {
                    await sendPushNotification({
                        token: customerToken.token,
                        ...customerNotification,
                        data: notificationData,
                    });
                }
                catch (err) {
                    console.error("Error sending customer notification:", err);
                }

            } else {
                console.log("Customer token not found.");
            }

        } catch (err) {
            console.error("Customer Notification Error:", err);
        }

        // ================= Logged-in Merchant / Receptionist =================
        try {

            const userToken = await UserNotificationToken.findOne({
                where: {
                    user_id: user.id,
                    user_type: userType,
                },
            });

            const notificationTemplate =
                userType === "merchant"
                    ? merchantNotification
                    : receptionistNotification;

            if (userToken?.token) {
                try {
                    await sendPushNotification({
                        token: userToken.token,
                        ...notificationTemplate,
                        data: notificationData,
                    });
                } catch (err) {
                    console.log("Error sending notification to logged-in user:", err);
                }

            } else {
                console.log(`${userType} token not found.`);
            }

        } catch (err) {
            console.error(`${userType} Notification Error:`, err);
        }
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

        console.log("============= REDEEM CUSTOMER API =============");
        console.log("Request Body:", JSON.stringify(req.body, null, 2));

        const { br_id } = req.body;

        console.log("Branch ID:", br_id);

        const user = req.merchant || req.receptionist;

        console.log("Logged User:", JSON.stringify(user, null, 2));

        const userType = req.merchant ? "merchant" : "receptionist";

        console.log("User Type:", userType);

        const couponWhere = {};

        if (userType === "merchant") {
            couponWhere.merchant_id = user.id;
        } else {
            couponWhere.merchant_id = user.merchant_id;
        }

        console.log("Coupon Where:", JSON.stringify(couponWhere, null, 2));

        if (userType === "receptionist") {
            console.log("Filtering Coupon Branch:", user.branch_id);
        }

        if (userType === "merchant") {
            console.log("Selected Branch:", br_id);
        }

        console.log("Fetching CouponApplied...");

        const couponApplieds = await CouponApplied.findAll({

            where: {
                del_status: 0
            },

            attributes: [
                "id",
                "coupon_code",
                "percentage",
                "cus_id",
                "coupon_id",
                "status",
                "approved_by",
                "approved_by_id",
                "branch_id",
                "cancel_by",
                "cancel_reason"
            ],

            include: [
                {
                    model: Coupon,
                    required: true,
                    attributes: [
                        "id",
                        "branch_ids",
                        "merchant_id",
                        "type",
                        "buy_item",
                        "get_item"
                    ],
                    where: {
                        ...couponWhere,

                        ...(userType === "receptionist" && {
                            branch_ids: {
                                [Op.contains]: [Number(user.branch_id)]
                            }
                        }),

                        ...(userType === "merchant" &&
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
                    required: false,
                    attributes: [
                        "id",
                        "name",
                        "email",
                        "phone"
                    ]
                }
            ],

            order: [["id", "DESC"]]

        });

        console.log("CouponApplied Count:", couponApplieds.length);

        console.log(
            "CouponApplied Data:",
            JSON.stringify(couponApplieds, null, 2)
        );

        const allBranchIds = [];

        couponApplieds.forEach(item => {
            console.log(
                `CouponApplied ${item.id} -> Branch ID:`,
                item.branch_id
            );

            if (item.branch_id) {
                allBranchIds.push(item.branch_id);
            }
        });

        console.log("Collected Branch IDs:", allBranchIds);

        const uniqueBranchIds = [...new Set(allBranchIds)];

        console.log("Unique Branch IDs:", uniqueBranchIds);

        const branches = await Branch.findAll({

            where: {
                id: uniqueBranchIds
            },

            attributes: [
                "id",
                "name"
            ]

        });

        console.log(
            "Branches:",
            JSON.stringify(branches, null, 2)
        );

        const branchMap = {};

        branches.forEach(branch => {
            branchMap[branch.id] = branch.name;
        });

        console.log("Branch Map:", branchMap);

        const data = couponApplieds.map(item => {

            const row = item.toJSON();

            console.log("Processing CouponApplied ID:", row.id);

            row.customer_name = row.Customer
                ? row.Customer.name
                : null;

            row.customer_email = row.Customer
                ? row.Customer.email
                : null;

            row.customer_phone = row.Customer
                ? row.Customer.phone
                : null;

            row.branch_name = branchMap[row.branch_id] || null;

            row.type = row.Coupon
                ? row.Coupon.type
                : null;

            row.buy_item = row.Coupon
                ? row.Coupon.buy_item
                : null;

            row.get_item = row.Coupon
                ? row.Coupon.get_item
                : null;

            delete row.Customer;
            delete row.Coupon;

            console.log(
                "Final Row:",
                JSON.stringify(row, null, 2)
            );

            return row;
        });

        console.log("Final Response Count:", data.length);
        console.log(
            "Final Response:",
            JSON.stringify(data, null, 2)
        );

        console.log("============= API END =============");

        return res.json({
            status: 1,
            message: "Redeemed customers fetched successfully",
            data
        });

    } catch (err) {

        console.log("============= API ERROR =============");
        console.error(err);

        if (err.sql) {
            console.log("SQL:", err.sql);
        }

        if (err.parameters) {
            console.log("SQL Parameters:", err.parameters);
        }

        console.log("Stack:", err.stack);

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
                'status',
                'description',
                'type',
                'buy_item',
                'get_item'
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

exports.fetch_coupon_details_by_id = async (req, res) => {

    try {


        const coupon_id = req.params.id || req.query.id;


        if (!coupon_id) {
            return res.json({
                status: 0,
                message: "Coupon ID is required"
            });
        }

        const coupon = await Coupon.findOne({
            attributes: [
                'id',

                'cat_id',
                'branch_ids',
                'code',
                'percentage',
                'min_amount',
                'usage_limit',
                'start_date',
                'banner_image',
                'end_date',
                'status',
                'description',
                'type',
                'buy_item',
                'get_item'
            ],
            where: {
                id: coupon_id,

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




        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

        const data = coupon.toJSON();

        data.banner_image = data.banner_image
            ? baseUrl + '/' + data.banner_image.replace(/\\/g, '/')
            : null;


        data.category = category ? {
            id: category.id,
            name: category.name
        } : null;



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

exports.delete_coupon = async (req, res) => {

    try {

        const { coupon_id } = req.body;

        if (!coupon_id) {

            return res.json({
                status: 0,
                message: "Coupon ID required"
            });

        }

        const coupon = await Coupon.findOne({

            where: {
                id: coupon_id,
                del_status: 0
            }

        });

        if (!coupon) {

            return res.json({
                status: 0,
                message: "Coupon not found"
            });

        }

        // Delete banner image from uploads
        if (coupon.banner_image) {

            const imagePath = path.join(
                process.cwd(),
                coupon.banner_image
            );

            if (fs.existsSync(imagePath)) {

                fs.unlinkSync(imagePath);

            }

        }

        await coupon.update({

            del_status: 1

        });

        return res.json({

            status: 1,
            message: "Coupon deleted successfully"

        });

    }

    catch (err) {

        console.log("DELETE ERROR:", err);

        return res.json({

            status: 0,
            message: err.message

        });

    }

};


exports.delete_coupon_applied = async (req, res) => {
    try {

        const customer = req.customer;

        const { coupon_applied_id, cancel_reason } = req.body;

        if (!coupon_applied_id) {
            return res.json({
                status: 0,
                message: "Coupon request ID is required"
            });
        }

        const couponApplied = await CouponApplied.findOne({
            where: {
                id: coupon_applied_id,
                cus_id: customer.id
            }
        });

        if (!couponApplied) {
            return res.json({
                status: 0,
                message: "Coupon request not found"
            });
        }

        // Only pending coupons can be cancelled
        // if (couponApplied.status !== 0) {
        //     return res.json({
        //         status: 0,
        //         message: "Only pending coupon requests can be cancelled"
        //     });
        // }

        await CouponApplied.update(
            {
                del_status: 1,
                cancel_reason: cancel_reason || null,
                approved_by: null,
                approved_by_id: null,
                used_at: null
            },
            {
                where: {
                    id: coupon_applied_id
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
            message: "Coupon cancelled successfully",
            data: updatedCoupon
        });

    } catch (err) {

        console.log("CUSTOMER CANCEL COUPON ERROR:", err);

        return res.json({
            status: 0,
            message: err.message
        });
    }
};