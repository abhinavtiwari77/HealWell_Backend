const Post = require("../models/Post");
const User = require("../models/user");

exports.createPost = async(req,res)=>{
    try{
        const{content,mediaUrl,community} = req.body;
        if(!content && !mediaUrl) return res.status(400).json({msg:"Post must be have content or media"});

        const post = await Post.create({
            author:req.user.id,
            content,
            mediaUrl:mediaUrl|| null,
            community:community||null
        });

        await post.populate('author','name profilePicUrl');
        return res.status(201).json({post});
    }
    catch(err){
        console.error('createPost error',err);
        return res.status(500).json({msg:"Server error"});
    }
};

exports.getFeed = async(req,res)=>{
    try{
        const page = Math.max(1,parseInt(req.query.page||'1',10));
        const limit = Math.min(50,parseInt(req.query.limit || '10',10));
        const skip = (page-1) * limit;
        const{community} = req.query;

        const filter = {};
        if(community) filter.community = community;

        const posts = await Post.find(filter)
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        .populate('author','name profilePicUrl')
        .lean();

        const total = await Post.countDocuments(filter);
        return res.json({page,limit,total,posts});
    }
    catch(err){
        console.error('getFeed error',err);
        return res.status(500).json({msg:"Server error"});
    }
};

exports.getPost = async(req,res)=>{
    try{
        const post = await Post.findById(req.params.id).populate('author','name profilePicUrl').lean();
        if(!post) return res.status(404).json({msg:"Post not found"});
        return res.json({post});
    }
    catch(err){
        console.error('getPost error',err);
        return res.status(500).json({msg:"Server error"});
    }
};

exports.deletePost = async(req,res)=>{
    try{
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({msg:"Post not found"});
        if(post.author.toString()!==req.user.id && !req.user.isAdmin){
            return res.status(403).json({msg:"Not allowed"});
        }
        await post.remove();
        return res.json({msg:"Post Deleted"});
    }
    catch(err){
        console.error('deletePost error',err);
        return res.status(500).json({msg:"Server error"});
    }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const userId = req.user.id;
    const idx = post.likes.findIndex(id => id.toString() === userId);

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