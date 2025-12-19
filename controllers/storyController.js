const Story = require('../models/Story');

// @desc    Get all stories
// @route   GET /api/stories
// @access  Private
exports.getStories = async (req, res) => {
    try {
        const stories = await Story.find()
            .sort({ createdAt: -1 })
            .select('-author'); // Exclude author field to ensure anonymity

        res.status(200).json(stories);
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const newStory = new Story({
            author: req.user.id, // Save author for internal ref, but don't expose
            content,
        });

        const savedStory = await newStory.save();

        // Convert to object and delete author before sending response
        const storyObj = savedStory.toObject();
        delete storyObj.author;

        res.status(201).json(storyObj);
    } catch (error) {
        console.error('Error creating story:', error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Like/Unlike a story
// @route   PUT /api/stories/:id/like
// @access  Private
exports.likeStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Check if the post has already been liked
        const index = story.likes.indexOf(req.user.id);

        if (index === -1) {
            // Like
            story.likes.push(req.user.id);
        } else {
            // Unlike
            story.likes.splice(index, 1);
        }

        await story.save();

        res.status(200).json(story.likes);
    } catch (error) {
        console.error('Error liking story:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
