const express = require('express');

const router = express.Router();

const controller = require('../../controllers/admin/MerchantController');

const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');
const checkAdmin = require('../../middleware/checkAdmin');

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
    '/merchant/category-update',
    auth('admin'),

    controller.update_category
);
router.post(
    '/merchant/delete-status',
    auth('admin'),

    controller.delete_status
);

router.post('/receptionists-id', auth('admin'), checkAdmin, controller.receptionistsbyid);


module.exports = router;
