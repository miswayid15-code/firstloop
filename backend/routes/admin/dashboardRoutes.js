const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');
const controller = require('../../controllers/admin/dashboardController');

const checkAdmin = require('../../middleware/checkAdmin');
router.post('/dashboard', auth('admin'), checkAdmin, controller.dashboard);


module.exports = router;