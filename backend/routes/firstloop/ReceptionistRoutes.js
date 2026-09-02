const express = require('express');

const router = express.Router();

const controller =
require('../../controllers/firstloop/ReceptionistController');

const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');
const checkMerchant = require('../../middleware/checkMerchant');

// login
router.post(
    '/login',
    controller.login
);


// logout
router.post(
    '/logout',
    auth('receptionist'),
    controller.logout
);
router.post(
    '/dashboard',
    auth('receptionist'),
    controller.dashboard
);

module.exports = router;