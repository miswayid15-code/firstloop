const { UserNotificationToken } = require("../../models");
const axios = require("axios");

exports.sendNotification = async (req, res) => {
    try {
        const { users, title, body, data = {} } = req.body;

        // Validation
        if (
            !users ||
            !Array.isArray(users) ||
            users.length === 0 ||
            !title ||
            !body
        ) {
            return res.status(400).json({
                success: 0,
                message:
                    "users (array), title and body are required."
            });
        }

        // Get all notification tokens
        const tokens = await UserNotificationToken.findAll({
            where: {
                is_active: true
            }
        });

        // Filter only requested users
        const messages = [];

        for (const token of tokens) {
            const userExists = users.find(
                (u) =>
                    Number(u.user_id) === Number(token.user_id) &&
                    u.user_type === token.user_type
            );

            if (!userExists) continue;

            messages.push({
                to: token.token,
                title,
                body,
                sound: "default",
                badge: 1,
                data,
            });
        }

        if (messages.length === 0) {
            return res.status(404).json({
                success: 0,
                message: "No active notification tokens found."
            });
        }

        // Expo allows up to 100 messages per request
        const chunkSize = 100;
        const responses = [];

        for (let i = 0; i < messages.length; i += chunkSize) {
            const chunk = messages.slice(i, i + chunkSize);

            const response = await axios.post(
                "https://exp.host/--/api/v2/push/send",
                chunk,
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );

            responses.push(response.data);
        }

        return res.status(200).json({
            success: 1,
            message: `${messages.length} notification(s) sent successfully.`,
            data: responses,
        });

    } catch (err) {
        console.error("Notification Error:", err.response?.data || err.message);

        return res.status(500).json({
            success: 0,
            message: "Failed to send notifications.",
            error: err.response?.data || err.message,
        });
    }
};


