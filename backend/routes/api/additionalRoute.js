const express = require('express');

const router = express.Router();
const checkMerchantOrReceptionist = require('../../middleware/checkMerchantOrReceptionist'); 
const controller = require('../../controllers/api/additionalController');
const auth = require('../../middleware/auth');
router.post(
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
    router.post(
    '/customer/register-otp',
    controller.customer_verify_mail
);
    router.post(
    '/customer/verify-otp',
    controller.customer_verify_otp
);

router.post("/check-version", controller.checkVersion);
router.post("/check-merchant-version", controller.check_MerchantVersion);

module.exports = router;