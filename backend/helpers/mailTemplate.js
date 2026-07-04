const otpTemplate = (otp, type, name = 'User') => {

    const config =
        type === 'merchant'
            ? {
                title: 'Merchant Password Reset',
                topBg: 'linear-gradient(135deg, #ff4d4d 0%, #c1121f 100%)',
                primary: '#c1121f',
                dark: '#780000',
                light: '#fff5f5',
                border: '#fce8e8',
                pageBg: '#fdecec',
                shadowColor: 'rgba(193, 18, 31, 0.12)'
            }
            : type === 'customer'
                ? {
                    title: 'Customer Password Reset',
                    topBg: 'linear-gradient(135deg, #667eea 0%, #4f46e5 100%)',
                    primary: '#4f46e5',
                    dark: '#3730a3',
                    light: '#f5f5ff',
                    border: '#e8e8ff',
                    pageBg: '#eef0fd',
                    shadowColor: 'rgba(79, 70, 229, 0.12)'
                }
                : {
                    title: 'Receptionist Password Reset',
                    topBg: 'linear-gradient(135deg, #ff5fa2 0%, #ff9ac2 100%)',
                    primary: '#ff4f8b',
                    dark: '#c2185b',
                    light: '#fff4f8',
                    border: '#ffd6e5',
                    pageBg: '#fceef3',
                    shadowColor: 'rgba(255, 79, 139, 0.12)'
                };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>

    <body style="
        margin:0;
        padding:0;
        background:${config.pageBg};
        font-family:Arial, Helvetica, sans-serif;
    ">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
        background:${config.pageBg};
        padding:40px 15px;
    ">

        <tr>
            <td align="center">

                <!-- Main Container -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="
                        max-width:620px;
                        background:#ffffff;
                        border-radius:28px;
                        overflow:hidden;
                        box-shadow:0 10px 40px ${config.shadowColor};
                    ">

                    <!-- Top Section -->
                    <tr>
                        <td align="center" style="
                            background:${config.topBg};
                            padding:55px 40px 70px;
                        ">

                            <!-- Lock Icon -->
                            <div style="
                                width:95px;
                                height:95px;
                                background:rgba(255,255,255,0.2);
                                border-radius:50%;
                                text-align:center;
                                line-height:95px;
                                font-size:44px;
                                margin:auto;
                                border:3px solid rgba(255,255,255,0.25);
                            ">
                                🔐
                            </div>

                            <!-- Title -->
                            <h1 style="
                                color:#ffffff;
                                font-size:38px;
                                margin:30px 0 14px;
                                font-weight:700;
                                letter-spacing:-0.5px;
                            ">
                                ${config.title}
                            </h1>

                            <!-- Subtitle -->
                            <p style="
                                color:rgba(255,255,255,0.92);
                                font-size:17px;
                                line-height:30px;
                                margin:0;
                            ">
                                Secure verification code for your account
                            </p>

                        </td>
                    </tr>

                    <!-- White Body -->
                    <tr>
                        <td style="
                            padding:50px 45px 45px;
                            text-align:center;
                        ">

                            <h2 style="
                                margin:0 0 20px;
                                color:#333333;
                                font-size:34px;
                                font-weight:700;
                            ">
                                Hello, ${name}
                            </h2>

                            <p style="
                                margin:0;
                                color:#666666;
                                font-size:18px;
                                line-height:34px;
                            ">
                                We received a request to reset your password.
                                <br>
                                Please use the verification code below to continue.
                            </p>

                            <!-- OTP Box -->
                            <table cellpadding="0" cellspacing="0" border="0"
                                align="center"
                                style="
                                    margin:45px auto 30px;
                                    width:100%;
                                    max-width:460px;
                                    background:${config.light};
                                    border:2px dashed ${config.border};
                                    border-radius:22px;
                                ">

                                <tr>
                                    <td align="center" style="
                                        padding:28px 20px 18px;
                                    ">

                                        <div style="
                                            color:${config.primary};
                                            font-size:22px;
                                            font-weight:700;
                                            margin-bottom:18px;
                                        ">
                                            Your Verification Code
                                        </div>

                                        <div style="
                                            color:${config.dark};
                                            font-size:60px;
                                            font-weight:800;
                                            letter-spacing:16px;
                                            font-family:'Courier New', monospace;
                                            line-height:70px;
                                        ">
                                            ${otp}
                                        </div>

                                    </td>
                                </tr>

                            </table>

                            <!-- Expiry -->
                            <p style="
                                color:#666666;
                                font-size:16px;
                                margin:0;
                                line-height:28px;
                            ">
                                ⏰ This code is valid for
                                <strong style="color:${config.primary};">
                                    10 minutes
                                </strong>
                                only.
                            </p>

                            <!-- Security Reminder -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="
                                    margin-top:40px;
                                    background:${config.light};
                                    border-radius:18px;
                                    border:1px solid ${config.border};
                                ">

                                <tr>
                                    <td style="
                                        padding:24px;
                                        text-align:left;
                                    ">

                                        <div style="
                                            color:#222222;
                                            font-size:20px;
                                            font-weight:700;
                                            margin-bottom:12px;
                                        ">
                                            🛡️ Security Reminder
                                        </div>

                                        <div style="
                                            color:#666666;
                                            font-size:15px;
                                            line-height:28px;
                                        ">
                                            Never share this verification code with anyone.
                                            Our support team will never ask for your OTP.
                                        </div>

                                    </td>
                                </tr>

                            </table>

                            <!-- Divider -->
                            <div style="
                                height:1px;
                                background:#eeeeee;
                                margin:45px 0 35px;
                            "></div>

                            <!-- Ignore Section -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">

                                <tr>

                                    <td width="60" valign="top">

                                        <div style="
                                            width:50px;
                                            height:50px;
                                            background:${config.primary};
                                            border-radius:50%;
                                            color:#ffffff;
                                            text-align:center;
                                            line-height:50px;
                                            font-size:26px;
                                            font-weight:bold;
                                        ">
                                            ?
                                        </div>

                                    </td>

                                    <td valign="top" align="left">

                                        <div style="
                                            color:#333333;
                                            font-size:20px;
                                            font-weight:700;
                                            margin-bottom:10px;
                                        ">
                                            Didn't request this?
                                        </div>

                                        <div style="
                                            color:#666666;
                                            font-size:15px;
                                            line-height:28px;
                                        ">
                                            If you didn't request a password reset,
                                            you can safely ignore this email.
                                            Your account remains secure.
                                        </div>

                                    </td>

                                </tr>

                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="
                            background:${config.light};
                            padding:35px 20px;
                        ">

                            <div style="
                                font-size:34px;
                                margin-bottom:10px;
                            ">
                                🛡️
                            </div>

                            <p style="
                                margin:0;
                                color:#777777;
                                font-size:14px;
                                line-height:28px;
                            ">
                                This is an automated message, please do not reply.
                                <br>
                                © ${new Date().getFullYear()} FirstPass. All rights reserved.
                            </p>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>

    </table>

    </body>
    </html>
    `;
};

module.exports = {
    otpTemplate
};