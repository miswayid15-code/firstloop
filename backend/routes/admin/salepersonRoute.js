const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');
const controller = require('../../controllers/admin/salepersonController');

const checkAdmin = require('../../middleware/checkAdmin');
const checkSp = require('../../middleware/checkSp');


router.post('/saleperson/list', auth('admin'), checkAdmin, controller.list);
// router.post('/saleperson/deleted-list', auth('admin'), checkAdmin, controller.delete_list);

router.post(
    '/saleperson/status-update',
    auth('admin'),
    checkAdmin,
    controller.update_status
);
router.post(
    '/saleperson/details',
    auth('admin'),
    checkAdmin,
    controller.fetch_list
);
router.post(
    '/saleperson/create',
    auth('admin'),
    checkAdmin,
    controller.register
);
router.post(
    '/saleperson/update',
    auth('admin'),
    checkAdmin,
    controller.update
);
router.post(
    '/saleperson/generate-code',
    auth('admin'),
    checkAdmin,
    controller.generateSalePersonCode
);
router.post(
    '/saleperson/login',
    controller.login
);
router.post(
    '/saleperson/logout',
    auth('salesperson'),
    checkSp,
    controller.logout
);
router.post(
    '/saleperson/merchant_list',
    auth('salesperson'),
    checkSp,
    controller.merchant_list
);
router.post(
    '/saleperson/referred-merchants',
    auth('admin'),
    checkAdmin,
    controller.referred_merchants
);
module.exports = router;