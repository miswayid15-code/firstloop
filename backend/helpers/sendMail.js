const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async (to, subject, html) => {

    try {

        const response = await resend.emails.send({

            from: 'onboarding@resend.dev',

            to,

            subject,

            html

        });

        console.log("EMAIL SENT:", response);

    } catch (err) {

        console.log("RESEND ERROR:", err);

    }

};

module.exports = sendMail;