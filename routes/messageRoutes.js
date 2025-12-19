const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

const { writeLimiter } = require('../middleware/rateLimiter');
// Messages are mounted at /api/messages
router.post('/conversations', authMiddleware, messageController.createConversation);
router.get('/conversations', authMiddleware, messageController.listConversations);

// Specific conversation operations
router.post('/:id', authMiddleware, messageController.sendMessage);        // Send message
router.get('/:id', authMiddleware, messageController.getMessages);         // Get messages
router.delete('/:id', authMiddleware, messageController.deleteConversation); // Delete conversation
router.post('/:id/read', authMiddleware, messageController.markAsRead);    // Mark read

module.exports = router;
