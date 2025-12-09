const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { upload } = require('../utils/upload');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/image', authMiddleware, upload.single('image'), uploadController.uploadImage);

module.exports = router;
