
const { sendPushNotification ,getNotificationTemplate} = require("../../helpers/notificationHelper");
const { db, admin, bucket } = require('../../config/firebase');
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const upload = multer({
    storage: multer.memoryStorage(),
});
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
    Appointment, UserNotificationToken
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

        // console.log("========== SEND MESSAGE ==========");
        // console.log("Body:", req.body);
        // console.log("Files:", req.files);

        const { chatId, content } = req.body;

        if (!chatId) {
            return res.json({
                status: 0,
                message: "Chat ID is required"
            });
        }

        const senderId = req.user.id;

        const customer = await Customer.findOne({
            where: {
                id: senderId
            }
        });

        let type = "text";
        let imageUrl = "";

        // Find uploaded image (because middleware uses .any())
        const file = req.files?.find(f => f.fieldname === "image");

        if (file) {

            console.log("Uploading image to Firebase...");

            const fileName = `chat_images/${uuidv4()}_${file.originalname}`;

            console.log("Firebase File:", fileName);

            const firebaseFile = bucket.file(fileName);

            await firebaseFile.save(
                fs.readFileSync(file.path),
                {
                    metadata: {
                        contentType: file.mimetype
                    }
                }
            );

            await firebaseFile.makePublic();

            imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

            console.log("Image URL:", imageUrl);

            // Delete temporary local file
            fs.unlinkSync(file.path);

            type = "image";
        }

        // Save message
        await db
            .collection("chats")
            .doc(chatId)
            .collection("messages")
            .add({
                senderId: String(senderId),
                senderRole: "customer",
                senderName: customer?.name || "",
                type,
                content: content || "",
                imageUrl,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

        // Update chat
        await db
            .collection("chats")
            .doc(chatId)
            .update({
                customerName: customer?.name || "",
                lastMessage: type === "image" ? "📷 Image" : (content || ""),
                lastMessageAt: admin.firestore.FieldValue.serverTimestamp()
            });

        // Get chat details
        const chatDoc = await db.collection("chats").doc(chatId).get();

        if (chatDoc.exists) {

            const chatData = chatDoc.data();
            const branchId = chatData.branchId;

            const branch = await Branch.findOne({
                where: {
                    id: branchId,
                    del_status: 0
                }
            });

            if (branch) {

                // Merchant token
                const merchantToken = await UserNotificationToken.findOne({
                    where: {
                        user_id: branch.merchant_id,
                        user_type: "merchant"
                    }
                });

                // Receptionist token
                let receptionistToken = null;

                const receptionist = await Receptionist.findOne({
                    where: {
                        branch_id: branchId,
                        del_status: 0
                    }
                });

                if (receptionist) {
                    receptionistToken = await UserNotificationToken.findOne({
                        where: {
                            user_id: receptionist.id,
                            user_type: "receptionist"
                        }
                    });
                }

                try {

                    if (merchantToken?.token) {
                        await sendPushNotification({
                            token: merchantToken.token,
                            title: customer?.name || "Customer",
                            body: type === "image" ? "📷 Image" : (content || ""),
                            data: {
                                type: "message",
                                chat_id: chatId,
                                branch_id: branchId
                            }
                        });
                    }

                    if (receptionistToken?.token) {
                        await sendPushNotification({
                            token: receptionistToken.token,
                            title: customer?.name || "Customer",
                            body: type === "image" ? "📷 Image" : (content || ""),
                            data: {
                                type: "message",
                                chat_id: chatId,
                                branch_id: branchId
                            }
                        });
                    }

                } catch (err) {
                    console.log("Push Notification Error:", err);
                }
            }
        }

        // console.log("========== SUCCESS ==========");

        return res.json({
            status: 1,
            message: "Message sent successfully",
            data: {
                type,
                content,
                imageUrl
            }
        });

    } catch (err) {

        // console.log("========== ERROR ==========");
        console.error(err);

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

        // console.log("========== SEND BRANCH MESSAGE ==========");
        // console.log("Body:", req.body);
        // console.log("Files:", req.files);

        const user = req.merchant || req.receptionist;

        const userType = req.merchant
            ? "merchant"
            : "receptionist";

        let senderId = "";
        let senderRole = "";
        let branchId = "";
        let senderName = "";

        if (userType === "merchant") {

            senderId = String(req.merchant.id);
            senderRole = "merchant";
            senderName =
                req.merchant.bus_name ||
                req.merchant.name ||
                "";

            branchId = String(req.body.branchId);

        } else {

            const receptionist = await Receptionist.findOne({
                where: {
                    id: req.receptionist.id
                }
            });

            senderId = String(receptionist.id);
            senderRole = "receptionist";
            senderName = receptionist.name || "";
            branchId = String(receptionist.branch_id);
        }

        const { chatId, message } = req.body;

        if (!chatId) {
            return res.json({
                status: 0,
                message: "Chat ID is required"
            });
        }

        let type = "text";
        let imageUrl = "";

        // Get uploaded image
        const file = req.files?.find(f => f.fieldname === "image");

        if (file) {

            console.log("Uploading image to Firebase...");

            const fileName = `chat_images/${uuidv4()}_${file.originalname}`;

            const firebaseFile = bucket.file(fileName);

            await firebaseFile.save(
                fs.readFileSync(file.path),
                {
                    metadata: {
                        contentType: file.mimetype
                    }
                }
            );

            await firebaseFile.makePublic();

            imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

            console.log("Image URL:", imageUrl);

            // Delete temporary file
            fs.unlinkSync(file.path);

            type = "image";
        }

        const timestamp = new Date();

        await db
            .collection("chats")
            .doc(chatId)
            .collection("messages")
            .add({
                senderId,
                senderRole,
                senderName,
                type,
                content: message || "",
                imageUrl,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        await db
            .collection("chats")
            .doc(chatId)
            .update({
                lastMessage: type === "image" ? "📷 Image" : (message || ""),
                lastMessageAt: admin.firestore.FieldValue.serverTimestamp()
            });

        const chatDoc = await db.collection("chats").doc(chatId).get();

        if (chatDoc.exists) {

            const chatData = chatDoc.data();
            const customerId = chatData.customerId;

            const customer = await Customer.findOne({
                where: {
                    id: customerId,
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
                            title: senderName || "Merchant",
                            body: type === "image" ? "📷 Image" : (message || ""),
                            data: {
                                type: "message",
                                chat_id: chatId,
                                customerId: customerId
                            }
                        });

                    }

                } catch (error) {
                    console.error("Push Notification Error:", error);
                }
            }
        }

        // console.log("========== SUCCESS ==========");

        return res.json({
            status: 1,
            message: "Message sent successfully",
            data: {
                type,
                message,
                imageUrl
            }
        });

    } catch (err) {

        // console.log("========== ERROR ==========");
        console.error(err);

        return res.json({
            status: 0,
            message: err.message
        });
    }
};


exports.sendNotification = async (req, res) => {
    try {
        const { br_id, ch_id } = req.body;

        if (!br_id) {
            return res.json({
                status: 0,
                message: "branch id is required"
            });
        }

        const branch = await Branch.findOne({
            where: {
                id: br_id,
                status: 1,
                del_status: 0
            }
        });

        if (!branch) {
            return res.json({
                status: 0,
                message: "Branch not found"
            });
        }

        const receptionist = await Receptionist.findOne({
            where: {
                branch_id: branch.id,
                status: 1,
                del_status: 0
            }
        });

        const merchantToken = await UserNotificationToken.findOne({
            where: {
                user_id: branch.merchant_id,
                user_type: "merchant"
            }
        });

        const notification = {
            title: "New Chat Message",
            body: "You have received a new chat message"
        };

        if (merchantToken?.token) {
            try {
                await sendPushNotification({
                    token: merchantToken.token,
                    ...notification,
                    data: {
                        type: "chat",
                        ch_id: String(ch_id || ""),
                        branch_id: String(branch.id)
                    }
                });
            } catch (err) {
                console.log(
                    "Merchant Push Notification Error:",
                    err
                );
            }
        }

        if (receptionist) {
            const receptionToken =
                await UserNotificationToken.findOne({
                    where: {
                        user_id: receptionist.id,
                        user_type: "receptionist"
                    }
                });

            if (receptionToken?.token) {
                try {
                    await sendPushNotification({
                        token: receptionToken.token,
                        ...notification,
                        data: {
                            type: "chat",
                            ch_id: String(ch_id || ""),
                            branch_id: String(branch.id)
                        }
                    });
                } catch (err) {
                    console.log(
                        "Receptionist Push Notification Error:",
                        err
                    );
                }
            }
        }

        return res.json({
            status: 1,
            message: "Notification sent successfully"
        });

    } catch (err) {
        console.log("Error:", err);

        return res.json({
            status: 0,
            message: err.message
        });
    }
};

exports.sendCustomerNotification = async (req, res) => {
    try {
        const { cus_id, ch_id } = req.body;

        if (!cus_id) {
            return res.json({
                status: 0,
                message: "Customer id is required"
            });
        }

        const cus = await Customer.findOne({
            where: {
                id: cus_id,
                status: 1,
                del_status: 0
            }
        });

        if (!cus) {
            return res.json({
                status: 0,
                message: "Customer is not found"
            });
        }

        const customerToken = await UserNotificationToken.findOne({
            where: {
                user_id: cus.id,
                user_type: "customer",
                is_active: 1
            }
        });

        if (!customerToken) {
            return res.json({
                status: 0,
                message: "Customer notification token not found"
            });
        }

        if (!customerToken.token) {
            return res.json({
                status: 0,
                message: "Customer notification token is empty"
            });
        }

        await sendPushNotification({
            token: customerToken.token,
            title: "New Chat Message",
            body: "You have received a new chat message",
            data: {
                type: "chat",
                ch_id: String(ch_id || ""),
                customer_id: String(cus.id)
            }
        });

        return res.json({
            status: 1,
            message: "Notification sent successfully"
        });

    } catch (err) {
        console.log("Error:", err);

        return res.json({
            status: 0,
            message: err.message
        });
    }
};