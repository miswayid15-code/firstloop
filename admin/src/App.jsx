import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AppToaster from './components/AppToaster.jsx';
import Navbar from './components/Navbar.jsx';

// Admin
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Merchants from './pages/Merchants';
import DeletedMerchants from './pages/DeletedMerchants';
import Customers from './pages/Customers';
import Categories from './pages/Categories';
import Appointments from './pages/Appointments';
import MerchantReports from './pages/MerchantReports';
import CustomerReports from './pages/CustomerReports';
import CustomerReportDetails from './pages/CustomerReportDetails';
import ViewMerchReport from './pages/ViewMerchReport';
import Notifications from './pages/Notifications';
import NotificationList from './pages/NotificationList';
import Profile from './pages/Profile';
import AddMerchant from './pages/AddMerchant';
import EditMerchant from './pages/EditMerchant';
import Branches from './pages/Branches';
import Receptionists from './pages/Receptionists';
import ViewMerchant from './pages/ViewMerchant';
import ViewDeletedMerchant from './pages/ViewDeletedMerchant';
import ViewBranch from './pages/ViewBranch';
import BranchReport from './pages/BranchReport';
import BranchChat from './pages/BranchChat';
import BranchPendingImages from './pages/BranchPendingImages';
import CouponClaim from './pages/CouponClaim';
import Settings from './pages/Settings';
import Support from './pages/Support';
import ProtectedRoute from './pages/ProtectedRoute';
import NotFound from './pages/NotFound';


// Website
import Header from './component/Header.jsx';
import Footer from './component/Footer.jsx';
import MobileMenu from './component/MobileMenu.jsx';
import ConfigurationMenu from './component/ConfigurationMenu.jsx';

import Landing from './page/Home.jsx';
import Company from './page/About.jsx';
import Offerings from './page/Services.jsx';
import Portfolio from './page/Works.jsx';
import Journal from './page/Blog.jsx';
import ReachUs from './page/Contact.jsx';
import DataPolicy from './page/PrivacyPolicy.jsx';
import Conditions from './page/TermsCustomer.jsx';
import HowItWorks from './page/HowItWorks.jsx';
import DeleteAccount from './page/DeleteAccount.jsx';
import UnderConstruction from './page/UnderConstruction.jsx';

function ScrollToTopAndAnimate() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window to top
    window.scrollTo(0, 0);

    // Close mobile menu drawer if active
    document.querySelector(".offcanvas-menu")?.classList.remove("show");
    document.body.classList.remove("overflow-hidden");

    // Clean up previous GSAP ScrollTriggers
    if (window.ScrollTrigger) {
      window.ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }

    // Re-initialize dynamic features after React renders the new DOM
    const timer = setTimeout(() => {
      if (window.runMainInit) {
        window.runMainInit();
      }
      if (window.runAnimations) {
        window.runAnimations();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

function WebsiteLayout() {
  const { pathname } = useLocation();
  const hideHeaderFooter = ['/under-construction', '/delete-account', '/data-policy', '/conditions'].includes(pathname);

  const [loading, setLoading] = useState(!hideHeaderFooter);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (!loading) return;

    // Start fade out transition
    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 1200);

    // Completely unmount preloader component
    const removeTimer = setTimeout(() => {
      setLoading(false);
    }, 1700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [loading]);

  return (
    <>
      {loading && (
        <div className={`preloader-wrapper ${fade ? 'preloader-fade-out' : ''}`}>
          <div className="preloader-logo-container">
            <img src="/asset/images/img/fs.png" alt="Logo" className="preloader-logo" />
            <div className="preloader-spinner"></div>
          </div>
        </div>
      )}

      {!hideHeaderFooter && <Header />}

      <main id={hideHeaderFooter ? undefined : "wrapper"} style={hideHeaderFooter ? undefined : { overflowX: "hidden" }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/company" element={<Company />} />
          <Route path="/offerings" element={<Offerings />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/reach-us" element={<ReachUs />} />
          <Route path="/data-policy" element={<DataPolicy />} />
          <Route path="/conditions" element={<Conditions />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/under-construction" element={<UnderConstruction />} />
        </Routes>
      </main>

      {!hideHeaderFooter && <Footer />}
      {!hideHeaderFooter && <MobileMenu />}
      {!hideHeaderFooter && <ConfigurationMenu />}
    </>
  );
}

function AdminLayout() {
  return (
    <>
      <AppToaster />

      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="merchants" element={<Merchants />} />
          <Route path="deleted-merchants" element={<DeletedMerchants />} />
          <Route path="customers" element={<Customers />} />
          <Route path="categories" element={<Categories />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="coupon-claim" element={<CouponClaim />} />
          <Route path="reports" element={<Navigate to="/merchant-reports" replace />} />
          <Route path="merchant-reports" element={<MerchantReports />} />
          <Route path="merchant-report/:id" element={<ViewMerchReport />} />
          <Route path="customer-reports" element={<CustomerReports />} />
          <Route path="customer-report/:id" element={<CustomerReportDetails />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="notification-list" element={<NotificationList />} />
          <Route path="profile" element={<Profile />} />
          <Route path="add-merchant" element={<AddMerchant />} />
          <Route path="edit-merchant/:id" element={<EditMerchant />} />
          <Route path="view-merchant/:id" element={<ViewMerchant />} />
          <Route path="view-deleted-merchant/:id" element={<ViewDeletedMerchant />} />
          <Route path="view-branch/:id" element={<ViewBranch />} />
          <Route path="branch-report/:id" element={<BranchReport />} />
          <Route path="branch-chat/:id" element={<BranchChat />} />
          <Route path="branch-pending-images/:id" element={<BranchPendingImages />} />
          <Route path="branches" element={<Branches />} />
          <Route path="receptionists" element={<Receptionists />} />
          <Route path="settings" element={<Settings />} />
          <Route path="banners" element={<Settings />} />
          <Route path="support" element={<Support />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  const location = useLocation();
  const isAdmin = window.location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTopAndAnimate />
      {isAdmin ? <AdminLayout /> : <WebsiteLayout />}
    </>
  );
}
