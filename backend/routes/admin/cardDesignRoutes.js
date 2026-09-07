const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload');

const auth = require('../../middleware/auth');
const controller = require('../../controllers/admin/DesignCardsController');

const checkAdmin = require('../../middleware/checkAdmin');



router.post('/list',controller.list);
// router.post('/saleperson/deleted-list', auth('admin'), checkAdmin, controller.delete_list);

router.post(
    '/status-update',
    auth('admin'),
    checkAdmin,
    controller.update_status
);
router.post(
    '/delete',
    auth('admin'),
    checkAdmin,
    controller.delete
);
router.post(
    '/details',
    auth('admin'),
    checkAdmin,
    controller.fetch_list
);
router.post(
    '/create',
    (req, res, next) => {
        req.uploadFolder = 'card_design';
        next();
    },upload,
    auth('admin'),
    checkAdmin,
    controller.register
);
router.post(
    '/update',
    (req, res, next) => {
        req.uploadFolder = 'card_design';
        next();
    },upload,
    auth('admin'),
    checkAdmin,
    controller.update
);

module.exports = router;