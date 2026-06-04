const express = require('express');
const router = express.Router();

const upload = require('../../middleware/upload');
const controller = require('../../controllers/api/branchController');
const auth = require('../../middleware/auth'); 
const checkMerchant = require('../../middleware/checkMerchant'); 
const checkMerchantOrReceptionist = require('../../middleware/checkMerchantOrReceptionist'); 


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


router.get(
    '/branch/fetch-appointment',
     auth('receptionist'),
    controller.appointment_list
);

router.post('/branch/update-appointment', auth('receptionist'),(req,res,next)=>{
       
        next();
    },controller.update_appointment_status
);

router.post(
    '/branch/appointment-details',
     auth('receptionist'),
    controller.fetch_appointment_details
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


router.get('/branch/details/:id',      auth(),
    checkMerchantOrReceptionist, controller.branch_id);

// ================= merchant appointment =================

router.post(
    '/merchant/appointment-list',
    auth('merchant'),
    checkMerchant,
    controller.merchant_appointment_list
);
router.post(
    '/merchant/appointment-details',
    auth('merchant'),
    checkMerchant,
    controller.fetch_appointment_details
);

router.post(
    '/merchant/update-appointment',
    auth('merchant'),
    checkMerchant,
    controller.update_appointment_status_by_mer
);


module.exports = router;