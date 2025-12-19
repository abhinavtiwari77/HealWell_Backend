const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: null },
  mediaUrl: { type: String, default: null }, 
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

MessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
