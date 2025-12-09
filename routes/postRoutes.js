const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload } = require('../utils/upload');
const { writeLimiter } = require('../middleware/rateLimiter');

router.get('/', postController.getFeed);
router.get('/:id', postController.getPost);
router.post(
  '/',
  authMiddleware,
  writeLimiter,
  upload.array('media', 5), 
  postController.createPost
);
router.put(
  '/:id',
  authMiddleware,
  upload.array('media', 5), 
  postController.editPost
);
router.delete('/:id', authMiddleware, postController.deletePost);
router.post('/:id/like', authMiddleware, postController.toggleLike);

module.exports = router;
