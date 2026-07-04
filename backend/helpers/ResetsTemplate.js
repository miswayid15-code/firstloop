// helpers/ResetsTemplate.js

const ResetsTemplate = (type = 'merchant', name = 'User') => {

    const currentYear = new Date().getFullYear();
    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const logoUrl = `${appUrl}/uploads/public/firstpass.png`;

    const config = type === 'merchant'
        ? {
            title: 'Merchant Password Reset',
            headerBg: '#ffffff',
            gradientBar: 'linear-gradient(90deg,#8f090e 0%,#c0392b 50%,#6b0000 100%)',
            iconGradient: 'linear-gradient(135deg,#8f090e,#6b0000)',
            primary: '#8f090e',
            light: '#fdf4f4',
            border: '#f5dada',
            shadowColor: 'rgba(143,9,14,0.18)',
            tagline: 'Manage Offers &bull; Track Performance &bull; Grow Your Brand &bull; Real-Time Analytics',
        }
        : {
            title: 'Customer Password Reset',
            headerBg: '#ffffff',
            gradientBar: 'linear-gradient(90deg,#2575fc 0%,#4f46e5 50%,#3730a3 100%)',
            iconGradient: 'linear-gradient(135deg,#4f46e5,#3730a3)',
            primary: '#2575fc',
            light: '#f4f8ff',
            border: '#dde8ff',
            shadowColor: 'rgba(37,117,252,0.18)',
            tagline: 'Exclusive Deals &bull; Smart Coupons &bull; Trusted Offers &bull; Global Experience',
        };

    return `
<div style="margin:0;padding:0;background:#f3f5fb;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);border:1px solid #eef2f5;">

    <!-- TOP ACCENT BAR -->
    <div style="height:5px;background:${config.gradientBar};"></div>

    <!-- HEADER -->
    <div style="
        padding:50px 40px 40px;
        text-align:center;
        background:${config.headerBg};
        border-bottom:1px solid #f0f4f8;
    ">
        <!-- LOGO BOX -->
        <div style="
            display:inline-block;
            background:#ffffff;
            border-radius:16px;
            padding:14px 24px;
            border:1px solid ${config.border};
            margin-bottom:28px;
        ">
            <img
                src="${logoUrl}"
                alt="FirstPass"
                style="max-width:150px;height:auto;display:block;"
            />
        </div>

        <!-- LOCK ICON -->
        <div style="
            width:64px;
            height:64px;
            margin:0 auto 20px;
            border-radius:18px;
            background:${config.iconGradient};
            color:#ffffff;
            font-size:28px;
            line-height:64px;
            font-weight:bold;
            text-align:center;
        ">&#128274;</div>

        <h1 style="margin:0 0 10px;color:#1a1a1a;font-size:28px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">
            Password Reset Successful
        </h1>
        <p style="margin:0;color:#626d7a;font-size:15px;line-height:1.6;font-weight:500;">
            Your <strong>FirstPass</strong> account credentials have been updated.
        </p>
    </div>

    <!-- BODY -->
    <div style="padding:40px 45px 30px;color:#333333;background:#ffffff;">

        <p style="margin:0 0 6px;color:#1a1a1a;font-size:16px;font-weight:700;">
            Hello, ${name}
        </p>
        <p style="margin:0 0 28px;color:#4a5568;font-size:15px;line-height:1.8;">
            Your <strong>FirstPass</strong> account password has been reset successfully.
            You can now log in securely using your new credentials.
        </p>

        <!-- SUCCESS CARD -->
        <div style="
            background:${config.light};
            border:1px solid ${config.border};
            border-left:4px solid ${config.primary};
            border-radius:0 12px 12px 0;
            padding:22px 24px;
            margin-bottom:24px;
        ">
            <table style="width:100%;font-size:14px;color:#2d3748;border-collapse:collapse;">
                <tr>
                    <td style="padding:5px 0;color:#718096;">Action</td>
                    <td style="padding:5px 0;text-align:right;">
                        <span style="
                            background:#d4edda;
                            color:#155724;
                            font-size:12px;
                            font-weight:600;
                            padding:3px 10px;
                            border-radius:20px;
                        ">Completed</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding:5px 0;color:#718096;border-top:1px solid ${config.border};">Account Type</td>
                    <td style="padding:5px 0;text-align:right;font-weight:600;border-top:1px solid ${config.border};">${type === 'merchant' ? 'Merchant' : 'Customer'}</td>
                </tr>
                <tr>
                    <td style="padding:5px 0;color:#718096;border-top:1px solid ${config.border};">Security Update</td>
                    <td style="padding:5px 0;text-align:right;border-top:1px solid ${config.border};">Password Changed</td>
                </tr>
            </table>
        </div>

        <!-- SECURITY NOTICE -->
        <div style="
            background:#fffbea;
            border:1px solid #f6e68a;
            border-left:4px solid #d4a017;
            border-radius:0 12px 12px 0;
            padding:20px 22px;
            margin-bottom:28px;
        ">
            <p style="margin:0 0 6px;font-size:13px;color:#856404;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">&#128737;&#65039; Security Notice</p>
            <p style="margin:0;color:#4a5568;line-height:1.7;font-size:14px;">
                If you did not request this change, please contact our support team immediately to secure your account.
            </p>
        </div>

        <div style="height:1px;background:#f0f4f8;margin:28px 0;"></div>

        <p style="margin:0;text-align:center;color:#718096;font-size:13px;line-height:1.8;">
            FirstPass gives you access to exclusive offers, premium deals, and everyday savings — all in one place.
        </p>

    </div>

    <!-- TAGLINE STRIP -->
    <div style="background:#111317;padding:18px 30px;text-align:center;">
        <p style="margin:0;color:#f7fafc;font-size:12px;line-height:1.6;letter-spacing:0.5px;">
            ${config.tagline}
        </p>
    </div>

    <!-- FOOTER -->
    <div style="background:#fafbfc;padding:30px 40px;text-align:center;">
        <p style="margin:0 0 10px;color:#4a5568;font-size:13px;font-weight:500;">
            Thank you for choosing FirstPass.
        </p>
        <p style="margin:0;color:#a0aec0;font-size:12px;line-height:1.7;">
            This is an automated security notification. Please do not reply to this email.
        </p>
        <div style="margin:18px auto 0;width:40px;height:2px;background:#e2e8f0;border-radius:2px;"></div>
        <p style="margin:16px 0 0;color:#a0aec0;font-size:12px;">
            &copy; ${currentYear} FirstPass &middot; All Rights Reserved
        </p>
    </div>

</div>
</div>
    `;
};

module.exports = ResetsTemplate;