// helpers/CommonMailTemplate.js

// Shared color scheme for Merchant (1) and Representative (2)
const MERCHANT_REP_COLORS = {
    gradientBar: 'linear-gradient(90deg, #ff4d4d 0%, #c1121f 50%, #780000 100%)',
    gradientBtn: 'linear-gradient(135deg, #c1121f 0%, #780000 100%)',
    gradientHeader: 'radial-gradient(circle at top right, #fff5f5 0%, #ffffff 70%)',
    primary: '#c1121f',
    dark: '#780000',
    light: '#fffcfc',
    border: '#ffebeb',
    shadowColor: 'rgba(193, 18, 31, 0.25)',
};

const USER_TYPE_CONFIG = {
    1: {
        label: 'Merchant',
        ...MERCHANT_REP_COLORS,
        tagline: 'Manage Offers • Track Performance • Grow Your Brand • Real-Time Analytics',
    },
    2: {
        label: 'Representative',
        ...MERCHANT_REP_COLORS,
        tagline: 'Field Updates • Territory Insights • Performance Tracking • Team Support',
    },
    3: {
        label: 'Customer',
        gradientBar: 'linear-gradient(90deg, #667eea 0%, #4f46e5 50%, #3730a3 100%)',
        gradientBtn: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
        gradientHeader: 'radial-gradient(circle at top right, #f5f5ff 0%, #ffffff 70%)',
        primary: '#4f46e5',
        dark: '#3730a3',
        light: '#fafaff',
        border: '#e8e8ff',
        shadowColor: 'rgba(79, 70, 229, 0.25)',
        tagline: 'Exclusive Deals • Smart Coupons • Trusted Offers • Global Experience',
    },
};

/**
 *
 * @param {Object} options
 * @param {1|2|3} [options.userType=3]   1 = Merchant, 2 = Representative, 3 = Customer
 * @param {string} [options.name='User']
 * @param {string} [options.title='Notification']
 * @param {string} [options.message='']            HTML/plain text body content
 * @param {string} [options.ctaLabel]               Optional CTA button label
 * @param {string} [options.ctaUrl]                 Optional CTA button URL
 * @param {string} [options.footerNote]             Optional extra line above the footer
 */
const CommonMailTemplate = ({
    userType = 3,
    name = 'User',
    title = 'Notification',
    message = '',
    ctaLabel = '',
    ctaUrl = '',
    footerNote = '',
} = {}) => {

    const currentYear = new Date().getFullYear();

    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const logoUrl = `${appUrl}/uploads/public/FirstPass-logo.png`;
    const loginUrl = `${appUrl}/login`;

    const normalizedType = parseInt(userType, 10);
    const config = USER_TYPE_CONFIG[normalizedType] || USER_TYPE_CONFIG[3];

    

    const showCta = Boolean(ctaLabel && ctaUrl);
    const resolvedCtaUrl = ctaUrl || loginUrl;

    const ctaBlock = showCta
        ? `
            <div style="text-align:center;margin:35px 0 15px;">
                <a href="${resolvedCtaUrl}" style="
                    display:inline-block;
                    padding:16px 40px;
                    background:${config.gradientBtn};
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:14px;
                    font-size:15px;
                    font-weight:700;
                    letter-spacing:0.2px;
                    box-shadow:0 12px 24px ${config.shadowColor};
                ">${ctaLabel}</a>
            </div>
        `
        : '';

    const footerNoteBlock = footerNote
        ? `<p style="margin:0 0 12px;color:#4a5568;font-size:14px;font-weight:500;">${footerNote}</p>`
        : '';

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
                font-size:30px;
                font-weight:800;
                letter-spacing:-0.8px;
                line-height:1.2;
            ">
                ${title}
            </h1>
        </div>

        <!-- BODY -->
        <div style="padding:45px 50px;color:#333333;background:#ffffff;">

            <p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;font-weight:500;">
                Dear <strong>${name}</strong>,
            </p>

            <p style="margin:0 0 24px;font-size:15.5px;line-height:1.8;color:#4a5568;">
                ${message}
            </p>

            ${ctaBlock}

        </div>

        <!-- TAGLINE BAND -->
        <div style="background:linear-gradient(135deg, #0f1115 0%, #1a1d24 100%);padding:22px 30px;text-align:center;border-bottom:1px solid #242933;">
            <p style="margin:0;color:#f7fafc;font-size:13px;line-height:1.6;letter-spacing:0.5px;font-weight:500;">
                ${config.tagline}
            </p>
        </div>

        <!-- FOOTER -->
        <div style="background:#fafbfc;padding:35px 40px;text-align:center;">

            ${footerNoteBlock}

            <p style="margin:0;color:#a0aec0;font-size:12px;line-height:1.7;">
                This is an automated email regarding your ${config.label} account. Please do not reply directly to this inbox.
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

module.exports = CommonMailTemplate;