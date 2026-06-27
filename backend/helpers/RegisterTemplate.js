// helpers/RegisterTemplate.js

const RegisterTemplate = (type = 'merchant', name = 'User') => {

    const currentYear = new Date().getFullYear();

    // APP_URL should be like: https://api.firstpassapp.co
    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const logoUrl = `${appUrl}/uploads/public/firstpass.png`;

    console.log("APP_URL:", appUrl);
    console.log("Logo URL:", logoUrl);

    const config = type === 'merchant'
        ? {
            title: 'Merchant Registration Successful',
            subtitle: 'Welcome to the Merchant Portal',
            topBg: 'linear-gradient(135deg,#8f090e 0%,#ff7eb3 100%)',
            primary: '#8f090e',
            light: '#fff4f8',
            button: 'Merchant Dashboard'
        }
        : {
            title: 'Customer Registration Successful',
            subtitle: 'Welcome to Our Platform',
            topBg: 'linear-gradient(135deg,#6a11cb 0%,#2575fc 100%)',
            primary: '#2575fc',
            light: '#f4f8ff',
            button: 'Start Shopping'
        };

    return `

    <div style="
        margin:0;
        padding:50px 20px;
        background:#f3f5fb;
        font-family:Arial,sans-serif;
    ">

        <div style="
            max-width:620px;
            margin:auto;
            background:#ffffff;
            border-radius:24px;
            overflow:hidden;
            box-shadow:0 15px 40px rgba(0,0,0,0.08);
        ">

            <!-- HEADER -->
            <div style="
                background:${config.topBg};
                padding:50px 30px;
                text-align:center;
            ">

                <!-- LOGO -->
                <div style="margin-bottom:25px;">
                    <img
                        src="${logoUrl}"
                        alt="FirstPass Logo"
                        style="
                            max-width:180px;
                            height:auto;
                            display:block;
                            margin:0 auto;
                        "
                    />
                </div>

                <!-- SUCCESS ICON -->
                <div style="
                    width:85px;
                    height:85px;
                    margin:auto;
                    border-radius:50%;
                    background:rgba(255,255,255,0.18);
                    color:#ffffff;
                    font-size:42px;
                    line-height:85px;
                    font-weight:bold;
                ">
                    ✓
                </div>

                <h1 style="
                    margin:25px 0 10px;
                    color:#ffffff;
                    font-size:32px;
                    font-weight:700;
                ">
                    Welcome 🎉
                </h1>

                <p style="
                    margin:0;
                    color:rgba(255,255,255,0.92);
                    font-size:16px;
                ">
                    ${config.subtitle}
                </p>

            </div>

            <!-- BODY -->
            <div style="
                padding:45px 35px;
                color:#2d3748;
                line-height:1.8;
            ">

                <h2 style="
                    margin-top:0;
                    color:${config.primary};
                    font-size:24px;
                    font-weight:700;
                ">
                    Hello ${name} 👋
                </h2>

                <p style="
                    font-size:16px;
                    color:#4a5568;
                    margin-bottom:22px;
                ">
                    Your account registration has been completed successfully.
                </p>

                <div style="
                    background:${config.light};
                    border-left:5px solid ${config.primary};
                    padding:22px;
                    border-radius:14px;
                    margin:30px 0;
                ">

                    <h3 style="
                        margin-top:0;
                        margin-bottom:12px;
                        color:${config.primary};
                        font-size:18px;
                    ">
                        Account Activated
                    </h3>

                    <p style="
                        margin:0;
                        font-size:15px;
                        color:#555;
                        line-height:1.7;
                    ">
                        Your account is now active and ready to use.
                        Enjoy all features and services available on our platform.
                    </p>

                </div>

            </div>

            <!-- FOOTER -->
            <div style="
                background:#fafbff;
                padding:25px;
                text-align:center;
                border-top:1px solid #edf2f7;
            ">

                <p style="
                    margin:0 0 8px;
                    color:#718096;
                    font-size:14px;
                ">
                    Thank you for joining with us.
                </p>

                <p style="
                    margin:0;
                    color:#a0aec0;
                    font-size:13px;
                ">
                    © ${currentYear} FirstPass All Rights Reserved
                </p>

            </div>

        </div>

    </div>

    `;
};

module.exports = RegisterTemplate;