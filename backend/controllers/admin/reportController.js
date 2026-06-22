const {
    Merchant,
    Coupon,
    Branch,
    Appointment,
    CouponApplied,
    Receptionist,
    Category,
    sequelize,
    Customer
} = require('../../models');


const { Op, Sequelize } = require('sequelize');

exports.merchant_report = async (req, res) => {
    try {

        const { from_date, to_date, sort_by = 'newest' } = req.body;

        const merchants = await Merchant.findAll({
            where: { del_status: 0 },
            include: [
                {
                    model: Category,

                    attributes: ["id", "name"], // replace "name" with your category name column
                    required: false
                }
            ],
            raw: false
        });

        const formatDate = (date) => {
            if (!date) return null;

            const [day, month, year] = date.split('-');

            return new Date(`${year}-${month}-${day}T00:00:00`);
        };

        const formatEndDate = (date) => {
            if (!date) return null;

            const [day, month, year] = date.split('-');

            return new Date(`${year}-${month}-${day}T23:59:59`);
        };

        const fromDate = formatDate(req.body.from_date);
        const toDate = formatEndDate(req.body.to_date);

        const report = await Promise.all(
            merchants.map(async (merchant) => {

                const branches = await Branch.findAll({
                    where: {
                        merchant_id: merchant.id,
                        del_status: 0
                    },
                    attributes: ['id'],
                    raw: true
                });

                const branchIds = branches.map(x => x.id);

                const appointmentWhere = {
                    br_id: { [Op.in]: branchIds.length ? branchIds : [0] }
                };

                const couponAppliedWhere = {
                    branch_id: { [Op.in]: branchIds.length ? branchIds : [0] }
                };

                const couponWhere = {
                    merchant_id: merchant.id,
                    del_status: 0
                };

                if (fromDate && toDate) {
                    appointmentWhere.created_at = { [Op.between]: [fromDate, toDate] };
                    couponAppliedWhere.created_at = { [Op.between]: [fromDate, toDate] };
                    couponWhere.created_at = { [Op.between]: [fromDate, toDate] };
                } else if (fromDate) {
                    appointmentWhere.created_at = { [Op.gte]: fromDate };
                    couponAppliedWhere.created_at = { [Op.gte]: fromDate };
                    couponWhere.created_at = { [Op.gte]: fromDate };
                } else if (toDate) {
                    appointmentWhere.created_at = { [Op.lte]: toDate };
                    couponAppliedWhere.created_at = { [Op.lte]: toDate };
                    couponWhere.created_at = { [Op.lte]: toDate };
                }

                const [
                    totalAppointments,
                    totalCoupons,
                    totalCouponRedeemed,
                    totalReceptionists,
                    appointmentCustomers,
                    couponCustomers,
                    totalPendingAppointments,
                    totalApprovedAppointments,
                    totalCompletedAppointments,
                    totalCancelledAppointments,
                    totalRejectedAppointments,
                    totalActiveCoupons,
                    totalInactiveCoupons
                ] = await Promise.all([
                    Appointment.count({ where: appointmentWhere }),
                    Coupon.count({ where: couponWhere }),
                    CouponApplied.count({ where: couponAppliedWhere }),
                    Receptionist.count({
                        where: {
                            merchant_id: merchant.id,
                            del_status: 0
                        }
                    }),
                    Appointment.findAll({
                        where: appointmentWhere,
                        attributes: ['cus_id'],
                        raw: true
                    }),
                    CouponApplied.findAll({
                        where: couponAppliedWhere,
                        attributes: ['cus_id'],
                        raw: true
                    }),
                    Appointment.count({ where: { ...appointmentWhere, status: 0 } }),
                    Appointment.count({ where: { ...appointmentWhere, status: 1 } }),
                    Appointment.count({ where: { ...appointmentWhere, status: 2 } }),
                    Appointment.count({ where: { ...appointmentWhere, status: 3 } }),
                    Appointment.count({ where: { ...appointmentWhere, status: 4 } }),
                    Coupon.count({ where: { ...couponWhere, status: 1 } }),
                    Coupon.count({ where: { ...couponWhere, status: 0 } })
                ]);

                // Get unique customer ids from Appointment
                const appointmentCustomerIds = [
                    ...new Set(
                        appointmentCustomers
                            .map(x => Number(x.cus_id))
                            .filter(id => id)
                    )
                ];

                // Get unique customer ids from CouponApplied
                const couponCustomerIds = [
                    ...new Set(
                        couponCustomers
                            .map(x => Number(x.cus_id))
                            .filter(id => id)
                    )
                ];

                // Merge both arrays and remove duplicates
                const totalCustomers = [
                    ...new Set([
                        ...appointmentCustomerIds,
                        ...couponCustomerIds
                    ])
                ];

                return {
                    merchant_id: merchant.id,
                    merchant_name: merchant.business_name,
                    cat_id: merchant.cat_id,
                    cat_name: merchant.Category ? merchant.Category.name : "",
                    owner_name: merchant.name,
                    business_name: merchant.bus_name,
                    phone: merchant.phone,
                    email: merchant.email,
                    status: merchant.status,
                    created_at: merchant.createdAt,
                    total_branches: branchIds.length,
                    total_coupons: totalCoupons,
                    total_appointments: totalAppointments,
                    total_coupon_redeemed: totalCouponRedeemed,
                    total_customers: totalCustomers.length,
                    total_receptionists: totalReceptionists,
                    total_pending_appointments: totalPendingAppointments,
                    total_approved_appointments: totalApprovedAppointments,
                    total_completed_appointments: totalCompletedAppointments,
                    total_cancelled_appointments: totalCancelledAppointments,
                    total_rejected_appointments: totalRejectedAppointments,
                    total_active_coupons: totalActiveCoupons,
                    total_inactive_coupons: totalInactiveCoupons
                };
            })
        );

        switch (sort_by) {
            case 'oldest':
                report.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'highest_appointment':
                report.sort((a, b) => b.total_appointments - a.total_appointments);
                break;
            case 'lowest_appointment':
                report.sort((a, b) => a.total_appointments - b.total_appointments);
                break;
            case 'highest_coupon':
                report.sort((a, b) => b.total_coupons - a.total_coupons);
                break;
            case 'lowest_coupon':
                report.sort((a, b) => a.total_coupons - b.total_coupons);
                break;
            case 'highest_redeemed':
                report.sort((a, b) => b.total_coupon_redeemed - a.total_coupon_redeemed);
                break;
            case 'lowest_redeemed':
                report.sort((a, b) => a.total_coupon_redeemed - b.total_coupon_redeemed);
                break;
            case 'highest_customer':
                report.sort((a, b) => b.total_customers - a.total_customers);
                break;
            case 'lowest_customer':
                report.sort((a, b) => a.total_customers - b.total_customers);
                break;
            case 'highest_completed_appointment':
                report.sort((a, b) => b.total_completed_appointments - a.total_completed_appointments);
                break;
            case 'lowest_completed_appointment':
                report.sort((a, b) => a.total_completed_appointments - b.total_completed_appointments);
                break;
            case 'highest_pending_appointment':
                report.sort((a, b) => b.total_pending_appointments - a.total_pending_appointments);
                break;
            case 'lowest_pending_appointment':
                report.sort((a, b) => a.total_pending_appointments - b.total_pending_appointments);
                break;
            case 'highest_active_coupon':
                report.sort((a, b) => b.total_active_coupons - a.total_active_coupons);
                break;
            case 'lowest_active_coupon':
                report.sort((a, b) => a.total_active_coupons - b.total_active_coupons);
                break;
            default:
                report.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        return res.status(200).json({
            status: 1,
            message: 'Merchant report fetched successfully',
            total_records: report.length,
            data: report
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            status: 0,
            message: 'Network Issues',

        });
    }
};


exports.merchant_details_reports = async (req, res) => {
    try {
        const mer_id = parseInt(req.params.id, 10);

        if (!mer_id || isNaN(mer_id)) {
            return res.status(400).json({ status: 0, message: "Merchant ID is required" });
        }

        const { from_date, to_date } = req.body || req.query;

        const parseStartDate = (dateStr) => {
            if (!dateStr) return null;
            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts[0].length === 4) {
                    // YYYY-MM-DD
                    const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`);
                    return isNaN(d.getTime()) ? null : d;
                } else {
                    // DD-MM-YYYY
                    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
                    return isNaN(d.getTime()) ? null : d;
                }
            }
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? null : d;
        };

        const parseEndDate = (dateStr) => {
            if (!dateStr) return null;
            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts[0].length === 4) {
                    // YYYY-MM-DD
                    const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T23:59:59`);
                    return isNaN(d.getTime()) ? null : d;
                } else {
                    // DD-MM-YYYY
                    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T23:59:59`);
                    return isNaN(d.getTime()) ? null : d;
                }
            }
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                d.setHours(23, 59, 59, 999);
                return d;
            }
            return null;
        };

        const fromDate = parseStartDate(from_date);
        const toDate = parseEndDate(to_date);

        const merchant = await Merchant.findOne({
            where: { id: mer_id, del_status: 0 },
            include: [{ model: Category, attributes: ["id", "name"], required: false }],
        });

        if (!merchant) {
            return res.status(404).json({ status: 0, message: "Merchant not found" });
        }

        const branches = await Branch.findAll({
            where: { merchant_id: mer_id, del_status: 0 },
            attributes: ["id", "name"],
            raw: true,
        });

        const branchIds = branches.map((x) => Number(x.id));
        const safeBranchIds = branchIds.length ? branchIds : [0];

        const buildDateFilter = (field) => {
            if (fromDate && toDate) return { [field]: { [Op.between]: [fromDate, toDate] } };
            if (fromDate) return { [field]: { [Op.gte]: fromDate } };
            if (toDate) return { [field]: { [Op.lte]: toDate } };
            return {};
        };

        const appointmentWhere = { br_id: { [Op.in]: safeBranchIds }, ...buildDateFilter("created_at") };
        const couponAppliedWhere = { branch_id: { [Op.in]: safeBranchIds }, ...buildDateFilter("created_at") };
        const couponWhere = { merchant_id: mer_id, del_status: 0, ...buildDateFilter("created_at") };

        // ── Summary counts ────────────────────────────────────────────────────
        const [
            totalAppointments,
            totalCoupons,
            totalCouponRedeemed,
            totalReceptionists,
            appointmentCustomers,
            couponCustomers,
            totalPendingAppointments,
            totalApprovedAppointments,
            totalCompletedAppointments,
            totalCancelledAppointments,
            totalRejectedAppointments,
            totalActiveCoupons,
            totalInactiveCoupons,
        ] = await Promise.all([
            Appointment.count({ where: appointmentWhere }),
            Coupon.count({ where: couponWhere }),
            CouponApplied.count({ where: couponAppliedWhere }),
            Receptionist.count({ where: { merchant_id: mer_id, del_status: 0 } }),
            Appointment.findAll({ where: appointmentWhere, attributes: ["cus_id"], raw: true }),
            CouponApplied.findAll({ where: couponAppliedWhere, attributes: ["cus_id"], raw: true }),
            Appointment.count({ where: { ...appointmentWhere, status: 0 } }),
            Appointment.count({ where: { ...appointmentWhere, status: 1 } }),
            Appointment.count({ where: { ...appointmentWhere, status: 2 } }),
            Appointment.count({ where: { ...appointmentWhere, status: 3 } }),
            Appointment.count({ where: { ...appointmentWhere, status: 4 } }),
            Coupon.count({ where: { ...couponWhere, status: 1 } }),
            Coupon.count({ where: { ...couponWhere, status: 0 } }),
        ]);

        const totalCustomers = [
            ...new Set([
                ...appointmentCustomers.map((x) => Number(x.cus_id)).filter(Boolean),
                ...couponCustomers.map((x) => Number(x.cus_id)).filter(Boolean),
            ]),
        ];

        // ── Graph: Coupons applied per day per branch ─────────────────────────
        const couponAppliedGraph = await CouponApplied.findAll({
            where: couponAppliedWhere,
            attributes: [
                "branch_id",
                [sequelize.fn("DATE", sequelize.col("CouponApplied.created_at")), "date"],
                [sequelize.fn("COUNT", sequelize.col("CouponApplied.id")), "count"],
            ],
            group: ["branch_id", sequelize.fn("DATE", sequelize.col("CouponApplied.created_at"))],
            order: [["branch_id", "ASC"], [sequelize.fn("DATE", sequelize.col("CouponApplied.created_at")), "ASC"]],
            raw: true,
        });

        // ── Graph: Appointments per day per branch ────────────────────────────
        const appointmentGraph = await Appointment.findAll({
            where: appointmentWhere,
            attributes: [
                "br_id",
                [sequelize.fn("DATE", sequelize.col("Appointment.created_at")), "date"],
                [sequelize.fn("COUNT", sequelize.col("Appointment.id")), "count"],
            ],
            group: ["br_id", sequelize.fn("DATE", sequelize.col("Appointment.created_at"))],
            order: [["br_id", "ASC"], [sequelize.fn("DATE", sequelize.col("Appointment.created_at")), "ASC"]],
            raw: true,
        });

        // ── Pie: Per-branch breakdown ─────────────────────────────────────────
        const branchAppointmentCounts = await Appointment.findAll({
            where: appointmentWhere,
            attributes: [
                "br_id",
                [sequelize.fn("COUNT", sequelize.col("Appointment.id")), "appointment_count"],
            ],
            group: ["br_id"],
            raw: true,
        });

        const branchCouponCounts = await CouponApplied.findAll({
            where: couponAppliedWhere,
            attributes: [
                "branch_id",
                [sequelize.fn("COUNT", sequelize.col("CouponApplied.id")), "coupon_count"],
            ],
            group: ["branch_id"],
            raw: true,
        });

        // ── List: CouponApplied records ───────────────────────────────────────
        const couponAppliedList = await CouponApplied.findAll({
            where: couponAppliedWhere,
            attributes: ["id", "cus_id", "coupon_id", "branch_id", "coupon_code", "percentage", "used_at", "approved_by", "status", "created_at"],
            include: [
                {
                    model: Customer,
                    attributes: ["id", "name"],
                }
            ],
            order: [["created_at", "DESC"]],
        });

        // ── List: Appointment records ─────────────────────────────────────────
        const appointmentList = await Appointment.findAll({
            where: appointmentWhere,
            attributes: ["id", "cus_id", "br_id", "br_name", "appointment_date", "slot", "status", "cancel_by", "cancel_reason", "approved_by", "created_at"],
            include: [
                {
                    model: Customer,
                    attributes: ["id", "name"],
                }
            ],
            order: [["created_at", "DESC"]],
        });

        // ── Build branch map ──────────────────────────────────────────────────
        const branchMap = {};
        branches.forEach((b) => (branchMap[Number(b.id)] = b.name || `Branch ${b.id}`));

        // ── Build per-branch pie ──────────────────────────────────────────────
        const branchPie = branchIds.map((bid) => {
            const appt = branchAppointmentCounts.find((x) => Number(x.br_id) === bid);
            const coup = branchCouponCounts.find((x) => Number(x.branch_id) === bid);
            return {
                branch_id: bid,
                branch_name: branchMap[bid],
                appointment_count: appt ? parseInt(appt.appointment_count) : 0,
                coupon_count: coup ? parseInt(coup.coupon_count) : 0,
            };
        });

        // ── Generate all dates in range to fill missing days with 0 ──────────
        const getDatesInRange = (start, end, graphData) => {
            if (!start && !end) {
                // Find all unique dates in the database results
                const uniqueDates = new Set();
                graphData.forEach(g => {
                    if (g.date) uniqueDates.add(g.date);
                });
                const sorted = Array.from(uniqueDates).sort();
                if (sorted.length > 1) return sorted;

                // Default to last 7 days ending today
                const dates = [];
                const today = new Date();
                today.setHours(0,0,0,0);
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const yr = d.getFullYear();
                    const mo = String(d.getMonth() + 1).padStart(2, '0');
                    const dy = String(d.getDate()).padStart(2, '0');
                    dates.push(`${yr}-${mo}-${dy}`);
                }
                return dates;
            }

            const dates = [];
            const current = new Date(start);
            const stop = new Date(end);
            while (current <= stop) {
                const yr = current.getFullYear();
                const mo = String(current.getMonth() + 1).padStart(2, '0');
                const dy = String(current.getDate()).padStart(2, '0');
                dates.push(`${yr}-${mo}-${dy}`);
                current.setDate(current.getDate() + 1);
            }
            return dates;
        };

        const allDates = getDatesInRange(fromDate, toDate, [...couponAppliedGraph, ...appointmentGraph.map(g => ({ date: g.date }))]);

        // ── Build per-branch graphs ───────────────────────────────────────────
        const branchGraphs = branchIds.map((bid) => {
            const coupMap = Object.fromEntries(
                couponAppliedGraph.filter((r) => Number(r.branch_id) === bid).map((r) => [r.date, parseInt(r.count)])
            );
            const apptMap = Object.fromEntries(
                appointmentGraph.filter((r) => Number(r.br_id) === bid).map((r) => [r.date, parseInt(r.count)])
            );

            return {
                branch_id: bid,
                branch_name: branchMap[bid],
                coupon_applied_per_day: allDates.map((date) => ({
                    date,
                    count: coupMap[date] || 0,
                })),
                appointments_per_day: allDates.map((date) => ({
                    date,
                    count: apptMap[date] || 0,
                })),
            };
        });

        return res.status(200).json({
            status: 1,
            message: "Merchant report fetched successfully",
            data: {
                merchant_id: Number(merchant.id),
                merchant_name: merchant.bus_name,
                cat_id: merchant.cat_id,
                cat_name: merchant.Category?.name || "",
                owner_name: merchant.name,
                business_name: merchant.bus_name,
                phone: merchant.phone,
                email: merchant.email,
                status: merchant.status,
                created_at: merchant.createdAt,
                total_branches: branchIds.length,
                total_coupons: totalCoupons,
                total_appointments: totalAppointments,
                total_coupon_redeemed: totalCouponRedeemed,
                total_customers: totalCustomers.length,
                total_receptionists: totalReceptionists,
                total_pending_appointments: totalPendingAppointments,
                total_approved_appointments: totalApprovedAppointments,
                total_completed_appointments: totalCompletedAppointments,
                total_cancelled_appointments: totalCancelledAppointments,
                total_rejected_appointments: totalRejectedAppointments,
                total_active_coupons: totalActiveCoupons,
                total_inactive_coupons: totalInactiveCoupons,
                graphs: branchGraphs,
                branch_pie: branchPie,
                lists: {
                    coupon_applied: couponAppliedList,
                    appointments: appointmentList,
                },
            },
        });
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ status: 0, message: "Network Issues", error: err.message });
    }
};