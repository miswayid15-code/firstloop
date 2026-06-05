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
    auth(),
    checkMerchantOrReceptionist,
    controller.verify_mail
);
module.exports = router;