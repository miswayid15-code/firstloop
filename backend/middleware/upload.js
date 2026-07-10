const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// storage config
const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    console.log("FILE FIELDNAME:", req.headers['content-type'], file.fieldname);
    // ✅ dynamic base folder (set in controller)
    let baseFolder = req.uploadFolder || 'common';

    let folder = `uploads/${baseFolder}/`;

    // ✅ subfolder logic
    if (file.fieldname === 'profile_image') {
      folder += 'profile/';
    }
    else if (file.fieldname === 'brand_image') {
      folder += 'brand/';
    }
    else if (file.fieldname === 'document') {
      folder += 'documents/';
    }
    else if (file.fieldname === 'image' ||
      file.fieldname === 'images') {
      folder += '';
    }
    else if (
      file.fieldname === 'menu_image' ||
      file.fieldname === 'menu_images'
    ) {
      folder += 'menu/';
    }
    else if (file.fieldname === 'banner_image') {
      folder += 'banner/';
    }
    else {
      folder += 'images/';
    }

    // ✅ ensure folder exists
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '_' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});


// multer config
const upload = multer({
  storage: storage,
  limits: { fileSize: 1 * 2048 * 2048 },
  fileFilter: (req, file, cb) => {

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp'
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only image files (jpg, png, webp) allowed'), false);
    }

    cb(null, true);
  }
}).any();


// middleware with compression
const uploadWithCompress = async (req, res, next) => {

  upload(req, res, async function (err) {

    if (err instanceof multer.MulterError) {
      return res.json({
        status: 0,
        message: "Image must be less than 2MB"
      });
    }

    if (err) {
      return res.json({
        status: 0,
        message: err.message
      });
    }

    // ✅ compress images safely
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {

        if (file.mimetype.startsWith('image')) {

          try {
            const webpPath = file.path.replace(path.extname(file.path), '.webp');

            await sharp(file.path)
              .webp({
                quality: 80,
                effort: 4 // compression level (0-6)
              })
              .toFile(webpPath);

            // wait until file is released
            await new Promise(resolve => setTimeout(resolve, 100));

            // remove original file
            fs.unlinkSync(file.path);

            // update multer file object
            file.filename = file.filename.replace(path.extname(file.filename), '.webp');
            file.path = webpPath;
            file.destination = path.dirname(webpPath);

            // if you use file.originalname later
            file.originalname = file.originalname.replace(path.extname(file.originalname), '.webp');

          } catch (e) {
            console.log("Compression error:", e.message);
          }
        }
      }
    }

    next();
  });
};

module.exports = uploadWithCompress;