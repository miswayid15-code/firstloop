const express = require("express");
const router = express.Router();

const controller = require("../../controllers/api/notificationController");

router.post(
    "/register-notification-token",
    controller.registerNotificationToken
);
router.post(
    "/send-notification",
    controller.sendTestNotification
);

module.exports = router;