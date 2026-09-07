const express = require('express');

const router = express.Router();

const controller =
require('../../controllers/firstloop/ReceptionistController');

const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');
const checkMerchant = require('../../middleware/checkMerchant');
const checkMerchantOrReceptionist = require('../../middleware/checkMerchantOrReceptionist'); 
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
router.post(
    '/scan-qr',
    auth(),checkMerchantOrReceptionist,
    controller.scan_qr
);
module.exports = router;