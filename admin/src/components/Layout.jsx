import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function Layout() {
    return (
        <div className="app-container">
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
