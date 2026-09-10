import axios from "axios";
import { toast } from "react-hot-toast";

const API = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/`,
    headers: {
        "Content-Type": "application/json",
    },
});

/* ---------------------------------------------------
   Get current application / role type
   Priority 1: Explicit API endpoint being called (reqUrl)
   Priority 2: Active browser path (window.location.pathname)
--------------------------------------------------- */
export const getAppType = (reqUrl = "") => {
    const url = String(reqUrl || "").toLowerCase().trim();
    const cleanUrl = url.replace(/^\/+/, "");
    const path = String(window.location.pathname || "").toLowerCase().trim();

    // Check if user is currently inside the SalesPerson portal
    const isSalesPersonPage = (
        path === "/saleperson-login" ||
        path.startsWith("/saleperson-") ||
        path === "/panel/saleperson" ||
        path.startsWith("/panel/saleperson/")
    );

    // 1. Explicit API endpoint checks (HIGHEST PRIORITY - endpoint dictates required auth)

    // SalesPerson specific endpoints
    // Note: admin/saleperson/* (generate-code, list, details, create, update, status-update, etc.)
    // are ADMIN management endpoints, EXCEPT merchant_list (and logout if inside salesperson portal)
    if (
        cleanUrl.includes("admin/saleperson/merchant_list") ||
        cleanUrl.startsWith("saleperson/") ||
        cleanUrl.startsWith("api/saleperson/") ||
        (cleanUrl.includes("admin/saleperson/logout") && isSalesPersonPage)
    ) {
        return "saleperson";
    }

    if (
        cleanUrl.startsWith("firstloop/merchant/") ||
        cleanUrl.includes("/firstloop/merchant/") ||
        cleanUrl.startsWith("api/merchant/") ||
        cleanUrl.includes("/api/merchant/") ||
        cleanUrl.startsWith("firstloop/customer/fetch-merchant-customers") ||
        cleanUrl.includes("fetch-merchant-customers") ||
        cleanUrl.startsWith("firstloop/branch/") ||
        cleanUrl.includes("/firstloop/branch/") ||
        cleanUrl.startsWith("firstloop/card/") ||
        cleanUrl.includes("/firstloop/card/") ||
        cleanUrl.includes("/merchant/login")
    ) {
        return "merchant";
    }

    if (
        cleanUrl.startsWith("firstloop/reception/") ||
        cleanUrl.includes("/firstloop/reception/") ||
        cleanUrl.startsWith("firstloop/receptionist/") ||
        cleanUrl.includes("/firstloop/receptionist/") ||
        cleanUrl.startsWith("api/receptionist/") ||
        cleanUrl.includes("/api/receptionist/") ||
        cleanUrl.includes("/receptionist/login")
    ) {
        return "receptionist";
    }

    // If currently on a salesperson portal page calling a shared endpoint (e.g. /admin/merchant/register), use salesperson role
    if (isSalesPersonPage && !cleanUrl.includes("admin/saleperson/")) {
        return "saleperson";
    }

    // Any admin endpoint (admin/saleperson/generate-code, admin/saleperson/list, admin/merchant-list, admin/dashboard, etc.)
    if (cleanUrl.startsWith("admin/") || cleanUrl.includes("/admin/")) {
        return "admin";
    }

    // 2. Active Browser URL Path checks (When reqUrl is empty or generic)

    // Specific merchant routes only (must NOT match /merchants, /merchant-reports, /view-merchant, etc.)
    if (
        path === "/merchant" ||
        path.startsWith("/merchant/") ||
        path === "/merchant-login" ||
        path === "/panel/merchant" ||
        path.startsWith("/panel/merchant/") ||
        path === "/panel/merchant-login"
    ) {
        return "merchant";
    }

    // Specific receptionist routes
    if (
        path === "/receptionist" ||
        path.startsWith("/receptionist/") ||
        path === "/receptionist-login" ||
        path === "/panel/receptionist" ||
        path.startsWith("/panel/receptionist/") ||
        path === "/panel/receptionist-login"
    ) {
        return "receptionist";
    }

    // Specific salesperson routes
    if (isSalesPersonPage) {
        return "saleperson";
    }

    // All remaining Dealora admin routes (/merchants, /salepersons, /merchant-reports, /dashboard, etc.)
    return "admin";
};

/* ---------------------------------------------------
   Role-Specific Token Storage Keys
--------------------------------------------------- */
export const getTokenKeys = (reqUrl = "") => {
    const appType = getAppType(reqUrl);

    if (appType === "saleperson") {
        return {
            role: "saleperson",
            access: "sale_access_token",
            refresh: "sale_refresh_token",
            data: "saleperson_data",
        };
    }

    if (appType === "merchant") {
        return {
            role: "merchant",
            access: "mer_access_token",
            refresh: "mer_refresh_token",
            data: "merchant_data",
        };
    }

    if (appType === "receptionist") {
        return {
            role: "receptionist",
            access: "rec_access_token",
            refresh: "rec_refresh_token",
            data: "receptionist_data",
        };
    }

    return {
        role: "admin",
        access: "access_token",
        refresh: "refresh_token",
        data: "admin_data",
    };
};

/* ---------------------------------------------------
   Get Access Token for specific role/endpoint
--------------------------------------------------- */
export const getAccessToken = (reqUrl = "") => {
    const keys = getTokenKeys(reqUrl);
    const token = localStorage.getItem(keys.access);
    if (token && token !== "null" && token !== "undefined") {
        return token;
    }

    // Secondary key fallbacks per role
    if (keys.role === "admin") {
        const adminToken = localStorage.getItem("admin_token") || localStorage.getItem("admin_access_token") || localStorage.getItem("access_token");
        if (adminToken && adminToken !== "null" && adminToken !== "undefined") {
            return adminToken;
        }
    }

    if (keys.role === "merchant") {
        const merToken = localStorage.getItem("merchant_token");
        if (merToken && merToken !== "null" && merToken !== "undefined") {
            return merToken;
        }
    }

    if (keys.role === "receptionist") {
        const recToken = localStorage.getItem("receptionist_token");
        if (recToken && recToken !== "null" && recToken !== "undefined") {
            return recToken;
        }
    }

    if (keys.role === "saleperson") {
        const saleToken = localStorage.getItem("sale_access_token");
        if (saleToken && saleToken !== "null" && saleToken !== "undefined") {
            return saleToken;
        }
    }

    return null;
};

/* ---------------------------------------------------
   Get Refresh Token for specific role/endpoint
--------------------------------------------------- */
export const getRefreshToken = (reqUrl = "") => {
    const keys = getTokenKeys(reqUrl);
    const token = localStorage.getItem(keys.refresh);
    if (token && token !== "null" && token !== "undefined") {
        return token;
    }

    if (keys.role === "admin") {
        const adminRefresh = localStorage.getItem("admin_refresh_token") || localStorage.getItem("refresh_token");
        if (adminRefresh && adminRefresh !== "null" && adminRefresh !== "undefined") {
            return adminRefresh;
        }
    }

    if (keys.role === "receptionist") {
        const recToken = localStorage.getItem("rec_refresh_token") || localStorage.getItem("receptionist_refresh_token");
        if (recToken && recToken !== "null" && recToken !== "undefined") {
            return recToken;
        }
    }

    if (keys.role === "merchant") {
        const merToken = localStorage.getItem("mer_refresh_token") || localStorage.getItem("merchant_refresh_token");
        if (merToken && merToken !== "null" && merToken !== "undefined") {
            return merToken;
        }
    }

    return null;
};

/* ---------------------------------------------------
   Save Tokens
--------------------------------------------------- */
export const saveTokens = (accessToken, refreshToken = null, reqUrl = "") => {
    const keys = getTokenKeys(reqUrl);

    if (accessToken) {
        localStorage.setItem(keys.access, accessToken);
        if (keys.role === "receptionist") {
            localStorage.setItem("receptionist_token", accessToken);
        }
    }
    if (refreshToken && refreshToken !== "null" && refreshToken !== "undefined") {
        localStorage.setItem(keys.refresh, refreshToken);
    }
};

/* ---------------------------------------------------
   Get Refresh Token API Endpoint per Role
--------------------------------------------------- */
export const getRefreshEndpoint = (appType = "admin") => {
    if (appType === "merchant") {
        return "api/merchant/refreshAccessToken";
    }
    if (appType === "receptionist") {
        return "api/receptionist/refreshAccessToken";
    }
    return "admin/refresh-token";
};

/* ---------------------------------------------------
   Refresh Access Token Helper Function
--------------------------------------------------- */
export const refreshAccessToken = async (targetAppType = null, reqUrl = "") => {
    const appType = targetAppType || getAppType(reqUrl);
    const refreshToken = getRefreshToken(reqUrl);

    if (!refreshToken || refreshToken === "null" || refreshToken === "undefined") {
        throw new Error("No refresh token available");
    }

    const refreshEndpoint = getRefreshEndpoint(appType);
    const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
    const fullUrl = `${baseUrl}/${refreshEndpoint.replace(/^\/+/, "")}`;

    const refreshResponse = await axios.post(
        fullUrl,
        {
            refresh_token: refreshToken,
        },
        {
            headers: {
                Authorization: `Bearer ${refreshToken}`,
                "Content-Type": "application/json",
                "X-Role": appType,
            },
        }
    );

    const data = refreshResponse.data;
    const isSuccess = data?.status === 1 || data?.status === "1" || data?.success === true;
    const newAccessToken = data?.access_token || data?.token || data?.data?.access_token || data?.data?.token;
    const newRefreshToken = data?.refresh_token || data?.data?.refresh_token || refreshToken;

    if (isSuccess && newAccessToken) {
        saveTokens(newAccessToken, newRefreshToken, reqUrl);
        return {
            status: 1,
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            data,
        };
    }

    throw new Error(data?.message || "Failed to refresh access token");
};

/* ---------------------------------------------------
   Isolated Logout (Only logs out the specific role, prevents cross-portal kickouts)
--------------------------------------------------- */
const activeLogouts = new Set();

export const logoutAndRedirect = (message, targetAppType = null) => {
    const path = String(window.location.pathname || "").toLowerCase().trim();
    if (path.startsWith("/card-preview") || path.startsWith("/card-image") || path.startsWith("/card-only")) {
        return; // Allow public preview/image without session redirection
    }

    const appType = targetAppType || getAppType();

    if (activeLogouts.has(appType)) {
        return;
    }
    activeLogouts.add(appType);
    setTimeout(() => activeLogouts.delete(appType), 3000);

    // Determine if the user is currently browsing the portal of the role being logged out
    const isCurrentPageMatching =
        (appType === "merchant" && (path === "/merchant" || path.startsWith("/merchant/") || path === "/panel/merchant" || path.startsWith("/panel/merchant/"))) ||
        (appType === "receptionist" && (path === "/receptionist" || path.startsWith("/receptionist/") || path === "/panel/receptionist" || path.startsWith("/panel/receptionist/"))) ||
        (appType === "saleperson" && (path.startsWith("/saleperson-") || path.startsWith("/panel/saleperson"))) ||
        (appType === "admin" && !path.startsWith("/merchant/") && !path.startsWith("/panel/merchant") && !path.startsWith("/receptionist/") && !path.startsWith("/panel/receptionist") && !path.startsWith("/saleperson-"));

    if (message && isCurrentPageMatching) {
        toast.error(message);
    }

    if (appType === "merchant") {
        localStorage.removeItem("mer_access_token");
        localStorage.removeItem("mer_refresh_token");
        localStorage.removeItem("merchant_token");
        localStorage.removeItem("merchant_data");

        if (isCurrentPageMatching) {
            setTimeout(() => {
                window.location.href = "/panel/merchant/login";
            }, 1200);
        }
    } else if (appType === "saleperson") {
        localStorage.removeItem("sale_access_token");
        localStorage.removeItem("sale_refresh_token");
        localStorage.removeItem("saleperson_data");

        if (isCurrentPageMatching) {
            setTimeout(() => {
                window.location.href = "/saleperson-login";
            }, 1200);
        }
    } else if (appType === "receptionist") {
        localStorage.removeItem("rec_access_token");
        localStorage.removeItem("rec_refresh_token");
        localStorage.removeItem("receptionist_token");
        localStorage.removeItem("receptionist_data");
        localStorage.removeItem("rec_data");
        localStorage.removeItem("rec_user_id");
        localStorage.removeItem("rec_user_repId");

        if (isCurrentPageMatching) {
            setTimeout(() => {
                window.location.href = "/panel/receptionist/login";
            }, 1200);
        }
    } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("admin_data");
        localStorage.removeItem("role");

        if (isCurrentPageMatching) {
            setTimeout(() => {
                window.location.href = "/";
            }, 1200);
        }
    }
};

/* ---------------------------------------------------
   Add Authorization & Role Headers
--------------------------------------------------- */
const addAuthHeaders = (config) => {
    const reqUrl = config.url || "";
    const appType = getAppType(reqUrl);
    const accessToken = getAccessToken(reqUrl);

    config.headers = config.headers || {};

    if (!config.headers.Authorization && !config.headers.authorization) {
        if (accessToken && accessToken !== "null" && accessToken !== "undefined") {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
    }

    if (!config.headers["X-Role"] && !config.headers["x-role"]) {
        if (appType === "admin") {
            const role = localStorage.getItem("role") || "firstpass";
            config.headers["X-Role"] = role;
        } else if (appType === "merchant") {
            config.headers["X-Role"] = "merchant";
        } else if (appType === "receptionist") {
            config.headers["X-Role"] = "receptionist";
        } else if (appType === "saleperson") {
            config.headers["X-Role"] = "saleperson";
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

        if (!error.response) {
            return Promise.reject(error);
        }

        // Only handle 401 Unauthorized
        if (error.response.status !== 401 || !originalRequest) {
            return Promise.reject(error);
        }

        const reqUrl = originalRequest.url || "";
        const appType = getAppType(reqUrl);

        // Check for skipAuthRedirect flag or public preview route
        const currentPath = String(window.location.pathname || "").toLowerCase();
        if (
            currentPath.startsWith("/card-preview") ||
            currentPath.startsWith("/card-image") ||
            currentPath.startsWith("/card-only") ||
            originalRequest.skipAuthRedirect ||
            originalRequest.headers?.["X-Skip-Auth-Redirect"]
        ) {
            return Promise.reject(error);
        }

        // Prevent infinite retry
        if (originalRequest._retry) {
            logoutAndRedirect("Session expired. Please login again.", appType);
            return Promise.reject(error);
        }

        if (
            originalRequest.url?.includes("/refresh-token") ||
            originalRequest.url?.includes("refreshAccessToken") ||
            originalRequest.url?.includes("/refresh")
        ) {
            logoutAndRedirect("Session expired. Please login again.", appType);
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const refreshResult = await refreshAccessToken(appType, reqUrl);

            if (refreshResult?.access_token) {
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${refreshResult.access_token}`;

                return API(originalRequest);
            }

            logoutAndRedirect("Session expired. Please login again.", appType);
            return Promise.reject(error);
        } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            logoutAndRedirect("Session expired. Please login again.", appType);
            return Promise.reject(refreshError);
        }
    }
);

export default API;