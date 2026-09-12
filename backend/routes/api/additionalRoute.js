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
router.post(
    '/refreshAccessToken',
    controller.refreshAccessToken
);
router.post("/check-version", controller.checkVersion);
router.post("/check-merchant-version", controller.check_MerchantVersion);
router.post("/check-customer-version", controller.check_CustomerVersion);
router.post("/get-notification-list", controller.get_notification_list);
router.post("/update-notification-list", controller.update_notification);
router.post("/create_support", controller.create_support);
router.post("/check_account", controller.check_delete_account);
router.post("/check_status_account", controller.check_status_account);
module.exports = router;