const express = require('express');

const router = express.Router();

const controller =
    require('../../controllers/firstloop/CustomerController');

const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');
const checkCustomer = require('../../middleware/checkCustomer');
router.post(
    '/check-customer',
    auth(),
    controller.check_customer
);
router.post(
    '/link-customer',
    auth(),
    controller.Link_customer
);
router.post(
    '/fetch-card',
    auth(),
    controller.fetch_card
);
module.exports = router;