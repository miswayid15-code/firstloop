const { db, admin } = require('../../config/firebase');
const { admins } = require('../../models');

exports.sendMessage = async (req, res) => {
    try {

        const { chatId, content } = req.body;
        const senderId = req.user.id;

        const adminUser = await admins.findOne({
            where: {
                id: senderId
            }
        });

        if (!adminUser) {
            return res.json({
                status: 0,
                message: 'Admin not found'
            });
        }

        await db
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .add({
                senderId: String(senderId),
                senderRole: 'admin',
                senderName: adminUser.name || 'ADMIN',
                type: 'text',
                content: content,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        await db
            .collection('chats')
            .doc(chatId)
            .update({
                lastMessage: content,
                lastMessageBy: 'admin',
                lastMessageAt: admin.firestore.FieldValue.serverTimestamp()
            });

        return res.json({
            status: 1,
            message: 'Message sent successfully'
        });

    } catch (err) {

        console.error(err);

        return res.json({
            status: 0,
            message: err.message
        });

    }
};