const express = require('express');
const router = express.Router();

const controller = require('../../controllers/admin/categoryController.js');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

const checkAdmin = require('../../middleware/checkAdmin');

router.get('/category-list', controller.fetch_list);

router.post(
    '/create-category',
    auth('admin'),
      (req, res, next) => {
    req.uploadFolder = 'Category';
    next();
  },
    upload,
    checkAdmin,
    controller.create_cat
);
router.post(
    '/update-category',
    auth('admin'),
      (req, res, next) => {
    req.uploadFolder = 'Category';
    next();
  },
    upload,
    checkAdmin,
    controller.update_cat
);
router.delete(
    '/delete-category/:id',
    auth('admin'),
    checkAdmin,
    controller.delete_cat
);

router.get('/coupon-category-list', controller.fetch_coupon_cat);

router.post('/create-coupon-category', controller.create_coupon_cat);

router.put('/update-coupon-category', controller.update_coupon_cat);

router.delete('/delete-coupon-category/:id', controller.delete_coupon_cat);
module.exports = router;