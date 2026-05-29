const express = require('express');

const router = express.Router();

const controller = require('../../controllers/admin/MerchantController');

const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');

router.post(
    '/merchant/register',
    auth('admin'),
    (req, res, next) => {  

        req.uploadFolder = 'merchant'; 

        next();

    },

    upload,

    controller.createOrUpdateMerchant
);


router.post(
    '/merchant/status-update',
    auth('admin'),

    controller.update_status
);
router.post(
    '/merchant/delete-status',
    auth('admin'),

    controller.delete_status
);



module.exports = router;