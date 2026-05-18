const express = require('express');
const router = express.Router();

const controller = require('../../controllers/api/CustomerController');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/customer/register', (req, res, next) => {
  req.uploadFolder = 'customer';
  next();
}, upload, controller.register);
router.post('/customer/logout', auth, controller.logout);
router.post('/customer/login', controller.login);
router.post('/customer/refreshAccessToken', auth, controller.refreshAccessToken);
router.post('/customer/forget-password', controller.forget_password);
router.post('/customer/reset-password', controller.reset_ps);
router.post(
    '/customer/update',
    auth,
      (req, res, next) => {
    req.uploadFolder = 'customer';
    next();
  },
    upload,
    controller.update
);
router.get('/customer/fetch-customer-by', auth, controller.fetch_list);
router.get(
    '/customer/home',
    controller.home
);
module.exports = router;