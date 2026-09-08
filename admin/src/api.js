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
   Checks both request URL and browser pathname
--------------------------------------------------- */
export const getAppType = (reqUrl = "") => {
    const url = String(reqUrl || "").toLowerCase();
    const path = String(window.location.pathname || "").toLowerCase();

    // 1. Browser URL Path checks
    if (
        path.startsWith("/merchant/") ||
        path === "/merchant" ||
        path === "/merchant-login" ||
        path.startsWith("/panel/merchant/") ||
        path === "/panel/merchant" ||
        path === "/panel/merchant-login" ||
        path.startsWith("/admin/merchant/") ||
        path === "/admin/merchant" ||
        path === "/admin/merchant-login"
    ) {
        return "merchant";
    }

    if (
        path.startsWith("/saleperson-") ||
        path === "/saleperson-login" ||
        path === "/saleperson-dashboard" ||
        path === "/saleperson-add-merchant"
    ) {
        return "saleperson";
    }

    if (
        path.startsWith("/receptionist/") ||
        path === "/receptionist" ||
        path === "/receptionist-login" ||
        path.startsWith("/receptionist-") ||
        path.startsWith("/panel/receptionist-") ||
        path.startsWith("/panel/receptionist/") ||
        path === "/panel/receptionist" ||
        path.startsWith("/admin/receptionist-") ||
        path.startsWith("/admin/receptionist/") ||
        path === "/admin/receptionist"
    ) {
        return "receptionist";
    }

    // 2. Admin portal paths
    if (
        path.startsWith("/salepersons") ||
        path === "/" ||
        path.startsWith("/dashboard") ||
        path.startsWith("/merchants") ||
        path.startsWith("/view-merchant") ||
        path.startsWith("/customers") ||
        path.startsWith("/categories") ||
        path.startsWith("/appointments") ||
        path.startsWith("/stamps") ||
        path.startsWith("/coupons") ||
        path.startsWith("/memberships") ||
        path.startsWith("/reports") ||
        path.startsWith("/admin") ||
        path.startsWith("/panel")
    ) {
        if (url.includes("firstloop/merchant/") || url.includes("/merchant/login") || path.includes("/merchant")) {
            const merToken = localStorage.getItem("mer_access_token");
            if (!merToken && (localStorage.getItem("access_token") || localStorage.getItem("admin_token"))) {
                return "admin";
            }
            return "merchant";
        }
        if (url.includes("firstloop/reception/") || url.includes("/receptionist/login") || path.includes("/receptionist")) {
            return "receptionist";
        }
        return "admin";
    }

    // 3. Fallback to explicit API endpoint checks
    if (url.includes("firstloop/merchant/")) {
        return "merchant";
    }
    if (url.includes("firstloop/reception/")) {
        return "receptionist";
    }
    if (url.includes("admin/saleperson/merchant_list")) {
        return "saleperson";
    }
    if (url.startsWith("admin/") || url.includes("/admin/")) {
        return "admin";
    }

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
    if (keys.role === "admin") {
        const adminToken = localStorage.getItem("admin_token");
        if (adminToken && adminToken !== "null" && adminToken !== "undefined") {
            return adminToken;
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
    // Fallback: if admin token exists and user is browsing admin pages
    const adminToken = localStorage.getItem("access_token") || localStorage.getItem("admin_token");
    if (adminToken && adminToken !== "null" && adminToken !== "undefined") {
        const path = String(window.location.pathname || "").toLowerCase();
        if (!path.includes("/merchant") && !path.includes("/receptionist") && !path.startsWith("/saleperson-") && !path.startsWith("/panel")) {
            return adminToken;
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
    return null;
};

/* ---------------------------------------------------
   Save Tokens
--------------------------------------------------- */
export const saveTokens = (accessToken, refreshToken = null, reqUrl = "") => {
    const keys = getTokenKeys(reqUrl);

    if (accessToken) {
        localStorage.setItem(keys.access, accessToken);
    }
    if (refreshToken) {
        localStorage.setItem(keys.refresh, refreshToken);
    }
};

/* ---------------------------------------------------
   Isolated Logout (Only logs out the specific role)
--------------------------------------------------- */
const activeLogouts = new Set();

export const logoutAndRedirect = (message, targetAppType = null) => {
    const path = String(window.location.pathname || "").toLowerCase();
    if (path.startsWith("/card-preview") || path.startsWith("/card-image") || path.startsWith("/card-only")) {
        return; // Allow public preview/image without session redirection
    }

    const appType = targetAppType || getAppType();

    if (activeLogouts.has(appType)) {
        return;
    }
    activeLogouts.add(appType);
    setTimeout(() => activeLogouts.delete(appType), 3000);

    if (message) {
        toast.error(message);
    }

    if (appType === "merchant") {
        localStorage.removeItem("mer_access_token");
        localStorage.removeItem("mer_refresh_token");
        localStorage.removeItem("merchant_data");

        setTimeout(() => {
            window.location.href = "/panel/merchant/login";
        }, 1200);
    } else if (appType === "saleperson") {
        localStorage.removeItem("sale_access_token");
        localStorage.removeItem("sale_refresh_token");
        localStorage.removeItem("saleperson_data");

        setTimeout(() => {
            window.location.href = "/saleperson-login";
        }, 1200);
    } else if (appType === "receptionist") {
        localStorage.removeItem("rec_access_token");
        localStorage.removeItem("rec_refresh_token");
        localStorage.removeItem("receptionist_token");
        localStorage.removeItem("receptionist_data");
        localStorage.removeItem("rec_data");
        localStorage.removeItem("rec_user_id");
        localStorage.removeItem("rec_user_repId");

        setTimeout(() => {
            window.location.href = "/panel/receptionist/login";
        }, 1200);
    } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("admin_data");
        localStorage.removeItem("role");

        setTimeout(() => {
            window.location.href = "/";
        }, 1200);
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

        // Check for role/endpoint scope mismatch (e.g. non-admin calling admin endpoint)
        const isAdminEndpoint = reqUrl.includes("admin/") || reqUrl.startsWith("admin");
        if (appType !== "admin" && isAdminEndpoint) {
            return Promise.reject(error);
        }

        // Prevent infinite retry
        if (originalRequest._retry) {
            logoutAndRedirect("Session expired. Please login again.", appType);
            return Promise.reject(error);
        }

        if (originalRequest.url?.includes("/refresh-token")) {
            logoutAndRedirect("Session expired. Please login again.", appType);
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const refreshToken = getRefreshToken(reqUrl);

            if (!refreshToken || refreshToken === "null" || refreshToken === "undefined") {
                logoutAndRedirect("Session expired. Please login again.", appType);
                return Promise.reject(error);
            }

            const refreshResponse = await axios.post(
                `${import.meta.env.VITE_API_URL}/admin/refresh-token`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${refreshToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const refreshData = refreshResponse.data;

            if (refreshData?.status === 1 && refreshData?.access_token) {
                saveTokens(refreshData.access_token, refreshData.refresh_token, reqUrl);

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${refreshData.access_token}`;

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