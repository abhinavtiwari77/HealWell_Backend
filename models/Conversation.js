const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  ],
  name: { type: String, default: null },
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', default: null },

  lastMessage: {
    text: { type: String, default: null },
    mediaUrl: { type: String, default: null },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date }
  },
  isGroup: { type: Boolean, default: false },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ConversationSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

ConversationSchema.index({ participants: 1, updatedAt: -1 });
ConversationSchema.index({ communityId: 1 });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
