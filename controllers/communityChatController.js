const Community = require('../models/Community');
const Conversation = require('../models/Conversation');
const mongoose = require('mongoose');

// Get Message model from mongoose registry to avoid import issues
const getMessage = () => mongoose.model('Message');

function getIO(req) {
  return req.app?.locals?.io;
}

exports.getCommunityMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const me = req.user.id;
    
    const community = await Community.findById(id);
    if (!community) return res.status(404).json({ msg: 'Community not found' });

    // Check if user is a member
    if (!community.members.some(m => m.toString() === me)) {
      return res.status(403).json({ msg: 'You must be a member to view messages' });
    }

    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
    const skip = (page - 1) * limit;

    // Find or create a conversation for this community
    let conversation = await Conversation.findOne({
      isGroup: true,
      communityId: id
    });

    if (!conversation) {
      // Create conversation for community
      conversation = await Conversation.create({
        participants: community.members,
        isGroup: true,
        communityId: id,
        name: community.name,
        admins: community.admins
      });
    }

    const Message = getMessage();
    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name profilePicUrl')
      .lean();

    messages.reverse(); // Show oldest first

    return res.json({ page, limit, messages });
  } catch (err) {
    console.error('getCommunityMessages error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.sendCommunityMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const me = req.user.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ msg: 'Message text required' });
    }

    const community = await Community.findById(id);
    if (!community) return res.status(404).json({ msg: 'Community not found' });

    // Check if user is a member
    if (!community.members.some(m => m.toString() === me)) {
      return res.status(403).json({ msg: 'You must be a member to send messages' });
    }

    // Find or create conversation for community
    let conversation = await Conversation.findOne({
      isGroup: true,
      communityId: id
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: community.members,
        isGroup: true,
        communityId: id,
        name: community.name,
        admins: community.admins
      });
    } else {
      // Update participants in case new members joined
      conversation.participants = community.members;
      await conversation.save();
    }

    const Message = getMessage();
    const message = await Message.create({
      conversation: conversation._id,
      sender: me,
      text: text.trim()
    });

    await message.populate('sender', 'name profilePicUrl');

    // Update conversation's last message
    conversation.lastMessage = {
      text: text.length > 200 ? text.slice(0, 197) + '...' : text,
      sender: me,
      createdAt: message.createdAt
    };
    conversation.updatedAt = Date.now();
    await conversation.save();

    // Emit to all community members via Socket.IO
    const io = getIO(req);
    if (io) {
      io.to(`community-${id}`).emit('communityMessage', message);
    }

    return res.status(201).json({ message });
  } catch (err) {
    console.error('sendCommunityMessage error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};
