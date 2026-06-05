const express = require('express');

const router = express.Router();
const checkMerchantOrReceptionist = require('../../middleware/checkMerchantOrReceptionist'); 
const controller = require('../../controllers/api/additionalController');
const auth = require('../../middleware/auth');
router.get(
    '/banner-list',
    controller.banner_list
);
    router.post(
    '/register-otp',
    controller.verify_mail
);
    router.post(
    '/verify-otp',
    controller.verify_otp
);
module.exports = router;