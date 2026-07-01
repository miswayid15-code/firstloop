const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');
const controller = require('../../controllers/admin/adminAuthController');

router.post('/login', (req, res, next) => {
    // console.log("================================");
    // console.log("LOGIN API HIT");
    // console.log("BODY:", req.body);
    // console.log("TIME:", new Date().toISOString());
    // console.log("================================");

    next();
}, controller.login);
router.post('/logout', auth('admin'), controller.logout);
router.get('/merchant-list', auth('admin'), controller.merchant_list);
router.post('/merchant-fetch-id', auth('admin'), controller.fetchmerchant);
router.post('/refresh-token', controller.refreshAccessToken);







module.exports = router;