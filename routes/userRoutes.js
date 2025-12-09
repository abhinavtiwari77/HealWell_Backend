const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload'); 
const validate = require('../middleware/validate'); 
router.get('/', userController.searchUsers);
router.get('/me', authMiddleware, userController.getMyProfile);
router.put('/me', authMiddleware, upload.single('image'), userController.updateMyProfile);
router.post('/:id/follow', authMiddleware, userController.toggleFollow);
router.get('/:id', userController.getUserById);

module.exports = router;
