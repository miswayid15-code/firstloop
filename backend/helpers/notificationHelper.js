const axios = require("axios");

const sendPushNotification = async ({
    token,
    title,
    body,
    data = {},
    sound = "default",
    badge = 1,
}) => {
    try {
        if (!token) {
            return {
                success: 0,
                message: "Notification token is missing",
            };
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

        console.log("========== PUSH NOTIFICATION ==========");
        console.log(JSON.stringify(message, null, 2));

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

        console.log("Expo Response:");
        console.log(JSON.stringify(response.data, null, 2));
        console.log("======================================");

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

module.exports = {
    sendPushNotification,
};