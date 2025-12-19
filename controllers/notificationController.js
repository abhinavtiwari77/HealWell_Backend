const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .populate('sender', 'name profilePicUrl')
            .populate('post', 'content mediaUrl') // Populate basic post info
            .limit(100); // Increased limit to show more history

        // Count unread
        // We could do this in a separate query if performance becomes an issue
        const unreadCount = notifications.filter(n => !n.isRead).length;

        res.json({ notifications, unreadCount });
    } catch (err) {
        console.error('getNotifications error', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        // If id provided, mark specific one
        if (id && id !== 'all') {
            const notification = await Notification.findById(id);
            if (!notification) {
                return res.status(404).json({ msg: 'Notification not found' });
            }

            // Verify ownership
            if (notification.recipient.toString() !== req.user.id) {
                return res.status(403).json({ msg: 'Not allowed' });
            }

            notification.isRead = true;
            await notification.save();
            return res.json({ msg: 'Marked as read' });
        }

        // If 'all', mark all for user
        if (id === 'all') {
            await Notification.updateMany(
                { recipient: req.user.id, isRead: false },
                { $set: { isRead: true } }
            );
            return res.json({ msg: 'All marked as read' });
        }

        return res.status(400).json({ msg: 'Invalid request' });

    } catch (err) {
        console.error('markAsRead error', err);
        res.status(500).json({ msg: 'Server error' });
    }
};
