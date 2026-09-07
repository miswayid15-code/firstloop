import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function Layout() {
    const role = sessionStorage.getItem("role") || localStorage.getItem("role") || "firstpass";

    useEffect(() => {
        document.documentElement.setAttribute("data-role", role);
        document.body.setAttribute("data-role", role);
        document.documentElement.setAttribute("data-theme", role);
        document.body.setAttribute("data-theme", role);
    }, [role]);

    return (
        <div className={`app-container ${role === 'firstloop' ? 'firstloop-theme' : ''}`} data-role={role} data-theme={role}>
            <Sidebar />
            <div className="main-content">
                <Navbar />
                <main className="page-container">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div>
    )
}
