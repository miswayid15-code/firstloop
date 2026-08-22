import axios from "axios";
import { toast } from "react-hot-toast";

const API = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/`,
    headers: {
        "Content-Type": "application/json",
    },
});


/* ---------------------------------------------------
   Get current application type
--------------------------------------------------- */

const getAppType = () => {
    const path = window.location.pathname.toLowerCase();

    if (
        path.startsWith("/merchant/") ||
        path === "/merchant" ||
        path === "/merchant-login" ||
        path.startsWith("/admin/merchant/") ||
        path === "/admin/merchant" ||
        path === "/admin/merchant-login"
    ) {
        return "merchant";
    }

    if (
        path.startsWith("/saleperson/") ||
        path === "/saleperson" ||
        path === "/saleperson-login" ||
        path === "/saleperson-dashboard" ||
        path === "/saleperson-add-merchant" ||
        path.startsWith("/admin/saleperson")
    ) {
        return "saleperson";
    }

    if (
        path.startsWith("/receptionist/") ||
        path === "/receptionist" ||
        path === "/receptionist-login" ||
        path.startsWith("/admin/receptionist")
    ) {
        return "receptionist";
    }

    return "admin";
};


/* ---------------------------------------------------
   Token Keys
--------------------------------------------------- */

const getTokenKeys = () => {
    const appType = getAppType();

    if (appType === "saleperson") {
        return {
            access: "sale_access_token",
            refresh: "sale_refresh_token",
            data: "saleperson_data",
        };
    }

    if (appType === "merchant") {
        return {
            access: "mer_access_token",
            refresh: "mer_refresh_token",
            data: "merchant_data",
        };
    }

    if (appType === "receptionist") {
        return {
            access: "rec_access_token",
            refresh: "rec_refresh_token",
            data: "receptionist_data",
        };
    }

    return {
        access: "access_token",
        refresh: "refresh_token",
        data: "admin_data",
    };
};


/* ---------------------------------------------------
   Get Access Token
--------------------------------------------------- */

const getAccessToken = () => {
    const keys = getTokenKeys();

    return localStorage.getItem(keys.access) || (keys.access === "access_token" ? localStorage.getItem("admin_token") : null);
};


/* ---------------------------------------------------
   Get Refresh Token
--------------------------------------------------- */

const getRefreshToken = () => {
    const keys = getTokenKeys();

    return localStorage.getItem(keys.refresh);
};


/* ---------------------------------------------------
   Save Tokens
--------------------------------------------------- */

const saveTokens = (accessToken, refreshToken = null) => {
    const keys = getTokenKeys();

    if (accessToken) {
        localStorage.setItem(
            keys.access,
            accessToken
        );
    }

    if (refreshToken) {
        localStorage.setItem(
            keys.refresh,
            refreshToken
        );
    }
};


/* ---------------------------------------------------
   Logout
--------------------------------------------------- */

let isLoggingOut = false;

const logoutAndRedirect = (message) => {

    if (isLoggingOut) {
        return;
    }

    isLoggingOut = true;

    const appType = getAppType();
    const keys = getTokenKeys();

    toast.error(
        message || "Session expired. Please login again."
    );

    /* Remove common token */
    localStorage.removeItem(keys.access);
    localStorage.removeItem(keys.refresh);
    localStorage.removeItem(keys.data);

    /* Additional cleanup */

    if (appType === "merchant") {

        localStorage.removeItem("role");

        setTimeout(() => {
            window.location.href = "/admin/merchant/login";
        }, 1500);

    }

    else if (appType === "saleperson") {

        setTimeout(() => {
            window.location.href = "/admin/saleperson-login";
        }, 1500);

    }

    else if (appType === "receptionist") {

        localStorage.removeItem("rec_access_token");
        localStorage.removeItem("rec_refresh_token");
        localStorage.removeItem("receptionist_token");
        localStorage.removeItem("receptionist_data");
        localStorage.removeItem("rec_data");
        sessionStorage.removeItem("rec_access_token");
        sessionStorage.removeItem("rec_refresh_token");
        sessionStorage.removeItem("receptionist_token");
        sessionStorage.removeItem("receptionist_data");
        sessionStorage.removeItem("rec_data");

        setTimeout(() => {
            window.location.href = "/receptionist/login";
        }, 1500);

    }

    else {

        localStorage.removeItem("admin_token");
        localStorage.removeItem("role");

        setTimeout(() => {
            window.location.href = "/admin";
        }, 1500);
    }
};


/* ---------------------------------------------------
   Add Authorization Header
--------------------------------------------------- */

const addAuthHeaders = (config) => {

    const appType = getAppType();
    const accessToken = getAccessToken();

    config.headers = config.headers || {};

    if (!config.headers.Authorization && !config.headers.authorization) {
        if (
            accessToken &&
            accessToken !== "null" &&
            accessToken !== "undefined"
        ) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
    }

    if (!config.headers["X-Role"] && !config.headers["x-role"]) {
        const role = localStorage.getItem("role") || "firstpass";
        if (role) {
            config.headers["X-Role"] = role;
        }
    }

    return config;
};


/* ---------------------------------------------------
   Request Interceptor
--------------------------------------------------- */

API.interceptors.request.use(
    (config) => {

        return addAuthHeaders(config);
    },

    (error) => {
        return Promise.reject(error);
    }
);


/* ---------------------------------------------------
   Response Interceptor
--------------------------------------------------- */

API.interceptors.response.use(

    (response) => {
        return response;
    },

    async (error) => {

        const originalRequest = error.config;


        /* -----------------------------------------------
           No response from server
        ------------------------------------------------ */

        if (!error.response) {
            return Promise.reject(error);
        }


        /* -----------------------------------------------
           Only handle 401
        ------------------------------------------------ */

        if (
            error.response.status !== 401 ||
            !originalRequest
        ) {

            return Promise.reject(error);
        }


        /* -----------------------------------------------
           Check for skipAuthRedirect flag
        ------------------------------------------------ */

        if (
            originalRequest.skipAuthRedirect ||
            originalRequest.headers?.["X-Skip-Auth-Redirect"]
        ) {
            return Promise.reject(error);
        }


        /* -----------------------------------------------
           Check for role/endpoint scope mismatch
           (e.g., Merchant calling an /admin/ endpoint)
        ------------------------------------------------ */

        const appType = getAppType();
        const reqUrl = originalRequest.url || "";
        const isAdminEndpoint = reqUrl.includes("admin/") || reqUrl.startsWith("admin");

        if (appType !== "admin" && isAdminEndpoint) {
            // A 401 on an admin endpoint in merchant/saleperson context is an authorization scope mismatch, not session expiry.
            return Promise.reject(error);
        }


        /* -----------------------------------------------
           Prevent infinite retry
        ------------------------------------------------ */

        if (originalRequest._retry) {
            logoutAndRedirect(
                "Session expired. Please login again."
            );

            return Promise.reject(error);
        }


        /* -----------------------------------------------
           Don't refresh the refresh-token API itself
        ------------------------------------------------ */

        if (
            originalRequest.url?.includes(
                "/admin/refresh-token"
            )
        ) {

            logoutAndRedirect(
                "Session expired. Please login again."
            );

            return Promise.reject(error);
        }


        originalRequest._retry = true;


        try {

            const refreshToken =
                getRefreshToken();


            /* -------------------------------------------
               No refresh token
            ------------------------------------------- */

            if (
                !refreshToken ||
                refreshToken === "null" ||
                refreshToken === "undefined"
            ) {

                logoutAndRedirect(
                    "Session expired. Please login again."
                );

                return Promise.reject(error);
            }


            /* -------------------------------------------
               Refresh token API
            ------------------------------------------- */

            const refreshResponse = await axios.post(

                `${import.meta.env.VITE_API_URL}/admin/refresh-token`,

                {},

                {
                    headers: {
                        Authorization:
                            `Bearer ${refreshToken}`,
                        "Content-Type":
                            "application/json",
                    },
                }
            );


            const refreshData =
                refreshResponse.data;


            /* -------------------------------------------
               Refresh successful
            ------------------------------------------- */

            if (
                refreshData?.status === 1 &&
                refreshData?.access_token
            ) {

                saveTokens(
                    refreshData.access_token,
                    refreshData.refresh_token
                );


                /* ---------------------------------------
                   Update original request
                --------------------------------------- */

                originalRequest.headers =
                    originalRequest.headers || {};

                originalRequest.headers.Authorization =
                    `Bearer ${refreshData.access_token}`;


                /* ---------------------------------------
                   Admin Role
                --------------------------------------- */

                if (getAppType() === "admin") {

                    const role =
                        localStorage.getItem("role");

                    if (role) {

                        originalRequest.headers["X-Role"] =
                            role;
                    }
                }


                /* ---------------------------------------
                   Retry original request
                --------------------------------------- */

                return API(originalRequest);
            }


            /* -------------------------------------------
               Refresh failed
            ------------------------------------------- */

            logoutAndRedirect(
                "Session expired. Please login again."
            );

            return Promise.reject(error);

        }

        catch (refreshError) {

            console.error(
                "Token refresh failed:",
                refreshError
            );

            logoutAndRedirect(
                "Session expired. Please login again."
            );

            return Promise.reject(refreshError);
        }
    }
);


export default API;