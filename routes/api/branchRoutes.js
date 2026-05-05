const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload');
const controller = require('../../controllers/api/branchController');
const auth = require('../../middleware/auth');


router.post(
  '/branch/create-branch',
  auth,

  (req, res, next) => {
    req.uploadFolder = 'branch'; 
    next();
  },

  upload,
  controller.register
);
router.post(
  '/branch/update',
  auth,
  (req, res, next) => {
    req.uploadFolder = 'branch'; 
    next();
  },
  upload,
  controller.update_branch
);
router.get('/branch/fetch-branch', auth, controller.fetch_list);
router.post('/branch/delete', auth, controller.delete_branch);
router.get('/branch/:id', controller.branch_id);
module.exports = router;