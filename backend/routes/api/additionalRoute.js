const express = require('express');

const router = express.Router();

const controller = require('../../controllers/api/additionalController');

router.get(
    '/banner-list',
    controller.banner_list
);

module.exports = router;