const express = require('express');
const router = express.Router();
const { testDB } = require('../../controllers/api/testController')

router.get('/test-db', testDB);

module.exports = router;

