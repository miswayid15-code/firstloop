const express = require('express');
const router = express.Router();

const controller = require('../../controllers/api/merchantController');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/merchant/register-step1', controller.registerStep1);
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
module.exports = router;