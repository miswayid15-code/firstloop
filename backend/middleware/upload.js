const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// storage config
const storage = multer.diskStorage({

  destination: function (req, file, cb) {

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
else if (file.fieldname === 'image') {
  folder += '';
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
  limits: { fileSize: 1 * 1024 * 1024 },
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
        message: "Image must be less than 1MB"
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
            const compressedPath = file.path + '_compressed.jpg';

            await sharp(file.path)
              .jpeg({ quality: 70 })
              .toFile(compressedPath);

            // ✅ wait for file release (fix EBUSY)
            await new Promise(resolve => setTimeout(resolve, 100));

            fs.unlinkSync(file.path);
            fs.renameSync(compressedPath, file.path);

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