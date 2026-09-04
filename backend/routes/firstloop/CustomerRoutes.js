const express = require('express');

const router = express.Router();

const controller =
    require('../../controllers/firstloop/CustomerController');

const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');
const checkCustomer = require('../../middleware/checkCustomer');
const checkMerchantOrReceptionist = require('../../middleware/checkMerchantOrReceptionist'); 
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
router.post(
    '/fetch-branch-customers',
    auth(),
    controller.get_branch_cus
);
router.post(
    '/fetch-merchant-customers',
    auth(),
    controller.get_merchant_customers
);
router.post(
    '/stamp-paid',
    auth(),checkMerchantOrReceptionist,
    controller.stamp_paid
);
router.post(
    '/get-customer-card-details',
    auth(),
    controller.get_customer_card_details
);
router.post(
    '/get-customer-details',
    auth(),
    controller.get_customer_details
);

module.exports = router;