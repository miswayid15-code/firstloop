import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {

    const location = useLocation();

    const isValidToken = (token) =>
        Boolean(token) && token !== "null" && token !== "undefined";

    const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("admin_token");

    // =====================================================
    // AUTHENTICATION CHECK
    // =====================================================
    if (!isValidToken(token)) {

        localStorage.removeItem("access_token");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("admin_data");

        return <Navigate to="/" replace />;
    }

    // =====================================================
    // CURRENT ROLE
    // =====================================================
    const role =
        sessionStorage.getItem("role") ||
        localStorage.getItem("role") ||
        "firstpass";

    // =====================================================
    // FIRSTLOOP ONLY PAGES
    // =====================================================
    const firstLoopOnlyPaths = [
        "/card-designs",
        "/salepersons",
        "/view-fl-branch",
        "/fp-customer_details"
    ];

    // =====================================================
    // PAGES ALLOWED FOR FIRSTLOOP
    // =====================================================
    const firstLoopAllowedPaths = [
        "/dashboard",
        "/merchants",
        "/view-merchant",
        "/view-branch",
        "/customers",
        "/categories",
        "/card-designs",
        "/salepersons",
        "/view-fl-branch",
        "/fp-customer_details",
        "/firstloop-coming-soon",
        "/firstloop"
    ];

    // =====================================================
    // CHECK PATH
    // =====================================================
    const isPathMatch = (paths) => {
        return paths.some(
            (path) =>
                location.pathname === path ||
                location.pathname.startsWith(`${path}/`)
        );
    };

    // =====================================================
    // FIRSTLOOP ACCESS - Coming Soon Only
    // =====================================================
    // if (role === "firstloop") {
    //     if (location.pathname !== "/firstloop-coming-soon" && location.pathname !== "/firstloop") {
    //         return <Navigate to="/firstloop-coming-soon" replace />;
    //     }
    // }

    // =====================================================
    // FIRSTPASS ACCESS
    // =====================================================
    if (role === "firstpass" && isPathMatch(firstLoopOnlyPaths)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}