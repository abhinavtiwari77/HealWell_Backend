const { uploadBufferToCloudinary } = require('../utils/upload');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ msg: 'No file provided. Use form field name "image".' });
    }
    const options = {
      folder: req.body.folder || 'wellness', 
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
    };

    const result = await uploadBufferToCloudinary(req.file.buffer, options);
    return res.status(201).json({
      msg: 'Upload successful',
      url: result.secure_url,
      public_id: result.public_id,
      raw: result
    });
  } catch (err) {
    console.error('uploadImage error', err);
    return res.status(500).json({ msg: 'Upload failed', error: err.message || err });
  }
};
