const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/posts/:postId/comments', authMiddleware, commentController.addComment);
router.get('/posts/:postId/comments', commentController.getCommentsForPost);
router.delete('/:id', authMiddleware, commentController.deleteComment);
router.put('/:id', authMiddleware, commentController.editComment);

module.exports = router;
