const express = require('express');
const router = express.Router();

const controller = require('../../controllers/api/CustomerController');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/customer/register', (req, res, next) => {
  req.uploadFolder = 'customer';
  next();
}, upload, controller.register);
router.post('/customer/logout', auth, controller.logout);
router.post('/customer/login', controller.login);
router.post('/customer/refreshAccessToken', auth, controller.refreshAccessToken);
router.post('/customer/forget-password', controller.forget_password);
router.post('/customer/reset-password', controller.reset_ps);
router.post(
    '/customer/update',
    auth,
      (req, res, next) => {
    req.uploadFolder = 'customer';
    next();
  },
    upload,
    controller.update
);
router.get('/customer/fetch-customer-by', auth, controller.fetch_list);
router.get(
    '/customer/home',
    controller.home
);

router.post(
    '/customer/home',
    auth,
    controller.home
);
router.get(
    '/branch-details',
    controller.branch_details
);
router.post(
   '/branch-details',
    auth,
    controller.branch_details
);
router.post(
   '/customer/coupon-apply',
    auth,
    controller.coupon_apply
);
router.post(
   '/customer/coupon-list',
    auth,
    controller.Coupon_list
);
router.post(
   '/customer/wishlist',
    auth,
    controller.wishlist 
);
router.post(
   '/customer/book-appointment',
    auth,
    controller.appointment 
);
router.get(
   '/customer/fetch-appointment',
    auth,
    controller.fetch_appointment 
);
router.post(
   '/customer/fetch-appointment-details',
    auth,
    controller.fetch_appointment_details 
);
module.exports = router;