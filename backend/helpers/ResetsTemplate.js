// helpers/ResetsTemplate.js

const ResetsTemplate = (type, name = 'User') => {

    const currentYear = new Date().getFullYear();
    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const logoUrl = `${appUrl}/uploads/public/FirstPass-logo.png`;

    const config =
        type === 'merchant'
            ? {
                title: 'Merchant Password Reset',
                subtitle: 'Your merchant account credentials have been successfully reset.',
                headerBg: 'radial-gradient(circle at top right, #fff5f5 0%, #ffffff 70%)',
                gradientBar: 'linear-gradient(90deg, #ff4d4d 0%, #c1121f 50%, #780000 100%)',
                iconGradient: 'linear-gradient(135deg, #c1121f, #780000)',
                primary: '#c1121f',
                dark: '#780000',
                light: '#fffcfc',
                border: '#fce8e8',
                cardBorder: '#ffebeb',
                shadowColor: 'rgba(193, 18, 31, 0.2)',
                tagline: 'Manage Offers • Track Performance • Grow Your Brand • Real-Time Analytics',
            }
            : type === 'customer'
                ? {
                    title: 'Customer Password Reset',
                    subtitle: 'Your account credentials have been successfully reset.',
                    headerBg: 'radial-gradient(circle at top right, #f5f5ff 0%, #ffffff 70%)',
                    gradientBar: 'linear-gradient(90deg, #667eea 0%, #4f46e5 50%, #3730a3 100%)',
                    iconGradient: 'linear-gradient(135deg, #4f46e5, #3730a3)',
                    primary: '#4f46e5',
                    dark: '#3730a3',
                    light: '#fafaff',
                    border: '#e8e8ff',
                    cardBorder: '#e8e8ff',
                    shadowColor: 'rgba(79, 70, 229, 0.2)',
                    tagline: 'Exclusive Deals • Smart Coupons • Trusted Offers • Global Experience',
                }
                : {
                    title: 'Receptionist Password Reset',
                    subtitle: 'Your receptionist account credentials have been successfully reset.',
                    headerBg: 'radial-gradient(circle at top right, #fff5fa 0%, #ffffff 70%)',
                    gradientBar: 'linear-gradient(90deg, #ff5fa2 0%, #ff4f8b 50%, #c2185b 100%)',
                    iconGradient: 'linear-gradient(135deg, #ff4f8b, #c2185b)',
                    primary: '#ff4f8b',
                    dark: '#c2185b',
                    light: '#fff4f8',
                    border: '#ffd6e5',
                    cardBorder: '#ffd6e5',
                    shadowColor: 'rgba(255, 79, 139, 0.2)',
                    tagline: 'Smooth Check-Ins • Appointment Management • Seamless Coordination',
                };

    return `
<div style="margin:0;padding:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

    <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 25px 70px rgba(0,0,0,0.07);border:1px solid #eef2f5;">

        <!-- Top Accent Bar -->
        <div style="height:6px;background:${config.gradientBar};"></div>

        <!-- Header -->
        <div style="
                padding:60px 40px 45px;
                text-align:center;
                background:${config.headerBg};
                border-bottom:1px solid #f0f4f8;
                ">

            <div style="
                    width:130px;
                    height:130px;
                    margin:0 auto 28px;
                    background:#ffffff;
                    border-radius:32px;
                    box-shadow:0 20px 40px ${config.shadowColor};
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    border:1px solid ${config.cardBorder};
                    ">

                <img
                    src="${logoUrl}"
                    alt="FirstPass"
                    style="
                        max-width:130px;
                        max-height:130px;
                        display:block;
                        object-fit: contain;
                        ">
            </div>

            <h1 style="
                    margin:0;
                    color:#1a1a1a;
                    font-size:32px;
                    font-weight:800;
                    letter-spacing:-0.8px;
                    line-height: 1.2;
                    ">
                ${config.title}
            </h1>

            <p style="
                    margin:12px 0 0;
                    color:#626d7a;
                    font-size:16px;
                    line-height:1.6;
                    font-weight: 500;
                    ">
                ${config.subtitle}
            </p>

        </div>

        <!-- Body -->
        <div style="padding:45px 50px;color:#333333;background:#ffffff;">

            <p style="
                    margin:0;
                    color:#1a1a1a;
                    font-size:16px;
                    font-weight:600;
                    ">
                Hello <strong>${name}</strong>,
            </p>

            <p style="
                    margin:16px 0 32px;
                    color:#4a5568;
                    font-size:15.5px;
                    line-height:1.8;
                    ">
                This is a confirmation that your <strong>FirstPass</strong> account password has been changed. You can now log in securely using your new credentials.
            </p>

            <!-- Success Card -->
            <div style="
                background:linear-gradient(135deg, #ffffff 0%, #fffbfb 100%);
                border:1px solid ${config.border};
                border-radius:20px;
                padding:35px 24px;
                text-align:center;
                box-shadow:0 15px 35px rgba(0,0,0,0.03);
                margin-bottom:35px;
                ">

                <div style="
                    width:56px;
                    height:56px;
                    margin:0 auto 20px;
                    border-radius:18px;
                    background:${config.iconGradient};
                    color:#ffffff;
                    font-size:24px;
                    line-height:56px;
                    font-weight:bold;
                    box-shadow:0 10px 22px ${config.shadowColor};
                    ">
                    ✓
                </div>

                <div style="
                    color:${config.primary};
                    font-size:12px;
                    font-weight:800;
                    letter-spacing:2px;
                    text-transform:uppercase;
                    margin-bottom:16px;
                    ">
                    Security Update Complete
                </div>

                <h2 style="margin:0;color:#1a1a1a;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
                    Password Successfully Reset
                </h2>

                <p style="
                    margin:16px 0 0;
                    color:#718096;
                    font-size:14px;
                    font-weight: 500;
                    ">
                    Please use your updated, unique password for all future <strong style="color:${config.primary}; font-weight:700;">FirstPass</strong> app logins.
                </p>

            </div>

            <!-- Info Cards -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px; border-collapse: separate; border-spacing: 0;">
                <tr>
                    <td width="48%" valign="top" style="
                            background:#fafbfc;
                            border:1px solid #e2e8f0;
                            border-radius:16px;
                            padding:22px;
                            ">
                        <div style="font-size:20px; margin-bottom:12px;">🛡️</div>
                        <div style="font-size:15px; font-weight:700; color:#1a1a1a; margin-bottom:8px;">
                            Security Notice
                        </div>
                        <div style="color:#64748b; line-height:1.6; font-size:13.5px;">
                            Never share your password with anyone. FirstPass will never reach out directly to ask for your login credentials.
                        </div>
                    </td>

                    <td width="4%"></td>

                    <td width="48%" valign="top" style="
                            background:#fafbfc;
                            border:1px solid #e2e8f0;
                            border-radius:16px;
                            padding:22px;
                            ">
                        <div style="font-size:20px; margin-bottom:12px;">ℹ️</div>
                        <div style="font-size:15px; font-weight:700; color:#1a1a1a; margin-bottom:8px;">
                            Didn't Request This?
                        </div>
                        <div style="color:#64748b; line-height:1.6; font-size:13.5px;">
                            If you did not request this password change, please contact our support team immediately to secure your account.
                        </div>
                    </td>
                </tr>
            </table>

            <div style="height:1px; background:#f0f4f8; margin:32px 0;"></div>

            <p style="
                    margin:0;
                    text-align:center;
                    color:#718096;
                    font-size:14px;
                    line-height:1.8;
                    font-weight: 500;
                    ">
                FirstPass helps protect your account while giving you access to exclusive offers, premium deals, and everyday savings.
            </p>

        </div>

        <!-- Tagline Strip -->
        <div style="background:linear-gradient(135deg, #0f1115 0%, #1a1d24 100%);padding:22px 30px;text-align:center;border-bottom: 1px solid #242933;">
            <p style="margin:0;color:#f7fafc;font-size:13px;line-height:1.6;letter-spacing: 0.5px;font-weight: 500;">
                ${config.tagline}
            </p>
        </div>

        <!-- Footer -->
        <div style="background:#fafbfc;padding:35px 40px;text-align:center;">
            <p style="margin:0 0 12px;color:#4a5568;font-size:14px;font-weight: 500;">
                Thank you for choosing FirstPass.
            </p>
            <p style="margin:0;color:#a0aec0;font-size:12px;line-height:1.7;">
                This is an automated email to confirm your password reset. Please do not reply directly to this inbox.
            </p>
            <div style="margin:20px auto 0; width:40px; height:2px; background:#e2e8f0; border-radius:2px;"></div>
            <p style="margin:20px 0 0;color:#a0aec0;font-size:12px;letter-spacing: 0.2px;">
                © ${currentYear} FirstPass. All Rights Reserved.
            </p>
        </div>

    </div>

</div>
    `;
};

module.exports = ResetsTemplate;