// helpers/RegisterTemplate.js

const RegisterTemplate = (type = 'merchant', name = 'User') => {

    const currentYear = new Date().getFullYear();

    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const logoUrl = `${appUrl}/uploads/public/firstpass.png`;
    const loginUrl = `${appUrl}/login`;

    const config = type === 'merchant'
        ? {
            title: 'Welcome to FirstPass',
            subtitle: 'Your Merchant account has been successfully created.',
            gradientBar: 'linear-gradient(90deg, #ff4d4d 0%, #c1121f 50%, #780000 100%)',
            gradientBtn: 'linear-gradient(135deg, #c1121f 0%, #780000 100%)',
            gradientHeader: 'radial-gradient(circle at top right, #fff5f5 0%, #ffffff 70%)',
            primary: '#c1121f',
            dark: '#780000',
            light: '#fffcfc',
            border: '#ffebeb',
            shadowColor: 'rgba(193, 18, 31, 0.25)',
            buttonLabel: 'Access Merchant Dashboard',
            tagline: 'Manage Offers • Track Performance • Grow Your Brand • Real-Time Analytics',
            description: 'Thank you for registering with <strong>FirstPass</strong> as a Merchant. Your account is now active, and you can start listing exclusive deals, coupons, and brand promotions to reach thousands of users.',
            extraLine: 'FirstPass empowers merchants across Oman and international markets with a powerful, easy-to-use dashboard for coupon and offer management.',
        }
        : {
            title: 'Welcome to FirstPass',
            subtitle: 'Your account has been successfully created.',
            gradientBar: 'linear-gradient(90deg, #667eea 0%, #4f46e5 50%, #3730a3 100%)',
            gradientBtn: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            gradientHeader: 'radial-gradient(circle at top right, #f5f5ff 0%, #ffffff 70%)',
            primary: '#4f46e5',
            dark: '#3730a3',
            light: '#fafaff',
            border: '#e8e8ff',
            shadowColor: 'rgba(79, 70, 229, 0.25)',
            buttonLabel: 'Access Your Account',
            tagline: 'Exclusive Deals • Smart Coupons • Trusted Offers • Global Experience',
            description: 'Thank you for registering with <strong>FirstPass</strong>. Your account is now active, and you can start exploring exclusive deals, coupons, brand offers, and book Appointments.',
            extraLine: 'FirstPass is designed to support users across Oman and international markets with a smooth, secure, and professional coupon discovery experience.',
        };

    return `
<div style="margin:0;padding:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

    <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 25px 70px rgba(0,0,0,0.07);border:1px solid #eef2f5;">

        <!-- TOP ACCENT BAR -->
        <div style="height:6px;background:${config.gradientBar};"></div>

        <!-- HEADER -->
        <div style="
            padding:60px 40px 45px;
            text-align:center;
            background:${config.gradientHeader};
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
                border:1px solid ${config.border};
            ">
                <img
                    src="${logoUrl}"
                    alt="FirstPass"
                    style="max-width:110px;max-height:110px;display:block;object-fit:contain;"
                />
            </div>

            <h1 style="
                margin:0;
                color:#1a1a1a;
                font-size:32px;
                font-weight:800;
                letter-spacing:-0.8px;
                line-height:1.2;
            ">
                ${config.title}
            </h1>

            <p style="
                margin:12px 0 0;
                color:#626d7a;
                font-size:16px;
                line-height:1.6;
                font-weight:500;
            ">
                ${config.subtitle}
            </p>
        </div>

        <!-- BODY -->
        <div style="padding:45px 50px;color:#333333;background:#ffffff;">

            <p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;font-weight:500;">
                Dear <strong>${name}</strong>,
            </p>

            <p style="margin:0 0 24px;font-size:15.5px;line-height:1.8;color:#4a5568;">
                ${config.description}
            </p>

            <!-- ACTIVATED BADGE -->
            <div style="background:${config.light};border:1px solid ${config.border};border-radius:20px;padding:24px;margin:35px 0;">
                <div style="display:flex;align-items:center;">
                    <div style="
                        width:48px;
                        height:48px;
                        border-radius:16px;
                        background:${config.gradientBtn};
                        color:#ffffff;
                        text-align:center;
                        line-height:48px;
                        font-size:20px;
                        font-weight:bold;
                        margin-right:18px;
                        box-shadow:0 8px 20px ${config.shadowColor};
                        flex-shrink:0;
                    ">✓</div>
                    <div>
                        <h3 style="margin:0 0 4px;color:#1a1a1a;font-size:17px;font-weight:700;">
                            Account Activated
                        </h3>
                        <p style="margin:0;color:#718096;font-size:14px;line-height:1.5;">
                            Your FirstPass profile is fully active and ready.
                        </p>
                    </div>
                </div>
            </div>

            <p style="margin:0 0 30px;font-size:15.5px;line-height:1.8;color:#4a5568;">
                ${config.extraLine}
            </p>

            <!-- CTA BUTTON -->
            <div style="text-align:center;margin:35px 0 15px;">
                <a href="${loginUrl}"
                    style="
                        background:${config.gradientBtn};
                        color:#ffffff;
                        text-decoration:none;
                        padding:16px 42px;
                        border-radius:14px;
                        font-size:15px;
                        font-weight:700;
                        display:inline-block;
                        box-shadow:0 12px 30px ${config.shadowColor};
                    ">
                    ${config.buttonLabel}
                </a>
            </div>

        </div>

        <!-- TAGLINE BAND -->
        <div style="background:linear-gradient(135deg, #0f1115 0%, #1a1d24 100%);padding:22px 30px;text-align:center;border-bottom:1px solid #242933;">
            <p style="margin:0;color:#f7fafc;font-size:13px;line-height:1.6;letter-spacing:0.5px;font-weight:500;">
                ${config.tagline}
            </p>
        </div>

        <!-- FOOTER -->
        <div style="background:#fafbfc;padding:35px 40px;text-align:center;">

            <p style="margin:0 0 12px;color:#4a5568;font-size:14px;font-weight:500;">
                Thank you for choosing FirstPass.
            </p>

            <p style="margin:0;color:#a0aec0;font-size:12px;line-height:1.7;">
                This is an automated email to confirm your registration. Please do not reply directly to this inbox.
            </p>

            <div style="margin:20px auto 0;width:40px;height:2px;background:#e2e8f0;border-radius:2px;"></div>

            <p style="margin:20px 0 0;color:#a0aec0;font-size:12px;letter-spacing:0.2px;">
                © ${currentYear} FirstPass. All Rights Reserved.
            </p>

        </div>

    </div>

</div>
    `;
};

module.exports = RegisterTemplate;