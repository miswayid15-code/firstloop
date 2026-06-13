//\routes\api\receptionistRoutes.js
const express = require('express');
const router = express.Router();

const controller = require('../../controllers/api/Receptionist');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/receptionist/register', (req, res, next) => {
  req.uploadFolder = 'Receptionist';
  next();
}, auth('merchant'),upload, controller.register);

router.get('/receptionist/details/:id', auth('merchant'), controller.fetch_receptionist_by_id);

router.post('/receptionist/update', (req, res, next) => {
  req.uploadFolder = 'Receptionist';
  next();
}, auth('merchant'), upload, controller.update_receptionist);

router.post('/receptionist/login', controller.login);
router.post('/receptionist/logout', auth('receptionist'), controller.logout);
router.post('/receptionist/refreshAccessToken', auth('receptionist'), controller.refreshAccessToken);
router.get(
    '/receptionist/dashboard',
    auth('receptionist'),
    controller.dashboard
);
router.get(
    '/receptionist/fetch-coupon',
    auth('receptionist'),
    controller.fetch_coupon
);
router.get(
    '/receptionist/fetch-appointment',
    auth('receptionist'),
    controller.fetch_appointment
);
module.exports = router;