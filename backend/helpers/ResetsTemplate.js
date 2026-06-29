// helpers/ResetsTemplate.js

const ResetsTemplate = (type = 'merchant') => {

    const currentYear = new Date().getFullYear();

    const config = type === 'merchant'
        ? {
            title: 'Merchant Password Reset',
            topBg: 'linear-gradient(135deg,#ff4f8b 0%,#ff7eb3 100%)',
            primary: '#ff4f8b',
            light: '#fff4f8'
        }
        : {
            title: 'Customer Password Reset',
            topBg: 'linear-gradient(135deg,#ff5fa2 0%,#ff9ac2 100%)',
            primary: '#ff5fa2',
            light: '#fff4f8'
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

            <!-- TOP HEADER -->
            <div style="
                background:${config.topBg};
                padding:50px 30px;
                text-align:center;
                position:relative;
            ">

                <div style="
                    width:80px;
                    height:80px;
                    background:rgba(255,255,255,0.18);
                    border-radius:50%;
                    margin:auto;
                    line-height:80px;
                    font-size:38px;
                    color:#ffffff;
                    font-weight:bold;
                    backdrop-filter:blur(10px);
                ">
                    ✓
                </div>

                <h1 style="
                    margin:25px 0 10px;
                    color:#ffffff;
                    font-size:32px;
                    font-weight:700;
                    letter-spacing:0.5px;
                ">
                    Password Reset Successful
                </h1>

                <p style="
                    margin:0;
                    color:rgba(255,255,255,0.92);
                    font-size:16px;
                ">
                    ${config.title}
                </p>

            </div>

            <!-- CONTENT -->
            <div style="
                padding:45px 35px;
                color:#2d3748;
                line-height:1.8;
            ">

                <h2 style="
                    margin-top:0;
                    font-size:24px;
                    color:${config.primary};
                    font-weight:700;
                ">
                    Hello 👋
                </h2>

                <p style="
                    font-size:16px;
                    color:#4a5568;
                    margin-bottom:25px;
                ">
                    Your account password has been reset successfully.
                    You can now login using your new password.
                </p>

                <div style="
                    background:${config.light};
                    border:1px solid rgba(255,79,139,0.12);
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
                        Security Notice
                    </h3>

                    <p style="
                        margin:0;
                        font-size:15px;
                        color:#555;
                        line-height:1.7;
                    ">
                        If you did not perform this password reset,
                        please contact our support team immediately
                        and secure your account.
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
                    This is an automated email. Please do not reply.
                </p>

                <p style="
                    margin:0;
                    color:#a0aec0;
                    font-size:13px;
                ">
                    © ${currentYear}  FirstPass. All rights reserved.
                </p>

            </div>

        </div>

    </div>

    `;
};

module.exports = ResetsTemplate;