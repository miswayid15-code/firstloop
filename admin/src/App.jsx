import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
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

function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<Layout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="merchants" element={<Merchants />} />
                <Route path="customers" element={<Customers />} />
                <Route path="categories" element={<Categories />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="reports" element={<Reports />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="notification-list" element={<NotificationList />} />
                <Route path="profile" element={<Profile />} />
                <Route path="add-merchant" element={<AddMerchant />} />
                <Route path="edit-merchant/:id" element={<EditMerchant />} />
                <Route path="view-merchant/:id" element={<ViewMerchant />} />
                <Route path="branches" element={<Branches />} />
                <Route path="receptionists" element={<Receptionists />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
