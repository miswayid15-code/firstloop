const { db, admin } = require('../../config/firebase');
const {
    Merchant,
    Coupon,
    RefreshToken,
    Branch,
    Receptionist,
    CustomerFp,
    Customer,
    Banner,
    BranchImage,
    MenuImage,
    CouponApplied,
    Wishlist,
    Appointment
} = require('../../models');
exports.createChat = async (req, res) => {

    try {

        const customerId = req.user.id;

        const {
            branchId
        } = req.body;

        if (!branchId) {

            return res.json({

                status: 0,
                message: 'Branch ID is required'

            });

        }

        const existingChats =
            await db.collection('chats')
                .where('customerId', '==', String(customerId))
                .where('branchId', '==', String(branchId))
                .get();

        if (!existingChats.empty) {

            return res.json({

                status: 1,

                chatId:
                    existingChats.docs[0].id,

                message:
                    'Chat already exists'

            });

        }

        const chatRef =
            await db.collection('chats')
                .add({

                    customerId:
                        String(customerId),

                    branchId:
                        String(branchId),

                    status: 'active',

                    lastMessage: '',

                    createdAt:
                        admin.firestore.FieldValue.serverTimestamp(),

                    lastMessageAt:
                        admin.firestore.FieldValue.serverTimestamp()

                });

        return res.json({

            status: 1,

            chatId: chatRef.id,

            message:
                'Chat created successfully'

        });

    } catch (err) {

        return res.json({

            status: 0,

            message: err.message

        });

    }

};


exports.sendMessage = async (req, res) => {

    try {

        const {
            chatId,
            content
        } = req.body;

        const senderId = req.user.id;

        await db
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .add({

                senderId: String(senderId),

                senderRole: 'customer',

                type: 'text',

                content,

                timestamp:
                    admin.firestore.FieldValue.serverTimestamp()

            });

        await db
            .collection('chats')
            .doc(chatId)
            .update({

                lastMessage: content,

                lastMessageAt:
                    admin.firestore.FieldValue.serverTimestamp()

            });

        return res.json({

            status: 1,

            message: 'Message sent'

        });

    } catch (err) {

        return res.json({

            status: 0,

            message: err.message

        });

    }

};



exports.getBranchChats = async (req, res) => {

    try {
        const receptionist = await Receptionist.findOne({
            where: {
                id: req.user.id
            }
        });

        const branchId = receptionist.branch_id;
        console.log("br", branchId)
        console.log("branchId =", branchId);
        ;


        const snapshot = await db
            .collection('chats')
            .where('branchId', '==', String(branchId))
            .orderBy('lastMessageAt', 'desc')
            .get();
        const chats = [];

        snapshot.forEach(doc => {

            chats.push({

                chatId: doc.id,

                ...doc.data()

            });

        });

        return res.json({

            status: 1,

            data: chats

        });

    } catch (err) {

        return res.json({

            status: 0,

            message: err.message

        });

    }

};

exports.getChatMessages = async (req, res) => {

    try {

        const { chatId } = req.body;
        // console.log("chatId =", chatId);
        const snapshot = await db
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .get();

        const messages = [];

        snapshot.forEach(doc => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return res.json({
            status: 1,
            data: messages
        });

    } catch (err) {

        return res.json({
            status: 0,
            message: err.message
        });

    }

};

exports.sendBranchMessage = async (req, res) => {

    try {
        const user = req.merchant || req.receptionist;

        const userType = req.merchant
            ? 'merchant'
            : 'receptionist';

        let senderId = '';
        let senderRole = '';
        let branchId = '';

        if (userType == 'merchant') {

            senderId = String(req.merchant.id);
            senderRole = 'merchant';

            branchId = String(req.body.branchId);
        } else {

            const receptionist = await Receptionist.findOne({
                where: {
                    id: req.receptionist.id
                }
            });

            senderId = String(receptionist.id);
            senderRole = 'receptionist';

            branchId = String(receptionist.branch_id);
        }

        const {
            chatId,
            message
        } = req.body;

        if (!chatId || !message) {

            return res.json({
                status: 0,
                message: 'Chat ID and message are required'
            });

        }

        const timestamp = new Date();

        await db
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .add({

                senderId,
                senderRole,
                type: 'text',
                content: message,
                timestamp: new Date()

            });

        await db
            .collection('chats')
            .doc(chatId)
            .update({

                lastMessage: message,

                lastMessageAt: timestamp

            });

        return res.json({

            status: 1,

            message: 'Message sent successfully'

        });

    } catch (err) {

        return res.json({

            status: 0,

            message: err.message

        });

    }

};