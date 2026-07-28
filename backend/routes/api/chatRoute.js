const express = require('express');
const router = express.Router();

const controller =
    require('../../controllers/api/chartController');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');
const checkCustomer = require('../../middleware/checkCustomer');
const checkReceptionist = require('../../middleware/checkReceptionist');
const checkMerchantOrReceptionist = require('../../middleware/checkMerchantOrReceptionist');
router.post(
    '/create',
    auth('customer'),
    checkCustomer,
    controller.createChat
);


router.post(
    '/send',
    auth('customer'),
    upload,
    checkCustomer,
    controller.sendMessage
);




router.get(
    '/branch-chats-last',
    auth('receptionist'),
    checkReceptionist,
    controller.getBranchChats
);


router.post(
    '/branch-message',
    auth(),
    checkMerchantOrReceptionist,
    controller.getChatMessages
);

router.post(
    '/send-branch-message',
     auth(),
     upload,
    checkMerchantOrReceptionist,
    controller.sendBranchMessage
);
module.exports = router;