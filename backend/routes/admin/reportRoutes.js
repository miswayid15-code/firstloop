const express = require('express');
const router = express.Router();

const controller = require('../../controllers/admin/reportController.js');
const upload = require('../../middleware/upload.js');
const auth = require('../../middleware/auth.js');

const checkAdmin = require('../../middleware/checkAdmin.js');


router.post(
    '/merchant-report',
    auth('admin'), checkAdmin,
    controller.merchant_report
);


router.get(
    '/merchant-details-report/:id',
    auth('admin'), checkAdmin,
    controller.merchant_details_reports
);







module.exports = router;