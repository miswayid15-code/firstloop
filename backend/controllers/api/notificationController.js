
const { UserNotificationToken } = require('../../models');

const registerNotificationToken = async (req, res) => {
    try {
        const {
            user_id,
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

        // Check existing token for user
        const existing = await UserNotificationToken.findOne({
            where: {
                user_id: user_id
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

module.exports = {
    registerNotificationToken
};