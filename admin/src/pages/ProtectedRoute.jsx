import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const location = useLocation();

    const isValidToken = (token) =>
        Boolean(token) && token !== "null" && token !== "undefined";

    const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("admin_token");

    if (!isValidToken(token)) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("admin_data");
        return <Navigate to="/" replace />;
    }

    const role =
        sessionStorage.getItem("role") ||
        localStorage.getItem("role") ||
        "firstpass";

    if (role === "firstloop") {
        if (location.pathname !== "/firstloop-coming-soon" && location.pathname !== "/firstloop") {
            return <Navigate to="/firstloop-coming-soon" replace />;
        }
    }

    return children;
}