const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const mongoose = require('mongoose');

function getIO(req) {
  return req.app?.locals?.io;
}

exports.createConversation = async (req, res) => {
  try {
    const { participantIds, isGroup = false, name = null } = req.body;
    const me = req.user.id;

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ msg: 'participantIds required' });
    }

    const participantsSet = new Set(participantIds.map(String));
    participantsSet.add(String(me));
    const participants = Array.from(participantsSet);
    if (!isGroup && participants.length === 2) {
      const conv = await Conversation.findOne({
        isGroup: false,
        participants: { $all: participants, $size: 2 }
      });
      if (conv) return res.status(200).json({ conversation: conv });
    }

    const convo = await Conversation.create({
      participants,
      isGroup,
      name: isGroup ? name : null,
      admins: [me]
    });

    return res.status(201).json({ conversation: convo });
  } catch (err) {
    console.error('createConversation error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};


exports.listConversations = async (req, res) => {
  try {
    const me = req.user.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({ participants: me })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('participants', 'name profilePicUrl')
      .lean();

    return res.json({ page, limit, conversations });
  } catch (err) {
    console.error('listConversations error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const me = req.user.id;
    const { conversationId } = req.params;
    const { text = null, mediaUrl = null } = req.body;

    if (!text && !mediaUrl) {
      return res.status(400).json({ msg: 'text or mediaUrl required' });
    }
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ msg: 'Invalid conversationId' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });

    if (!conversation.participants.map(p => p.toString()).includes(me)) {
      return res.status(403).json({ msg: 'Not a participant' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: me,
      text,
      mediaUrl
    });

    conversation.lastMessage = {
      text: text ? (text.length > 200 ? text.slice(0, 197) + '...' : text) : null,
      sender: me,
      createdAt: message.createdAt
    };
    conversation.updatedAt = Date.now();
    await conversation.save();
    await message.populate('sender', 'name profilePicUrl');
    const io = getIO(req);
    if (io) {
      io.to(String(conversation._id)).emit('newMessage', {
        conversationId: String(conversation._id),
        message
      });
    }

    return res.status(201).json({ message });
  } catch (err) {
    console.error('sendMessage error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const me = req.user.id;
    const conversationId = req.params.conversationId;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ msg: 'Invalid conversationId' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });

    if (!conversation.participants.map(p => p.toString()).includes(me)) {
      return res.status(403).json({ msg: 'Not a participant' });
    }

    const total = await Message.countDocuments({ conversation: conversationId });
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name profilePicUrl')
      .lean();

    return res.json({ page, limit, total, messages });
  } catch (err) {
    console.error('getMessages error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const me = req.user.id;
    const { conversationId } = req.params;
    const { messageIds } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ msg: 'Invalid conversationId' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });
    if (!conversation.participants.map(p => p.toString()).includes(me)) {
      return res.status(403).json({ msg: 'Not a participant' });
    }
    const query = { conversation: conversationId, readBy: { $ne: me } };
    if (Array.isArray(messageIds) && messageIds.length) {
      const validIds = messageIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      query._id = { $in: validIds };
    }

    const result = await Message.updateMany(query, { $push: { readBy: me } });
    const io = getIO(req);
    if (io) {
      io.to(String(conversation._id)).emit('messagesRead', { conversationId: String(conversation._id), userId: me, updatedCount: result.nModified || result.modifiedCount });
    }

    return res.json({ updated: result.modifiedCount ?? result.nModified ?? 0 });
  } catch (err) {
    console.error('markAsRead error', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};
