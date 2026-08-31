const express = require('express');

const router = express.Router();

const controller =
    require('../../controllers/firstloop/merchantController');

const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');
const checkMerchant = require('../../middleware/checkMerchant');

// login
router.post(
    '/login',
    controller.login
);


// logout
router.post(
    '/logout',
    auth('merchant'),
    controller.logout
);
router.post(
    '/branch-list',
    auth('merchant'),
    checkMerchant,
    controller.fetch_list
);
router.post(
    '/dashboard',
    auth('merchant'),
    checkMerchant,
    controller.dashboard
);
router.post(
    '/branch_details/:id',
    // auth('merchant'),
    // checkMerchant,
    controller.branch_id
);
router.post(
    '/refreshAccessToken',
    controller.refreshAccessToken
);

router.post(
    '/create_stamp_card',
    auth(),
    (req, res, next) => {
        req.uploadFolder = 'merchant';
        next();
    },
    upload,
    controller.stamp_card
);
router.post(
    '/fetch-stamp-card',
    controller.fetch_stamp_card
);
router.post(
    '/fetch-br-stamp-card',
    controller.fetch_branch_stamp_card
);
router.post(
    '/fetch-stamp-card-details',
    controller.fetch_stamp_id
);
router.post('/fetch-id', auth('merchant'),
    checkMerchant, controller.fetchmerchant);

router.post(
    '/create_membership_card',
    auth(),
    (req, res, next) => {
        req.uploadFolder = 'merchant';
        next();
    },
    upload,
    controller.membership_card
);
router.post(
    '/fetch-membership-card',
    controller.fetch_membership_card
);
router.post(
    '/fetch-br-membership-card',
    controller.fetch_branch_membership_card
);
router.post(
    '/fetch-membership-card-details',
    controller.fetch_membership_id
);
module.exports = router;