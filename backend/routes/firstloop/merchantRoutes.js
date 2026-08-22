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
    auth('merchant'),
    checkMerchant,
    controller.branch_id
);
router.post(
    '/refreshAccessToken',
    controller.refreshAccessToken
);


module.exports = router;