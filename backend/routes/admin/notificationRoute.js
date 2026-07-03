const express = require('express');
const router = express.Router();

const controller = require('../../controllers/admin/NotificationController.js');
const upload = require('../../middleware/upload.js');
const auth = require('../../middleware/auth.js');

const checkAdmin = require('../../middleware/checkAdmin.js');

router.post(
    '/send-notification',
    auth('admin'), checkAdmin,
    controller.sendNotification
);

module.exports = router;