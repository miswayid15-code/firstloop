const express = require('express');
const router = express.Router();

const controller = require('../../controllers/api/CustomerController');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');
const optionalAuth = require('../../middleware/optionalAuth');
const baseUrl = process.env.APP_URL;
const checkCustomer = require('../../middleware/checkCustomer'); 

router.post('/customer/register', (req, res, next) => {
  req.uploadFolder = 'customer';
  next();
}, upload, controller.register);
router.post('/customer/logout', auth('customer'), controller.logout);
router.post('/customer/login', controller.login);
router.post('/customer/refreshAccessToken', controller.refreshAccessToken);
router.post('/customer/forget-password', controller.forget_password);
router.post('/customer/reset-password', controller.reset_ps);
router.post(
    '/customer/update',
    auth('customer'),
      (req, res, next) => {
    req.uploadFolder = 'customer';
    next();
  },
    upload,
    controller.update
);
router.get('/customer/fetch-customer-by', auth('customer'), controller.fetch_list);
router.get(
    '/customer/home',
    controller.home
);

router.post(
    '/customer/home',
    auth('customer'),
    controller.home
);
router.get(
    '/branch-details',
        auth('customer'),
    controller.branch_details
);
router.post(
   '/branch-details',
    optionalAuth,
    controller.branch_details
);
router.post(
   '/customer/coupon-apply',
    auth('customer'),
    controller.coupon_apply
);
router.post(
   '/customer/coupon-list',
    auth('customer'),
    controller.Coupon_list
);
router.post(
   '/claim-coupon-details',
    auth('customer'),
    controller.claim_coupon_details
);
router.post(
   '/customer/wishlist',
    auth('customer'),
    controller.wishlist 
);
router.post(
   '/customer/book-appointment',
    auth('customer'),
    controller.appointment 
);
router.get(
   '/customer/fetch-appointment',
    auth('customer'),
    controller.fetch_appointment 
);
router.post(
   '/customer/fetch-appointment-details',
    auth('customer'),
    controller.fetch_appointment_details 
);
router.post(
   '/customer/search',
    auth('customer'),
    controller.search 
);
router.post(
   '/customer/merchants',
    auth('customer'),
    controller.merchants 
);

router.get(
   '/fetch-wishlist',
    auth(),
    checkCustomer,
    controller.fetch_wishlist 
);

router.post(
   '/cancel-appointment',
    auth(),
    checkCustomer,
    controller.cancel_appointment 
);
router.get(
   '/get-branch-coupon-id/:coupon_id',
    controller.get_brach_by_coupon 
);
router.post(
   '/send-test-mail',
    controller.send_test 
);
router.post(
   '/send-test-mails',
    controller.send_tests 
);
module.exports = router;