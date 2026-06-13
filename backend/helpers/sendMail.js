const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false, // false for 587
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const sendMail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.MAIL_USER,
            to,
            subject,
            html
        });

        console.log('Email Sent:', info.messageId);
        return true;
    } catch (err) {
        console.error('Mail Error:', err);
        return false;
    }
};

module.exports = sendMail;