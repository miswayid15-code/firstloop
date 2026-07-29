const nodemailer = require("nodemailer");
console.log(process.env.MAIL_USER_CUSTOMER);
console.log(process.env.MAIL_PASS_CUSTOMER);
const merchantTransporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const customerTransporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER_CUSTOMER,
        pass: process.env.MAIL_PASS_CUSTOMER,
    },
});

const sendMail = async (type, to, subject, html) => {
    console.log("\n========== SEND MAIL ==========");
    console.log("Type       :", type);
    console.log("Recipient  :", to);
    console.log("Subject    :", subject);

    const transporter =
        type === "customer"
            ? customerTransporter
            : merchantTransporter;

    const from =
        type === "customer"
            ? `"FirstPass" <${process.env.MAIL_USER_CUSTOMER}>`
            : `"FirstPass" <${process.env.MAIL_USER}>`;

    console.log("From       :", from);
    console.log(
        "Transport  :",
        type === "customer" ? "Customer Mail" : "Merchant Mail"
    );

    if (!to) {
        console.error("❌ Recipient email is missing.");
        console.log("===============================\n");
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html,
        });

        console.log("✅ Email sent successfully");
        console.log("Message ID :", info.messageId);
        console.log("Accepted   :", info.accepted);
        console.log("Rejected   :", info.rejected);
        console.log("Response   :", info.response);
        console.log("===============================\n");

        return true;
    } catch (err) {
        console.error("❌ EMAIL ERROR");
        console.error("Code       :", err.code);
        console.error("Command    :", err.command);
        console.error("Message    :", err.message);
        console.error(err);
        console.log("===============================\n");

        return false;
    }
};

module.exports = sendMail;