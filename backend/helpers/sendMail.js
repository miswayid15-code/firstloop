const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async (to, subject, html) => {

    try {

        const response = await resend.emails.send({

            from: process.env.RESEND_FROM_EMAIL,

            to,

            subject,

            html

        });

        console.log("EMAIL SENT:", response);

        return response;

    } catch (err) {

        console.log("RESEND ERROR:", err);

        return null;

    }

};

module.exports = sendMail;