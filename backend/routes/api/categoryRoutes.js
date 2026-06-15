const express = require('express');
const router = express.Router();

const controller = require('../../controllers/api/categoryController');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');

const checkAdmin = require('../../middleware/checkAdmin');

router.get('/category-list', controller.fetch_list);


module.exports = router;