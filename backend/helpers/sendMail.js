const nodemailer = require("nodemailer");

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
    // console.log({
    //     type,
    //     to,
    //     subject
    // });

    try {
        const transporter =
            type === "customer"
                ? customerTransporter
                : merchantTransporter;

        const from =
            type === "customer"
                ? `"FirstPass" <${process.env.MAIL_USER_CUSTOMER}>`
                : `"FirstPass" <${process.env.MAIL_USER}>`;

        await transporter.sendMail({
            from,
            to,
            subject,
            html,
        });

        return true;
    } catch (err) {
        console.error("EMAIL ERROR:", err);
        return false;
    }
};

module.exports = sendMail;