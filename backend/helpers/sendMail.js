const { Resend } = require('resend');

// console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'FOUND' : 'MISSING');
// console.log('MAIL_USER:', process.env.MAIL_USER);

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async (to, subject, html) => {

    try {

        // console.log('================================');
        // console.log('SENDMAIL FUNCTION CALLED');
        // console.log('TO:', to);
        // console.log('SUBJECT:', subject);
        // console.log('FROM:', process.env.MAIL_USER || 'onboarding@resend.dev');
        // console.log('================================');

        const response = await resend.emails.send({

            from: process.env.MAIL_USER || 'onboarding@resend.dev',

            to,

            subject,

            html

        });

        // console.log('EMAIL SENT SUCCESS');
        // console.log(JSON.stringify(response, null, 2));

        return true;

    } catch (err) {

        console.log('================================');
        console.log('EMAIL ERROR');
        console.log('MESSAGE:', err.message);
        console.log('ERROR:', err);
        console.log('================================');

        return false;

    }

};

module.exports = sendMail;