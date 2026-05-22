const express = require('express');
const router = express.Router();

const upload = require('../../middleware/upload');
const controller = require('../../controllers/api/branchController');
const auth = require('../../middleware/auth');


// ================= CREATE BRANCH =================
router.post(
    '/branch/create-branch',
    auth,
    (req, res, next) => {
        req.uploadFolder = 'branch';
        next();
    },
    upload,
    controller.register
);


// ================= UPDATE BRANCH =================
router.post(
    '/branch/update',
    auth,
    (req, res, next) => {
        req.uploadFolder = 'branch';
        next();
    },
    upload,
    controller.update_branch
);


// ================= FETCH BRANCH LIST =================
router.get(
    '/branch/fetch-branch',
    auth,
    controller.fetch_list
);


// ================= APPOINTMENT LIST =================
router.get(
    '/branch/appointment-list',
    auth,
    controller.appointment_list
);


// ================= UPDATE APPOINTMENT =================
router.post(
    '/branch/update-appointment',
    auth,
    controller.update_appointment_status
);


// ================= DELETE BRANCH =================
router.post(
    '/branch/delete',
    auth,
    controller.delete_branch
);


// ================= CREATE MENU IMAGE =================
router.post(
    '/branch/create_menu_image',
    auth,
    (req, res, next) => {
        req.uploadFolder = 'branch/menu';
        next();
    },
    upload,
    controller.register_menu_image
);


// ================= FETCH MENU IMAGES =================
router.get(
    '/branch/fetch_menu_images/:branch_id',
    auth,
    controller.fetch_menu_images
);


// ================= UPDATE MENU IMAGE =================
router.post(
    '/branch/update_menu_image',
    auth,
    (req, res, next) => {
        req.uploadFolder = 'branch/menu';
        next();
    },
    upload,
    controller.update_menu_image
);


// ================= DELETE MENU IMAGE =================
router.delete(
    '/branch/delete_menu_image',
    auth,
    controller.delete_menu_image
);


// IMPORTANT:
// KEEP PARAM ROUTE ALWAYS LAST
router.get(
    '/branch/:id',
    auth,
    controller.branch_id
);

module.exports = router;