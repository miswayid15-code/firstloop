const express = require('express');
const router = express.Router();

const controller = require('../../controllers/admin/additionalController.js');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

const checkAdmin = require('../../middleware/checkAdmin');


router.get(
    '/banner-list',
    controller.banner_list
);

router.get(
    '/banner-details/:id',
    controller.banner_details
);

router.post(
    '/create-banner',
    auth('admin'),
    (req, res, next) => {
        req.uploadFolder = 'Banner';
        next();
    },
    upload,
    checkAdmin,
    controller.create_banner
);

router.post(
    '/update-banner',
    auth('admin'),
    (req, res, next) => {
        req.uploadFolder = 'Banner';
        next();
    },
    upload,
    checkAdmin,
    controller.update_banner
);

router.delete(
    '/delete-banner/:id',
    auth('admin'),
    checkAdmin,
    controller.delete_banner
);

router.post('/create-page',  auth('admin'),checkAdmin, controller.create_page);
router.post('/update-page',  auth('admin'),checkAdmin, controller.update_page);
router.get('/page-list',   auth('admin'),checkAdmin,controller.page_list);
router.get('/page-details/:id',  auth('admin'), checkAdmin,controller.page_details);


router.get("/customer-list", auth('admin'),checkAdmin,controller.customer_list);
router.get("/merchant-lists",auth('admin'),checkAdmin, controller.merchant_list);
router.get("/receptionist-list",auth('admin'),checkAdmin, controller.reception_list);
router.get("/app-status",auth('admin'),checkAdmin, controller.get_app_status);
router.post("/update-app-status",auth('admin'),checkAdmin, controller.update_app_status);




router.get("/support/list",auth('admin'),checkAdmin, controller.support_list);
router.post("/support/update-status",auth('admin'),checkAdmin, controller.update_status);


module.exports = router;