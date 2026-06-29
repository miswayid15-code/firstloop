
const { UserNotificationToken } = require('../../models');
const axios = require('axios');
const registerNotificationToken = async (req, res) => {
    try {
        const {
            user_id,
            user_type,
            notification_token,
            platform = "unknown",
            device_name = "Unknown",
            app_version = "1.0.0"
        } = req.body;

        // Validate required fields
        if (!user_id || !notification_token) {
            return res.status(400).json({
                success: 0,
                message: "Missing user_id or notification_token"
            });
        }

        const existing = await UserNotificationToken.findOne({
            where: {
                user_id: user_id,
                user_type: user_type
            }
        });

        if (existing) {
            // Update existing token
            await existing.update({
                token: notification_token,
                platform,
                device_name,
                app_version,
                is_active: 1
            });

            return res.json({
                success: 1,
                message: "Token updated"
            });
        } else {
            // Create new token
            const newToken = await UserNotificationToken.create({
                user_id,
                user_type,
                token: notification_token,
                platform,
                device_name,
                app_version,
                is_active: 1
            });

            return res.json({
                success: 1,
                message: "Token registered",

            });
        }

    } catch (error) {
        console.error("Register Notification Token Error:", error);

        return res.status(500).json({
            success: 0,
            message: "Internal Server Error",
            error: error.message
        });
    }
};



const sendTestNotification = async (req, res) => {
    try {
        const token = req.body.token;
        if (!token) {
            return res.status(400).json({
                success: 0,
                message: "Notification token is Missing"
            });
        }
        const message = {
            to: token,
            title: "🎉 Test from Node.js!",
            body: "If you receive this, your setup is complete!",
            sound: "default",
            badge: 1,
            data: {
                test: true,
                timestamp: new Date().toISOString(),
            },
        };

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

        console.log("Notification sent:", response.data);

        return res.status(200).json({
            success: 1,
            message: "Notification sent successfully",
            data: response.data,
        });

    } catch (error) {

        console.error(
            "Notification error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: 0,
            message: "Failed to send notification",
            error: error.response?.data || error.message,
        });

    }
};


module.exports = {
    registerNotificationToken,
    sendTestNotification,
};