const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

const { writeLimiter } = require('../middleware/rateLimiter');
router.post('/conversations/:conversationId/messages', authMiddleware, writeLimiter, messageController.sendMessage);

router.post('/conversations', authMiddleware, messageController.createConversation);
router.get('/conversations', authMiddleware, messageController.listConversations);

router.post('/conversations/:conversationId/messages', authMiddleware, messageController.sendMessage);
router.get('/conversations/:conversationId/messages', authMiddleware, messageController.getMessages);
router.post('/conversations/:conversationId/read', authMiddleware, messageController.markAsRead);

module.exports = router;
