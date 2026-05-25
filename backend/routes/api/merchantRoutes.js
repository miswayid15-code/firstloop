const express = require('express');

const router = express.Router();

const controller =
require('../../controllers/api/merchantController');

const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');


// register step 1
router.post(
    '/merchant/register-step1',

    (req, res, next) => {

        req.uploadFolder = 'merchant';

        next();

    },

    upload,

    controller.registerStep1
);


// register step 2
router.post(

    '/merchant/register-step2',

    auth('merchant'),

    (req, res, next) => {

        req.uploadFolder = 'merchant';

        next();

    },

    upload,

    controller.registerStep2

);


// login
router.post(
    '/merchant/login',
    controller.login
);


// logout
router.post(
    '/merchant/logout',
    auth('merchant'),
    controller.logout
);


// profile
router.get(
    '/merchant/profile',
    auth('merchant'),
    controller.fetchmerchant
);


// refresh token
router.post(
    '/merchant/refreshAccessToken',
    auth('merchant'),
    controller.refreshAccessToken
);


// dashboard
router.get(
    '/merchant/dashboard',
    auth('merchant'),
    controller.dashboard
);


// branch list
router.get(
    '/merchant/branch-list',
    auth('merchant'),
    controller.branch_list
);


// receptionist list
router.get(
    '/merchant/Receptionist-list',
    auth('merchant'),
    controller.receptionist_list
);


// forgot password
router.post(
    '/merchant/forget-password',
    controller.forget_password
);


// reset password
router.post(
    '/merchant/reset-password',
    controller.reset_ps
);


// firebase login
router.post(
    '/merchant/oauth-login',
    controller.firebase_reg
);


module.exports = router;