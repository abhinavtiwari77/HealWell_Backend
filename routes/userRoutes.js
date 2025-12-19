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
router.get('/requests/pending', authMiddleware, userController.getFollowRequests);
router.post('/requests/:id/accept', authMiddleware, userController.acceptFollowRequest);
router.post('/requests/:id/reject', authMiddleware, userController.rejectFollowRequest);

// Favorites
router.get('/favorites', authMiddleware, userController.getFavorites);
router.post('/favorites/:postId', authMiddleware, userController.toggleFavorite);

router.get('/:id/connections', authMiddleware, userController.getUserConnections);

router.get('/:id', userController.getUserById);

module.exports = router;
