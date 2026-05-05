const fs = require('fs');
const path = require('path');

module.exports = (files, merchant) => {

  let data = {
    profile_image: merchant.profile_image,
    brand_image: merchant.brand_image,
    document: merchant.document
  };

  if (!files) return data;

  files.forEach(file => {

    let folder = 'uploads/merchant/';

    if (file.fieldname === 'profile_image') {
      folder += 'profile/';
    } 
    else if (file.fieldname === 'brand_image') {
      folder += 'brand/';
    } 
    else if (file.fieldname === 'document') {
      folder += 'documents/';
    }


    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    const filename = path.basename(file.path);
    const newPath = folder + filename;

    // move file
    fs.renameSync(file.path, newPath);

    const cleanPath = newPath.replace(/\\/g, '/');

    if (data.hasOwnProperty(file.fieldname)) {
      data[file.fieldname] = cleanPath;
    }

  });

  return data;
};