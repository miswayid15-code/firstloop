const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');
const controller = require('../../controllers/admin/CustomerController');

const checkAdmin = require('../../middleware/checkAdmin');


router.post('/customer/list', auth('admin'), checkAdmin, controller.list);

router.post(
    '/customer/status-update',
    auth('admin'),
    checkAdmin,
    controller.update_status
);
router.post(
    '/customer/details',
    auth('admin'),
    checkAdmin,
    controller.fetch_list
);
router.post(
    '/customer/update',
    auth('admin'),
      (req, res, next) => {
    req.uploadFolder = 'customer';
    next();
  },
    upload,
    checkAdmin,
    controller.update
);

router.post(
    '/appointment/list',
    auth('admin'),
    checkAdmin,
    controller.appointment_list
);

router.post(
    '/coupon-claim/list',
    auth('admin'),
    checkAdmin,
    controller.coupon_claim_list
);
module.exports = router;