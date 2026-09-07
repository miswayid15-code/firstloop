const axios = require("axios");

const ZOHO_ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.in";
const ZOHO_MAIL_BASE_URL = process.env.ZOHO_MAIL_BASE_URL || "https://mail.zoho.in";

const getAccessToken = async (refreshToken, type) => {
    try {
<<<<<<< HEAD
        // console.log("\n==============================================");
        // console.log("          ZOHO ACCESS TOKEN REQUEST");
        // console.log("==============================================");
        // console.log("Mail Type:", type);
=======
        console.log("\n==============================================");
        console.log("          ZOHO ACCESS TOKEN REQUEST");
        console.log("==============================================");
        console.log("Mail Type:", type);
>>>>>>> sub_main

        const clientId = process.env.ZOHO_CLIENT_ID;
        const clientSecret = process.env.ZOHO_CLIENT_SECRET;

<<<<<<< HEAD
        // console.log("Client ID:", clientId);
        // console.log("Client Secret Exists:", !!clientSecret);
        // console.log("Refresh Token Exists:", !!refreshToken);
        // console.log("Refresh Token Length:", refreshToken?.length);
=======
        console.log("Client ID:", clientId);
        console.log("Client Secret Exists:", !!clientSecret);
        console.log("Refresh Token Exists:", !!refreshToken);
        console.log("Refresh Token Length:", refreshToken?.length);
>>>>>>> sub_main

        if (!clientId) {
            throw new Error("ZOHO_CLIENT_ID is missing");
        }
        if (!clientSecret) {
            throw new Error("ZOHO_CLIENT_SECRET is missing");
        }
        if (!refreshToken) {
            throw new Error(`ZOHO refresh token is missing for ${type}`);
        }

        // 1. Try refresh_token grant type first
        try {
            console.log("\n---------- REFRESH TOKEN REQUEST (grant_type=refresh_token) ----------");
            const params = new URLSearchParams();
            params.append("client_id", clientId);
            params.append("grant_type", "refresh_token");
            params.append("client_secret", clientSecret);
            params.append("refresh_token", refreshToken);

            const response = await axios.post(
                `${ZOHO_ACCOUNTS_URL}/oauth/v2/token`,
                params.toString(),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    timeout: 15000,
                }
            );

<<<<<<< HEAD
            // console.log("Token Response Status:", response.status);
            // console.log("Full Zoho Response:", response.data);
=======
            console.log("Token Response Status:", response.status);
            console.log("Full Zoho Response:", response.data);
>>>>>>> sub_main

            if (response.data?.access_token) {
                return {
                    accessToken: response.data.access_token,
                    apiDomain: response.data.api_domain || ZOHO_MAIL_BASE_URL,
                };
            }
        } catch (refreshErr) {
            console.warn(`refresh_token grant attempt failed for ${type}:`, refreshErr.response?.data || refreshErr.message);
        }

<<<<<<< HEAD
       
        try {
            // console.log("\n---------- AUTH CODE REQUEST (grant_type=authorization_code) ----------");
=======
        // 2. Fallback: Try authorization_code grant type in case refreshToken is a Self Client grant code
        try {
            console.log("\n---------- AUTH CODE REQUEST (grant_type=authorization_code) ----------");
>>>>>>> sub_main
            const params = new URLSearchParams();
            params.append("client_id", clientId);
            params.append("grant_type", "authorization_code");
            params.append("client_secret", clientSecret);
            params.append("code", refreshToken);

            const response = await axios.post(
                `${ZOHO_ACCOUNTS_URL}/oauth/v2/token`,
                params.toString(),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    timeout: 15000,
                }
            );

<<<<<<< HEAD
            // console.log("Token Response Status:", response.status);
            // console.log("Full Zoho Response:", response.data);
=======
            console.log("Token Response Status:", response.status);
            console.log("Full Zoho Response:", response.data);
>>>>>>> sub_main

            if (response.data?.access_token) {
                if (response.data.refresh_token) {
                    console.log("New permanent refresh_token generated from Self Client code:", response.data.refresh_token);
                }
                return {
                    accessToken: response.data.access_token,
                    apiDomain: response.data.api_domain || ZOHO_MAIL_BASE_URL,
                };
            }
        } catch (authErr) {
            console.error(`authorization_code grant attempt failed for ${type}:`, authErr.response?.data || authErr.message);
        }

        throw new Error(`Zoho did not return an access token for ${type}`);
    } catch (error) {
        console.error("\n==============================================");
        console.error("          ZOHO TOKEN ERROR");
        console.error("==============================================");
        console.error("Mail Type:", type);
        console.error("Message:", error.message);
        console.error("HTTP Status:", error.response?.status || "N/A");
        console.error("Zoho Response:", error.response?.data || "No response");
        console.error("==============================================\n");
        throw error;
    }
};

const sendMail = async (...args) => {
    let type = "merchant";
    let to = "";
    let subject = "";
    let html = "";

    if (args.length >= 4) {
        type = args[0];
        to = args[1];
        subject = args[2];
        html = args[3];
    } else if (args.length === 3) {
        if (args[0] === "customer" || args[0] === "merchant") {
            type = args[0];
            to = args[1];
            subject = args[2];
            html = args[2];
        } else {
            type = "merchant";
            to = args[0];
            subject = args[1];
            html = args[2];
        }
    } else {
        console.error("sendMail error: Invalid number of arguments provided to sendMail", args);
        return false;
    }

    try {
        const isCustomer = (type || "").toString().toLowerCase() === "customer";

        let refreshToken = isCustomer
            ? (process.env.ZOHO_CUSTOMER_REFRESH_TOKEN || process.env.ZOHO_REFRESH_TOKEN)
            : (process.env.ZOHO_MERCHANT_REFRESH_TOKEN || process.env.ZOHO_REFRESH_TOKEN);

        let accountId = isCustomer
            ? (process.env.ZOHO_CUSTOMER_ACCOUNT_ID || process.env.ZOHO_ACCOUNT_ID)
            : (process.env.ZOHO_ACCOUNT_ID || process.env.ZOHO_CUSTOMER_ACCOUNT_ID);

        let fromEmail = isCustomer
            ? (process.env.MAIL_USER_CUSTOMER || process.env.MAIL_USER)
            : (process.env.MAIL_USER || process.env.MAIL_USER_CUSTOMER);

<<<<<<< HEAD
        // console.log("\n================================================");
        // console.log("                SEND MAIL START");
        // console.log("================================================");
        // console.log("Mail Type:", type);
        // console.log("From:", fromEmail);
        // console.log("To:", to);
        // console.log("Subject:", subject);
        // console.log("Account ID:", accountId);
=======
        console.log("\n================================================");
        console.log("                SEND MAIL START");
        console.log("================================================");
        console.log("Mail Type:", type);
        console.log("From:", fromEmail);
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("Account ID:", accountId);
>>>>>>> sub_main

        if (!refreshToken) {
            throw new Error(`Zoho refresh token missing for ${type}`);
        }
        if (!accountId) {
            throw new Error(`Zoho account ID missing for ${type}`);
        }
        if (!fromEmail) {
            throw new Error(`From email missing for ${type}`);
        }

        let accessToken;

        try {
            const tokenResult = await getAccessToken(refreshToken, type);
            accessToken = tokenResult.accessToken;
        } catch (tokenErr) {
            if (isCustomer && process.env.ZOHO_REFRESH_TOKEN && process.env.ZOHO_REFRESH_TOKEN !== refreshToken) {
                console.log("Customer token failed, falling back to primary ZOHO_REFRESH_TOKEN...");
                refreshToken = process.env.ZOHO_REFRESH_TOKEN;
                accountId = process.env.ZOHO_ACCOUNT_ID || accountId;
                fromEmail = process.env.MAIL_USER || fromEmail;
                const tokenResult = await getAccessToken(refreshToken, "primary_fallback");
                accessToken = tokenResult.accessToken;
            } else {
                throw tokenErr;
            }
        }

<<<<<<< HEAD
        // console.log("\n---------- SEND ZOHO EMAIL VIA REST API ----------");
        // console.log("Mail API Base URL:", ZOHO_MAIL_BASE_URL);
        // console.log("Account ID:", accountId);
        // console.log("From:", fromEmail);
        // console.log("To:", to);
=======
        console.log("\n---------- SEND ZOHO EMAIL VIA REST API ----------");
        console.log("Mail API Base URL:", ZOHO_MAIL_BASE_URL);
        console.log("Account ID:", accountId);
        console.log("From:", fromEmail);
        console.log("To:", to);
>>>>>>> sub_main

        const mailUrl = `${ZOHO_MAIL_BASE_URL}/api/accounts/${accountId}/messages`;
        console.log("Mail URL:", mailUrl);

        const response = await axios.post(
            mailUrl,
            {
                fromAddress: fromEmail,
                toAddress: to,
                subject: subject,
                content: html,
                mailFormat: "html",
            },
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: 15000,
            }
        );

<<<<<<< HEAD
        // console.log("\n========== EMAIL SENT SUCCESSFULLY ==========");
        // console.log("Type:", type);
        // console.log("From:", fromEmail);
        // console.log("To:", to);
        // console.log("Subject:", subject);
        // console.log("Zoho Response:", response.data);
        // console.log("=============================================\n");
=======
        console.log("\n========== EMAIL SENT SUCCESSFULLY ==========");
        console.log("Type:", type);
        console.log("From:", fromEmail);
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("Zoho Response:", response.data);
        console.log("=============================================\n");
>>>>>>> sub_main

        return true;
    } catch (error) {
        console.error("\n================================================");
        console.error("                 EMAIL ERROR");
        console.error("================================================");
        console.error("Type:", type);
        console.error("To:", to);
        console.error("Subject:", subject);
        console.error("Message:", error.message);
        console.error("HTTP Status:", error.response?.status || "N/A");
        console.error("Zoho Response:", error.response?.data || "No response");
        console.error("================================================\n");

        return false;
    }
};

module.exports = sendMail;