const express = require('express');
const router = express.Router();
const { getStories, createStory, likeStory } = require('../controllers/storyController');
const protect = require('../middleware/authMiddleware');

router.route('/').get(protect, getStories).post(protect, createStory);
router.route('/:id/like').put(protect, likeStory);

module.exports = router;
