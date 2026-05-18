const express = require('express');
const router = express.Router();

const controller = require('../../controllers/api/merchantController');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/merchant/register-step1', (req, res, next) => {
  req.uploadFolder = 'merchant';
  next();
}, upload, controller.registerStep1);
router.post(
  '/merchant/register-step2',
  auth,
  

  (req, res, next) => {
    req.uploadFolder = 'merchant';
    next();
  },

  upload,
  controller.registerStep2
);
router.get('/merchant/profile', auth, controller.fetchmerchant);
router.post('/merchant/logout', auth, controller.logout);
router.post('/merchant/login', controller.login);
router.post('/merchant/refreshAccessToken', auth, controller.refreshAccessToken);
router.get('/merchant/dashboard', auth, controller.dashboard);
router.get('/merchant/branch-list', auth, controller.branch_list);
router.get('/merchant/Receptionist-list', auth, controller.receptionist_list);
router.post('/merchant/forget-password', controller.forget_password);
router.post('/merchant/reset-password', controller.reset_ps);
router.post('/merchant/oauth-login', controller.firebase_reg);
module.exports = router;