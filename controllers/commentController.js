const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;
    const userId = req.user.id;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ msg: 'Comment text is required' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const comment = await Comment.create({
      post: postId,
      author: userId,
      text: String(text).trim()
    });

    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    await comment.populate('author', 'name profilePicUrl');

    return res.status(201).json({ comment });
  } catch (err) {
    console.error('addComment error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.getCommentsForPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, parseInt(req.query.limit || '10', 10));
    const skip = (page - 1) * limit;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const total = await Comment.countDocuments({ post: postId });
    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name profilePicUrl')
      .lean();

    return res.json({ page, limit, total, comments });
  } catch (err) {
    console.error('getCommentsForPost error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const me = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });
    const post = await Post.findById(comment.post);
    const isPostAuthor = post && post.author && post.author.toString() === me;
    const isCommentAuthor = comment.author.toString() === me;
    const isAdmin = !!req.user.isAdmin;

    if (!(isCommentAuthor || isPostAuthor || isAdmin)) {
      return res.status(403).json({ msg: 'Not allowed to delete this comment' });
    }

    await comment.remove();

    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    return res.json({ msg: 'Comment deleted' });
  } catch (err) {
    console.error('deleteComment error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};


exports.editComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { text } = req.body;
    const me = req.user.id;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ msg: 'Comment text is required' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });

    if (comment.author.toString() !== me) {
      return res.status(403).json({ msg: 'Not allowed to edit this comment' });
    }

    comment.text = String(text).trim();
    await comment.save();

    await comment.populate('author', 'name profilePicUrl');

    return res.json({ comment });
  } catch (err) {
    console.error('editComment error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};
