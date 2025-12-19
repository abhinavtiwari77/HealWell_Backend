const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
        type: String,
        required: [true, 'Story content is required'],
        trim: true,
        maxlength: [1000, 'Story cannot exceed 1000 characters']
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

// Virtual for likes count
StorySchema.virtual('likesCount').get(function () {
    return this.likes ? this.likes.length : 0;
});

// Ensure virtuals are included in JSON/Object output
StorySchema.set('toJSON', { virtuals: true });
StorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Story || mongoose.model('Story', StorySchema);
