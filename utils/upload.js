const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
    cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'), false);
  } else {
    cb(null, true);
  }
};

const limits = { fileSize: 5 * 1024 * 1024 };

const upload = multer({ storage, fileFilter, limits });

/**
 * Upload buffer to Cloudinary using upload_stream and return result
 * @param {Buffer} buffer
 * @param {Object} options - cloudinary upload options (folder, public_id, resource_type, etc.)
 * @returns {Promise<Object>} - cloudinary upload result
 */
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

module.exports = {
  upload, 
  uploadBufferToCloudinary,
  cloudinary
};
