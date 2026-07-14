const { db, admin } = require('../../config/firebase');
const { sendPushNotification } = require("../../helpers/notificationHelper");
const {
    Merchant,
    Branch,
    Customer,
    UserNotificationToken, admins,Receptionist
} = require('../../models');
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
                message: "Admin not found"
            });
        }

        await db
            .collection("chats")
            .doc(chatId)
            .collection("messages")
            .add({
                senderId: String(senderId),
                senderRole: "admin",
                senderName: adminUser.name || "ADMIN",
                type: "text",
                content,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        await db
            .collection("chats")
            .doc(chatId)
            .update({
                lastMessage: content,
                lastMessageBy: "admin",
                lastMessageAt: admin.firestore.FieldValue.serverTimestamp()
            });

        const chatDoc = await db.collection("chats").doc(chatId).get();

        if (chatDoc.exists) {

            const chatData = chatDoc.data();
            const customerId = chatData.customerId;
            const branchId = chatData.branchId;

            const customer = await Customer.findOne({
                where: {
                    id: customerId,
                    del_status: 0
                }
            });
            const branch = await Branch.findOne({
                where: {
                    id: branchId,
                    del_status: 0
                }
            });
            if (customer) {

                const notificationToken = await UserNotificationToken.findOne({
                    where: {
                        user_id: customerId,
                        user_type: "customer"
                    }
                });

                try {

                    if (notificationToken?.token) {
                        await sendPushNotification({
                            token: notificationToken.token,
                            title: branch.name || "Branch",
                            body: content,
                            data: {
                                type: "message",
                                chat_id: chatId,
                                customerId
                            }
                        });
                    }

                } catch (error) {
                    console.error("Push Notification Error:", error);
                }

            }



            if (branch) {

                const notificationToken = await UserNotificationToken.findOne({
                    where: {
                        user_id: branch.merchant_id,
                        user_type: "merchant"
                    }
                });

                let reception_notificationToken = null;

                const receptionist = await Receptionist.findOne({
                    where: {
                        branch_id: branchId,
                        del_status: 0
                    }
                });

                if (receptionist) {
                    reception_notificationToken = await UserNotificationToken.findOne({
                        where: {
                            user_id: receptionist.id,
                            user_type: "receptionist"
                        }
                    });
                }

                try {

                    if (notificationToken?.token) {
                        await sendPushNotification({
                            token: notificationToken.token,
                            title: "FirstPass",
                            body: content,
                            data: {
                                type: "message",
                                chat_id: chatId,
                                branch_id: branchId
                            }
                        });
                    }

                    if (reception_notificationToken?.token) {
                        await sendPushNotification({
                            token: reception_notificationToken.token,
                            title: "FirstPass",
                            body: content,
                            data: {
                                type: "message",
                                chat_id: chatId,
                                branch_id: branchId
                            }
                        });
                    }

                } catch (error) {
                    console.error("Push Notification Error:", error);
                }

            }
        }

        return res.json({
            status: 1,
            message: "Message sent successfully"
        });

    } catch (err) {

        console.error(err);

        return res.json({
            status: 0,
            message: err.message
        });

    }
};