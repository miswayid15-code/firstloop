const axios = require("axios");
const { Notification,UserNotificationToken } = require("../models");
const sendPushNotification = async ({
    token,
    title,
    body,
    data = {},
    sound = "default",
    badge = 1,
    user_type = null,
    user_id = null,
    type = null,
    reference_id = null,
}) => {
    try {


        if (!token) {
            return {
                success: 0,
                message: "Notification token is missing",
            };
        }

        const tokenRecord = await UserNotificationToken.findOne({
            where: {
                token
            }
        });

        if (tokenRecord) {
            user_id = tokenRecord.user_id;
            user_type = tokenRecord.user_type;
        }
        if (user_type && user_id) {
            try {
                await Notification.create({
                    user_type,
                    user_id,
                    title,
                    body,
                     type: data.type||null,
                    reference_id:data.appointment_id||data.coupon_applied_id||null,
                    data,
                    is_read: false
                });
            } catch (err) {
                console.log("Notification DB Error:");
                console.log(err);
                console.log(err.message);
                console.log(err.errors);
            }
        }
        const message = {
            to: token,
            title,
            body,
            sound,
            badge,
            data: {
                ...data,
                timestamp: new Date().toISOString(),
            },
        };

        // console.log("========== PUSH NOTIFICATION ==========");
        // console.log(JSON.stringify(message, null, 2));

        const response = await axios.post(
            "https://exp.host/--/api/v2/push/send",
            [message],
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            }
        );

        // console.log("Expo Response:");
        // console.log(JSON.stringify(response.data, null, 2));
        // console.log("======================================");

        return {
            success: 1,
            message: "Notification sent successfully",
            data: response.data,
        };

    } catch (error) {

        console.error("========== PUSH NOTIFICATION ERROR ==========");
        console.error(error.response?.data || error.message);
        console.error("============================================");

        return {
            success: 0,
            message: "Failed to send notification",
            error: error.response?.data || error.message,
        };
    }
};

const NotificationTemplates = {
    appointment: {
        b2c: {
            pending: {
                title: "📅 Appointment Request",
                body: "Your appointment request has been submitted successfully."
            },
            approved: {
                title: "✅ Appointment Approved",
                body: "Your appointment has been approved."
            },
            cancelled: (cancelBy, reason) => ({
                title: " Appointment Cancelled",
                body: `Your appointment has been cancelled.${reason ? ` Reason: ${reason}` : ""}`
            })
        },

        b2b: {
            pending: {
                title: "📅 New Appointment",
                body: "A new appointment request has been received."
            },
            approved: {
                title: "✅ Appointment Approved",
                body: "The appointment request has been approved."
            },
            cancelled: (cancelBy, reason) => ({
                title: "❌ Appointment Cancelled",
                body: `Your appointment has been cancelled by ${cancelBy}.${reason ? ` Reason: ${reason}` : ""}`
            })
        }
    },

    coupon_redeem: {
        b2c: {
            pending: {
                title: "🎟️ Coupon Redemption",
                body: "Your coupon redemption request has been submitted."
            },
            approved: {
                title: "🎉 Coupon Redeemed",
                body: "Your coupon has been redeemed successfully."
            },
            cancelled: (reason) => ({
                title: "❌ Coupon Cancelled",
                body: `Your coupon redemption has been cancelled.${reason ? ` Reason: ${reason}` : ""}`
            })
        },

        b2b: {
            pending: {
                title: "🎟️ Coupon Redemption",
                body: "A customer has requested to redeem a coupon."
            },
            approved: {
                title: "✅ Coupon Redeemed",
                body: "The coupon redemption has been approved."
            },
            cancelled: (reason) => ({
                title: "❌ Coupon Redemption Cancelled",
                body: reason
                    ? `The coupon redemption was cancelled. Reason: ${reason}`
                    : "The coupon redemption was cancelled."
            })
        }
    }
};

const getNotificationTemplate = (
    event,
    audience,
    status,
    cancelBy = null,
    reason = null
) => {

    console.log("========== NOTIFICATION TEMPLATE ==========");
    console.log("Event:", event);
    console.log("Audience:", audience);
    console.log("Status:", status);
    console.log("Reason:", reason);

    const template = NotificationTemplates[event]?.[audience]?.[status];

    console.log("Template Found:", template);

    if (!template) {

        console.log("Using Default Notification");

        return {
            title: "🔔 Notification",
            body: "You have a new update."
        };
    }

    return typeof template === "function"
        ? template(cancelBy, reason)
        : template;

    console.log("Final Notification:", notification);
    console.log("==========================================");

    return notification;
};

module.exports = {
    sendPushNotification, getNotificationTemplate
};