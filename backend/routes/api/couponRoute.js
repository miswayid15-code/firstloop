const express = require('express');
const router = express.Router();

const controller = require('../../controllers/api/couponController');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

const checkMerchant = require('../../middleware/checkMerchant'); 
const checkMerchantOrReceptionist = require('../../middleware/checkMerchantOrReceptionist'); 
const checkReceptionist = require('../../middleware/checkReceptionist'); 
const checkCustomer = require('../../middleware/checkCustomer'); 
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
router.get('/coupon-details/:id', auth('merchant'), controller.fetch_coupon_by_id);
router.get('/coupon-detail/:id',  controller.fetch_coupon_details_by_id);
router.post(
    '/coupon-claim',
    auth(),
    checkMerchantOrReceptionist,
    controller.claim_coupon
);
router.post('/redeem-customer',     auth(),
    checkMerchantOrReceptionist,controller.redeem_customer);

    router.get('/coupon-categories', controller.fetch_coupon_categories);


    router.post(
    '/applied-coupons',
    auth(),
    checkMerchantOrReceptionist,
    controller.applied_coupons
);
    router.delete(
    '/delete-coupons',
        auth('merchant'),
        checkMerchant,
    controller.delete_coupon
);

router.post(
    '/cancel-coupon',
    auth('customer'),
    checkCustomer,
    controller.cancel_coupon_by_customer
);
module.exports = router;