const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload');
const controller = require('../../controllers/api/branchController');
const auth = require('../../middleware/auth');


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
router.get('/branch/fetch-branch', auth, controller.fetch_list);
router.post('/branch/delete', auth, controller.delete_branch);
router.get('/branch/:id', auth,controller.branch_id);
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

router.get(
    '/branch/fetch_menu_images/:branch_id',
    auth,
    controller.fetch_menu_images
);

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

router.delete(
    '/branch/delete_menu_image',
    auth,
    controller.delete_menu_image
);
module.exports = router;