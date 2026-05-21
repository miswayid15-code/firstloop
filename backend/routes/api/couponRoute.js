const express = require('express');
const router = express.Router();

const controller = require('../../controllers/api/couponController');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');



router.post(
    '/coupon-create',

  (req, res, next) => {
    req.uploadFolder = 'COUPON'; 
    next();
  },

  upload,

    auth,

    controller.create_coupon
);
router.post('/coupon-update',  (req, res, next) => {
    req.uploadFolder = 'COUPON'; 
    next();
  },

  upload, auth,controller.update_coupon);
router.get('/coupon-fetch', auth,controller.fetch_coupon);
router.post('/coupon-check', auth,controller.check_coupon);
router.post('/coupon-generate', auth,controller.generate_coupon);
module.exports = router;