import axios from "axios";
import { toast } from "react-hot-toast";

const API = axios.create({

    baseURL: import.meta.env.VITE_API_URL + "/",

    headers: {
        "Content-Type": "application/json"
    }

});

const logoutAndRedirect = (message) => {
    localStorage.clear();
    toast.error(message || "Session expired. Please login again.");
    window.location.href = "/";
};

// Request Interceptor
API.interceptors.request.use(

    (config) => {

        const accessToken =
            localStorage.getItem("access_token") ||
            localStorage.getItem("admin_token");

        if (accessToken && accessToken !== "null" && accessToken !== "undefined") {

            config.headers.Authorization =
                `Bearer ${accessToken}`;

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

                const refreshToken =
                    localStorage.getItem("refresh_token");

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

                const refreshData =
                    refreshResponse.data;

                if (refreshData.status === 1) {

                    localStorage.setItem(
                        "access_token",
                        refreshData.access_token
                    );

                    if (refreshData.refresh_token) {

                        localStorage.setItem(
                            "refresh_token",
                            refreshData.refresh_token
                        );

                    }

                    originalRequest.headers.Authorization =
                        `Bearer ${refreshData.access_token}`;

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