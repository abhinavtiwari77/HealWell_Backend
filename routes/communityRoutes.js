const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const communityChatController = require('../controllers/communityChatController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', communityController.listCommunities);

router.post('/', authMiddleware, communityController.createCommunity);

// Community chat routes - MUST come before /:identifier to avoid conflicts
router.get('/:id/messages', authMiddleware, communityChatController.getCommunityMessages);
router.post('/:id/messages', authMiddleware, communityChatController.sendCommunityMessage);

// Community member routes
router.get('/requests/pending', authMiddleware, communityController.getPendingCommunityRequests); // NEW: Get pending requests for my communities
router.post('/:id/join', authMiddleware, communityController.joinCommunity);
router.post('/:id/leave', authMiddleware, communityController.leaveCommunity);

router.post('/:id/requests/:userId/approve', authMiddleware, communityController.approveRequest);
router.post('/:id/requests/:userId/reject', authMiddleware, communityController.rejectRequest);
router.delete('/:id/members/:userId', authMiddleware, communityController.removeMember);

router.put('/:id', authMiddleware, communityController.updateCommunity);
router.delete('/:id', authMiddleware, communityController.deleteCommunity);

// Get community - MUST come last to avoid matching specific routes
router.get('/:identifier', communityController.getCommunity);

module.exports = router;
