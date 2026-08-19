
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

        console.log("==============================================");
        console.log("🚀 SEND NOTIFICATION STARTED");
        console.log("==============================================");

        // ==========================================
        // REQUEST
        // ==========================================

        console.log("📥 Request body:", req.body);

        const { br_id, ch_id } = req.body;

        console.log("📌 br_id:", br_id);
        console.log("📌 ch_id:", ch_id);

        // ==========================================
        // VALIDATION
        // ==========================================

        if (!br_id) {

            console.log("❌ Branch ID is missing");

            return res.json({
                status: 0,
                message: "branch id is required"
            });
        }

        console.log("✅ Branch ID validation passed");


        // ==========================================
        // GET BRANCH
        // ==========================================

        console.log("----------------------------------------------");
        console.log("🔍 Finding branch...");
        console.log("Branch ID:", br_id);

        const branch = await Branch.findOne({
            where: {
                id: br_id,
                status: 1,
                del_status: 0
            }
        });

        console.log("📦 Branch result:", branch);

        if (!branch) {

            console.log("❌ Branch not found");

            return res.json({
                status: 0,
                message: "Branch not found"
            });
        }

        console.log("✅ Branch found");
        console.log("Branch ID:", branch.id);
        console.log("Merchant ID:", branch.merchant_id);


        // ==========================================
        // GET RECEPTIONIST
        // ==========================================

        console.log("----------------------------------------------");
        console.log("🔍 Finding receptionist...");
        console.log("Branch ID:", branch.id);

        const receptionist = await Receptionist.findOne({
            where: {
                branch_id: branch.id,
                status: 1,
                del_status: 0
            }
        });

        console.log(
            "📦 Receptionist result:",
            receptionist
        );

        if (receptionist) {

            console.log("✅ Receptionist found");
            console.log(
                "Receptionist ID:",
                receptionist.id
            );

        } else {

            console.log(
                "⚠️ No active receptionist found"
            );
        }


        // ==========================================
        // GET MERCHANT TOKEN
        // ==========================================

        console.log("----------------------------------------------");
        console.log("🔍 Finding merchant notification token...");

        console.log(
            "Merchant ID:",
            branch.merchant_id
        );

        const merchantToken =
            await UserNotificationToken.findOne({
                where: {
                    user_id: branch.merchant_id,
                    user_type: "merchant"
                }
            });

        console.log(
            "📦 Merchant token result:",
            merchantToken
        );

        if (merchantToken) {

            console.log(
                "✅ Merchant notification token record found"
            );

            console.log(
                "Merchant token exists:",
                !!merchantToken.token
            );

            console.log(
                "Merchant token length:",
                merchantToken.token
                    ? merchantToken.token.length
                    : 0
            );

        } else {

            console.log(
                "❌ Merchant notification token NOT FOUND"
            );
        }


        // ==========================================
        // NOTIFICATION DATA
        // ==========================================

        console.log("----------------------------------------------");
        console.log("📝 Creating notification...");

        const notification = {
            title: "New Chat Message",
            body: "You have received a new chat message"
        };

        console.log(
            "Notification:",
            notification
        );


        // ==========================================
        // SEND TO MERCHANT
        // ==========================================

        console.log("----------------------------------------------");
        console.log("📤 MERCHANT NOTIFICATION");

        if (merchantToken?.token) {

            console.log(
                "✅ Merchant token available"
            );

            const merchantPayload = {
                token: merchantToken.token,

                ...notification,

                data: {
                    type: "chat",
                    ch_id: String(ch_id || ""),
                    branch_id: String(branch.id)
                }
            };

            console.log(
                "Merchant notification payload:",
                {
                    ...merchantPayload,
                    token: "***TOKEN***"
                }
            );

            try {

                console.log(
                    "⏳ Calling sendPushNotification for merchant..."
                );

                const merchantResponse =
                    await sendPushNotification(
                        merchantPayload
                    );

                console.log(
                    "✅ Merchant notification sent"
                );

                console.log(
                    "Merchant response:",
                    merchantResponse
                );

            } catch (err) {

                console.log(
                    "❌ Merchant Push Notification Error"
                );

                console.log(
                    "Error message:",
                    err.message
                );

                console.log(
                    "Full error:",
                    err
                );

                console.log(
                    "Stack:",
                    err.stack
                );
            }

        } else {

            console.log(
                "⚠️ Merchant notification skipped"
            );

            console.log(
                "Reason: Merchant token not available"
            );
        }


        // ==========================================
        // RECEPTIONIST TOKEN
        // ==========================================

        console.log("----------------------------------------------");
        console.log("🔍 RECEPTIONIST NOTIFICATION");

        if (receptionist) {

            console.log(
                "Finding receptionist notification token..."
            );

            console.log(
                "Receptionist ID:",
                receptionist.id
            );

            const receptionToken =
                await UserNotificationToken.findOne({
                    where: {
                        user_id: receptionist.id,
                        user_type: "receptionist"
                    }
                });

            console.log(
                "📦 Receptionist token result:",
                receptionToken
            );

            if (receptionToken) {

                console.log(
                    "✅ Receptionist token record found"
                );

                console.log(
                    "Receptionist token exists:",
                    !!receptionToken.token
                );

                console.log(
                    "Receptionist token length:",
                    receptionToken.token
                        ? receptionToken.token.length
                        : 0
                );

            } else {

                console.log(
                    "❌ Receptionist token NOT FOUND"
                );
            }


            // ==========================================
            // SEND TO RECEPTIONIST
            // ==========================================

            if (receptionToken?.token) {

                console.log(
                    "📤 Sending notification to receptionist..."
                );

                const receptionistPayload = {
                    token: receptionToken.token,

                    ...notification,

                    data: {
                        type: "chat",
                        ch_id: String(ch_id || ""),
                        branch_id: String(branch.id)
                    }
                };

                console.log(
                    "Receptionist notification payload:",
                    {
                        ...receptionistPayload,
                        token: "***TOKEN***"
                    }
                );

                try {

                    console.log(
                        "⏳ Calling sendPushNotification for receptionist..."
                    );

                    const receptionistResponse =
                        await sendPushNotification(
                            receptionistPayload
                        );

                    console.log(
                        "✅ Receptionist notification sent"
                    );

                    console.log(
                        "Receptionist response:",
                        receptionistResponse
                    );

                } catch (err) {

                    console.log(
                        "❌ Receptionist Push Notification Error"
                    );

                    console.log(
                        "Error message:",
                        err.message
                    );

                    console.log(
                        "Full error:",
                        err
                    );

                    console.log(
                        "Stack:",
                        err.stack
                    );
                }

            } else {

                console.log(
                    "⚠️ Receptionist notification skipped"
                );

                console.log(
                    "Reason: Receptionist token not available"
                );
            }

        } else {

            console.log(
                "⚠️ Receptionist notification skipped"
            );

            console.log(
                "Reason: Receptionist not found"
            );
        }


        // ==========================================
        // COMPLETED
        // ==========================================

        console.log("==============================================");
        console.log("✅ SEND NOTIFICATION COMPLETED");
        console.log("==============================================");

        return res.json({
            status: 1,
            message: "Notification sent successfully"
        });

    } catch (err) {

        console.log("==============================================");
        console.log("❌ SEND NOTIFICATION MAIN ERROR");
        console.log("==============================================");

        console.log(
            "Error message:",
            err.message
        );

        console.log(
            "Full error:",
            err
        );

        console.log(
            "Stack:",
            err.stack
        );

        console.log("==============================================");

        return res.json({
            status: 0,
            message: err.message
        });
    }
};