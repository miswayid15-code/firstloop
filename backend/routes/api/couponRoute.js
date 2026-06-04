const express = require('express');
const router = express.Router();

const controller = require('../../controllers/api/couponController');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

const checkMerchant = require('../../middleware/checkMerchant'); 
const checkMerchantOrReceptionist = require('../../middleware/checkMerchantOrReceptionist'); 
const checkReceptionist = require('../../middleware/checkReceptionist'); 

router.post(
    '/coupon-create',

  (req, res, next) => {
    req.uploadFolder = 'COUPON'; 
    next();
  },

  upload,

    auth('merchant'),

    controller.create_coupon
);
router.post('/coupon-update',  (req, res, next) => {
    req.uploadFolder = 'COUPON'; 
    next();
  },

  upload, auth('merchant'),controller.update_coupon);
router.get('/coupon-fetch', auth('merchant'),controller.fetch_coupon);
router.post('/coupon-check', auth('merchant'),controller.check_coupon);
router.post('/coupon-generate', auth('merchant'),controller.generate_coupon);

router.post(
    '/coupon-claim',
    auth(),
    checkMerchantOrReceptionist,
    controller.claim_coupon
);
router.get('/redeem-customer',     auth(),
    checkMerchantOrReceptionist,controller.redeem_customer);

    router.get('/coupon-categories', controller.fetch_coupon_categories);
module.exports = router;