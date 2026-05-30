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
router.post('/receptionists/edit',(req, res, next) => {
  req.uploadFolder = 'Receptionist';
  next();
}, auth('admin'),upload,checkAdmin, controller.receptionistsEdit);
router.post('/receptionists/register',(req, res, next) => {
  req.uploadFolder = 'Receptionist';
  next();
}, auth('admin'),upload,checkAdmin, controller.receptionistsRegister);

router.post('/branch/register',(req, res, next) => {
  req.uploadFolder = 'branch';
  next();
}, auth('admin'),upload,checkAdmin, controller.branchRegister);


router.post('/branch/update',(req, res, next) => {
  req.uploadFolder = 'branch';
  next();
}, auth('admin'),upload,checkAdmin, controller.branchUpdate);
router.post('/coupon/create',(req, res, next) => {
  req.uploadFolder = 'COUPON';
  next();
}, auth('admin'),upload,checkAdmin, controller.create_coupon);

router.post('/coupon/edit',(req, res, next) => {
  req.uploadFolder = 'COUPON';
  next();
}, auth('admin'),upload,checkAdmin, controller.update_coupon);
router.get('/branch/id/:id', auth('admin'),checkAdmin, controller.fetch_branch_id);

module.exports = router;
