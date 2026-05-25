const express = require('express');
const router = express.Router();

const upload = require('../../middleware/upload');
const controller = require('../../controllers/api/branchController');
const auth = require('../../middleware/auth');


// ================= CREATE BRANCH =================
router.post(
'/branch/create-branch',
(req, res, next) => {
console.log("STEP 1 ROUTE HIT");
next();
},
 auth('merchant'),
(req, res, next) => {
console.log("STEP 2 AUTH OK");
next();
},
upload,
(req, res, next) => {
console.log("STEP 3 MULTER OK");
next();
},
controller.register
);



// ================= UPDATE BRANCH =================
router.post(
    '/branch/update',
     auth('merchant'),
    (req, res, next) => {
        req.uploadFolder = 'branch';
        next();
    },
    upload,
    controller.update_branch
);


// ================= FETCH BRANCH LIST =================
router.get(
    '/branch/fetch-branch',
     auth('merchant'),
    controller.fetch_list
);


// ================= APPOINTMENT LIST =================
router.post('/branch/update-appointment', auth('merchant'),(req,res,next)=>{
        console.log("UPDATE APPOINTMENT ROUTE HIT");
        next();
    },controller.update_appointment_status
);




// ================= DELETE BRANCH =================
router.post(
    '/branch/delete',
     auth('merchant'),
    controller.delete_branch
);


// ================= CREATE MENU IMAGE =================
router.post(
    '/branch/create_menu_image',
     auth('merchant'),
    (req, res, next) => {
        req.uploadFolder = 'branch/menu';
        next();
    },
    upload,
    controller.register_menu_image
);


// ================= FETCH MENU IMAGES =================
router.get(
    '/branch/fetch_menu_images/:branch_id',
     auth('merchant'),
    controller.fetch_menu_images
);


// ================= UPDATE MENU IMAGE =================
router.post(
    '/branch/update_menu_image',
     auth('merchant'),
    (req, res, next) => {
        req.uploadFolder = 'branch/menu';
        next();
    },
    upload,
    controller.update_menu_image
);


// ================= DELETE MENU IMAGE =================
router.delete(
    '/branch/delete_menu_image',
     auth('merchant'),
    controller.delete_menu_image
);


router.get('/branch/details/:id',  auth('merchant'), controller.branch_id);

module.exports = router;