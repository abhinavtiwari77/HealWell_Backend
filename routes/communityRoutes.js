const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', communityController.listCommunities);

router.get('/:identifier', communityController.getCommunity);

router.post('/', authMiddleware, communityController.createCommunity);

router.post('/:id/join', authMiddleware, communityController.joinCommunity);
router.post('/:id/leave', authMiddleware, communityController.leaveCommunity);

router.post('/:id/requests/:userId/approve', authMiddleware, communityController.approveRequest);
router.post('/:id/requests/:userId/reject', authMiddleware, communityController.rejectRequest);

router.put('/:id', authMiddleware, communityController.updateCommunity);
router.delete('/:id', authMiddleware, communityController.deleteCommunity);

module.exports = router;
