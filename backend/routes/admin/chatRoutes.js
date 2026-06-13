const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');
const controller = require('../../controllers/admin/chatController');

const checkAdmin = require('../../middleware/checkAdmin');

router.post('/chat/send', auth('admin'), checkAdmin, controller.sendMessage);
module.exports = router;