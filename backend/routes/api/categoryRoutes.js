const express = require('express');
const router = express.Router();

const controller = require('../../controllers/api/categoryController');
const upload = require('../../middleware/upload');
const auth = require('../../middleware/auth');



router.post('/api/category-list', auth('customer'), controller.fetch_list);

module.exports = router;