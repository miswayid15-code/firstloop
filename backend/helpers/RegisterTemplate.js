// helpers/RegisterTemplate.js

const RegisterTemplate = (type = 'merchant', name = 'User', status = 'inactive') => {

    const currentYear = new Date().getFullYear();

    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const logoUrl = `${appUrl}/uploads/public/FirstPass-logo.png`;
    const loginUrl = `${appUrl}/login`;

    const appStoreUrl = process.env.APP_STORE_URL || '#';
    const playStoreUrl = process.env.PLAY_STORE_URL || '#';

    const isActive = (status || '').toString().trim().toLowerCase() === 'active';

    const config = type === 'merchant'
        ? {
            title: isActive ? '🎉 Merchant Account Activated' : '⏳ Account Pending Review',
            subtitle: isActive
                ? 'Your Merchant account has been successfully activated.'
                : 'Your Merchant account is currently under review.',
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
            description: isActive
                ? 'Thank you for registering with <strong>FirstPass</strong> as a Merchant. Your account has been activated successfully. You can now log in and start creating exclusive deals, coupons, and brand promotions to reach thousands of customers.'
                : 'Thank you for registering with <strong>FirstPass</strong> as a Merchant. Your profile has been created successfully and is currently under review by our team. The verification process typically takes 1–2 business days. Once your account is approved, you\'ll receive a notification and can start managing your offers and promotions.',
            extraLine: 'FirstPass empowers merchants across Oman and international markets with a powerful, easy-to-use dashboard for coupon and offer management.',
        }
        : {
            title: isActive ? '🎉 Account Activated' : '⏳ Account Pending Review',
            subtitle: isActive
                ? 'Your account has been successfully activated.'
                : 'Your account is currently under review.',
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
            description: isActive
                ? 'Thank you for registering with <strong>FirstPass</strong>. Your account has been activated successfully. You can now log in and start exploring exclusive deals, coupons, brand offers, and book appointments.'
                : 'Thank you for registering with <strong>FirstPass</strong>. Your profile has been created successfully and is currently under review by our team. The verification process typically takes 1–2 business days. Once your account is approved, you\'ll receive a notification and can start exploring deals and offers.',
            extraLine: 'FirstPass is designed to support users across Oman and international markets with a smooth, secure, and professional coupon discovery experience.',
        };

    // ACTIVATED BADGE content differs based on status
    const statusBadge = isActive
        ? `
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
        `
        : `
            <div style="display:flex;align-items:center;">
                <div style="
                    width:48px;
                    height:48px;
                    border-radius:16px;
                    background:#a0aec0;
                    color:#ffffff;
                    text-align:center;
                    line-height:48px;
                    font-size:20px;
                    font-weight:bold;
                    margin-right:18px;
                    box-shadow:0 8px 20px rgba(160,174,192,0.25);
                    flex-shrink:0;
                ">!</div>
                <div>
                    <h3 style="margin:0 0 4px;color:#1a1a1a;font-size:17px;font-weight:700;">
                        Account Pending Activation
                    </h3>
                    <p style="margin:0;color:#718096;font-size:14px;line-height:1.5;">
                        Your profile is under review. This usually takes 1–2 business days.
                    </p>
                </div>
            </div>
        `;

    // CTA content: always show app/play store badges, regardless of status
    const ctaContent = `
            <p style="margin:0 0 18px;font-size:14.5px;color:#718096;font-weight:500;">
                Download the FirstPass app to get started
            </p>
            <div style="text-align:center;">
                <a href="${appStoreUrl}" style="display:inline-block;margin:0 8px 10px;">
                    <img
                        src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us"
                        alt="Download on the App Store"
                        style="height:48px;display:block;"
                    />
                </a>
                <a href="${playStoreUrl}" style="display:inline-block;margin:0 8px 10px;">
                    <img
                        src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                        alt="Get it on Google Play"
                        style="height:48px;display:block;"
                    />
                </a>
            </div>
        `;

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
                    style="max-width:130px;max-height:130px;display:block;object-fit:contain;"
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

            <!-- STATUS BADGE -->
            <div style="background:${config.light};border:1px solid ${config.border};border-radius:20px;padding:24px;margin:35px 0;">
                ${statusBadge}
            </div>

            <p style="margin:0 0 30px;font-size:15.5px;line-height:1.8;color:#4a5568;">
                ${config.extraLine}
            </p>

            <!-- CTA -->
            <div style="margin:35px 0 15px;">
                ${ctaContent}
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