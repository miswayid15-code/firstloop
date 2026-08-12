import axios from "axios";
import { toast } from "react-hot-toast";

const API = axios.create({

    baseURL: import.meta.env.VITE_API_URL + "/",

    headers: {
        "Content-Type": "application/json"
    }

});

const logoutAndRedirect = (message) => {
    const isSalePerson = window.location.pathname.includes("saleperson");
    if (isSalePerson) {
        localStorage.removeItem("sale_access_token");
        localStorage.removeItem("sale_refresh_token");
        localStorage.removeItem("saleperson_data");
        toast.error(message || "Session expired. Please login again.");
        setTimeout(() => {
            window.location.href = "/admin/saleperson-login";
        }, 1500);
    } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("admin_data");
        toast.error(message || "Session expired. Please login again.");
        setTimeout(() => {
            window.location.href = "/admin";
        }, 1500);
    }
};

// Request Interceptor
API.interceptors.request.use(
    (config) => {
        const isSalePerson = window.location.pathname.includes("saleperson");
        const accessToken = isSalePerson
            ? (localStorage.getItem("sale_access_token") || localStorage.getItem("access_token") || localStorage.getItem("admin_token"))
            : (localStorage.getItem("access_token") || localStorage.getItem("admin_token") || localStorage.getItem("sale_access_token"));

        if (accessToken && accessToken !== "null" && accessToken !== "undefined") {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
API.interceptors.response.use(

    (response) => response,

    async (error) => {

        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {

            originalRequest._retry = true;

            try {

                const isSalePerson = window.location.pathname.includes("saleperson");
                const refreshToken = isSalePerson
                    ? localStorage.getItem("sale_refresh_token")
                    : localStorage.getItem("refresh_token");

                if (!refreshToken) {
                    logoutAndRedirect("Session expired. Please login again.");
                    return Promise.reject(error);
                }

                const refreshResponse = await axios.post(
                    `${import.meta.env.VITE_API_URL}/admin/refresh-token`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${refreshToken}`
                        }
                    }
                );

                const refreshData = refreshResponse.data;

                if (refreshData.status === 1) {
                    if (isSalePerson) {
                        localStorage.setItem("sale_access_token", refreshData.access_token);
                        if (refreshData.refresh_token) {
                            localStorage.setItem("sale_refresh_token", refreshData.refresh_token);
                        }
                    } else {
                        localStorage.setItem("access_token", refreshData.access_token);
                        if (refreshData.refresh_token) {
                            localStorage.setItem("refresh_token", refreshData.refresh_token);
                        }
                    }

                    originalRequest.headers.Authorization = `Bearer ${refreshData.access_token}`;
                    return API(originalRequest);
                }

                logoutAndRedirect("Session expired. Please login again.");
            } catch (err) {
                logoutAndRedirect("Session expired. Please login again.");
                return Promise.reject(err);

            }

        }

        return Promise.reject(error);

    }

);

export default API;