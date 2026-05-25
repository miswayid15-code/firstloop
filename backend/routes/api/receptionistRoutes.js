const express = require('express');
const router = express.Router();

const controller = require('../../controllers/api/Receptionist');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

router.post('/receptionist/register', (req, res, next) => {
  req.uploadFolder = 'Receptionist';
  next();
}, auth('receptionist'),upload, controller.register);


router.post('/receptionist/login', controller.login);
router.post('/receptionist/logout', auth('receptionist'), controller.logout);
router.post('/receptionist/refreshAccessToken', auth('receptionist'), controller.refreshAccessToken);
router.get(
    '/receptionist/dashboard',
    auth('receptionist'),
    controller.dashboard
);
module.exports = router;