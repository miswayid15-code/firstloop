const { db, admin, bucket } = require("../../config/firebase");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const upload = multer({
    storage: multer.diskStorage({}),
});
const { sendPushNotification } = require("../../helpers/notificationHelper");
const {
    Merchant,
    Branch,
    Customer,
    UserNotificationToken, admins, Receptionist
} = require('../../models');
exports.sendMessage = async (req, res) => {
    try {
        const { chatId, content } = req.body;
        const senderId = req.user.id;

        if (!chatId) {
            return res.json({
                status: 0,
                message: "Chat ID is required"
            });
        }

        const adminUser = await admins.findOne({
            where: { id: senderId }
        });

        if (!adminUser) {
            return res.json({
                status: 0,
                message: "Admin not found"
            });
        }

        let type = "text";
        let imageUrl = "";

        const file = req.files?.find(f => f.fieldname === "image");

        if (file) {
            const fileName = `chat_images/${chatId}/${uuidv4()}_${file.originalname}`;

            console.log("========== NEW CONTROLLER ==========");
            console.log("Chat ID:", chatId);
            console.log("Uploading to Firebase:", fileName);

            try {
                const firebaseFile = bucket.file(fileName);

                await firebaseFile.save(
                    fs.readFileSync(file.path),
                    {
                        metadata: {
                            contentType: file.mimetype
                        }
                    }
                );

                // Remove this line if your bucket uses Uniform Bucket-Level Access
                await firebaseFile.makePublic();

                imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

                console.log("Image Uploaded:", imageUrl);

                type = "image";

            } catch (uploadError) {
                console.error("Firebase Upload Error:", uploadError);

                return res.json({
                    status: 0,
                    message: "Image upload failed",
                    error: uploadError.message
                });

            } finally {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
        }

        await db
            .collection("chats")
            .doc(chatId)
            .collection("messages")
            .add({
                senderId: String(senderId),
                senderRole: "admin",
                senderName: adminUser.name || "ADMIN",
                type,
                content: content || "",
                imageUrl,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        await db
            .collection("chats")
            .doc(chatId)
            .update({
                lastMessage: type === "image" ? "📷 Image" : (content || ""),
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
                            title: branch?.name || "Branch",
                            body: type === "image" ? "📷 Image" : (content || ""),
                            data: {
                                type: "message",
                                chat_id: chatId,
                                customerId
                            }
                        });
                    }
                } catch (err) {
                    console.error("Customer Push Error:", err);
                }
            }

            if (branch) {
                const merchantToken = await UserNotificationToken.findOne({
                    where: {
                        user_id: branch.merchant_id,
                        user_type: "merchant"
                    }
                });

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
                            title: "FirstPass",
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
                            title: "FirstPass",
                            body: type === "image" ? "📷 Image" : (content || ""),
                            data: {
                                type: "message",
                                chat_id: chatId,
                                branch_id: branchId
                            }
                        });
                    }
                } catch (err) {
                    console.error("Merchant/Receptionist Push Error:", err);
                }
            }
        }

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
        console.error("Send Message Error:", err);

        return res.json({
            status: 0,
            message: err.message
        });
    }
};