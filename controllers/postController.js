const Post = require("../models/Post");
const User = require("../models/user");
const { uploadBufferToCloudinary, cloudinary } = require("../utils/upload");

async function uploadFilesToCloudinary(files = []) {
  const uploaded = [];
  for (const f of files) {
    const isVideo = f.mimetype.startsWith('video/');
    const options = {
      folder: 'wellness/posts',
      resource_type: isVideo ? 'video' : 'image',
      use_filename: true,
      unique_filename: true
    };
    const res = await uploadBufferToCloudinary(f.buffer, options);
    uploaded.push({
      url: res.secure_url,
      public_id: res.public_id,
      resource_type: isVideo ? 'video' : 'image'
    });
  }
  return uploaded;
}

exports.createPost = async (req, res) => {
  try {
    let { content, mediaUrl, community } = req.body;
    let media = [];

    if (Array.isArray(req.files) && req.files.length > 0) {
      try {
        const uploaded = await uploadFilesToCloudinary(req.files);
        media = uploaded;
      } catch (err) {
        console.error("Cloudinary upload failed", err);
        return res.status(500).json({ msg: "Image/Video upload failed" });
      }
    }

    if (!content && !mediaUrl && media.length === 0) {
      return res.status(400).json({ msg: "Post must have content or media" });
    }

    if (mediaUrl) {
      media.push({
        url: mediaUrl,
        public_id: null,
        resource_type: mediaUrl.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image'
      });
    }

    const post = await Post.create({
      author: req.user.id,
      content,
      media,
      mediaUrl: media.length > 0 ? media[0].url : null,
      community: community || null
    });

    await post.populate("author", "name profilePicUrl");

    return res.status(201).json({ post });
  } catch (err) {
    console.error("createPost error", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.editPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const me = req.user.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (post.author.toString() !== me && !req.user.isAdmin) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    const { content, removePublicIds } = req.body;
    let removeIds = [];
    try {
      if (removePublicIds) {
        if (typeof removePublicIds === 'string') {
          removeIds = JSON.parse(removePublicIds);
        } else {
          removeIds = Array.isArray(removePublicIds) ? removePublicIds : [];
        }
      }
    } catch (e) {
      removeIds = [];
    }

    if (Array.isArray(removeIds) && removeIds.length > 0) {
      for (const pid of removeIds) {
        const idx = post.media.findIndex(m => m.public_id === pid);
        if (idx !== -1) {
          const mediaItem = post.media[idx];
          try {
            await cloudinary.uploader.destroy(mediaItem.public_id, { resource_type: mediaItem.resource_type || 'image' });
          } catch (err) {
            console.warn('Failed to delete cloud asset', mediaItem.public_id, err.message || err);
          }
          // remove from array
          post.media.splice(idx, 1);
        }
      }
    }
    if (Array.isArray(req.files) && req.files.length > 0) {
      try {
        const uploaded = await uploadFilesToCloudinary(req.files);
        post.media.push(...uploaded);
      } catch (err) {
        console.error('Cloudinary upload failed', err);
        return res.status(500).json({ msg: 'Image/Video upload failed' });
      }
    }

    if (typeof content === 'string') post.content = content;

    post.mediaUrl = post.media.length > 0 ? post.media[0].url : null;

    await post.save();
    await post.populate('author', 'name profilePicUrl');

    return res.json({ post });
  } catch (err) {
    console.error('editPost error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    if (post.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ msg: 'Not allowed' });
    }
    if (Array.isArray(post.media) && post.media.length > 0) {
      for (const m of post.media) {
        if (m.public_id) {
          try {
            await cloudinary.uploader.destroy(m.public_id, { resource_type: m.resource_type || 'image' });
          } catch (err) {
            console.warn('Failed to delete asset:', m.public_id, err.message || err);
          }
        }
      }
    }

    await post.remove();
    return res.json({ msg: 'Post Deleted' });
  } catch (err) {
    console.error('deletePost error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, parseInt(req.query.limit || '10', 10));
    const skip = (page - 1) * limit;
    const { community } = req.query;

    const filter = {};
    if (community) filter.community = community;

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name profilePicUrl')
      .lean();

    const total = await Post.countDocuments(filter);
    return res.json({ page, limit, total, posts });
  } catch (err) {
    console.error('getFeed error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name profilePicUrl').lean();
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    return res.json({ post });
  } catch (err) {
    console.error('getPost error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const userId = req.user.id;
    const idx = post.likes.findIndex((id) => id.toString() === userId);

    if (idx === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(idx, 1);
    }

    await post.save();
    return res.json({ likesCount: post.likes.length, liked: idx === -1 });
  } catch (err) {
    console.error('toggleLike error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};
