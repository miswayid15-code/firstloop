import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import AppToaster from './components/AppToaster.jsx'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Merchants from './pages/Merchants'
import Customers from './pages/Customers'
import Categories from './pages/Categories'
import Appointments from './pages/Appointments'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import NotificationList from './pages/NotificationList'
import Profile from './pages/Profile'
import AddMerchant from './pages/AddMerchant'
import EditMerchant from './pages/EditMerchant'
import Branches from './pages/Branches'
import Receptionists from './pages/Receptionists'
import ViewMerchant from './pages/ViewMerchant'
import ViewBranch from './pages/ViewBranch'
import BranchChat from './pages/BranchChat'
import CouponClaim from './pages/CouponClaim'
import ProtectedRoute from './pages/ProtectedRoute'

import ComingSoon from './frontend/ComingSoon'
import TermsAndConditions from './frontend/TermsAndConditions'
import PrivacyPolicy from './frontend/PrivacyPolicy'
import About from './frontend/About'
import DeleteAccount from './frontend/DeleteAccount'

const isAdmin = window.location.pathname.startsWith('/admin');

function App() {
    return (
        <>
            <AppToaster />
            <Routes>
                {/* Public / Frontend routes */}
                <Route path="/" element={isAdmin ? <Login /> : <ComingSoon />} />
                <Route path="/coming-soon" element={<ComingSoon />} />
                <Route path="/about" element={<About />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/delete-account" element={<DeleteAccount />} />

                {/* Admin routes */}
                <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="merchants" element={<Merchants />} />
                <Route path="customers" element={<Customers />} />
                <Route path="categories" element={<Categories />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="coupon-claim" element={<CouponClaim />} />
                <Route path="reports" element={<Reports />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="notification-list" element={<NotificationList />} />
                <Route path="profile" element={<Profile />} />
                <Route path="add-merchant" element={<AddMerchant />} />
                <Route path="edit-merchant/:id" element={<EditMerchant />} />
                <Route path="view-merchant/:id" element={<ViewMerchant />} />
                <Route path="view-branch/:id" element={<ViewBranch />} />
                <Route path="branch-chat/:id" element={<BranchChat />} />
                <Route path="branches" element={<Branches />} />
                <Route path="receptionists" element={<Receptionists />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </>
    )
}

export default App
