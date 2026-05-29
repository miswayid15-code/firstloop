const express = require('express');

const router = express.Router();

const controller = require('../../controllers/admin/merchantController');

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



module.exports = router;