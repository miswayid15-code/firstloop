import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {

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

    return children;
}