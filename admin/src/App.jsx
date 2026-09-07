import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AppToaster from './components/AppToaster.jsx';
import Navbar from './components/Navbar.jsx';

// Admin
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Merchants from './pages/admin/Merchants';
import DeletedMerchants from './pages/admin/DeletedMerchants';
import Customers from './pages/admin/Customers';
import SalePersons from './pages/admin/SalePersons';
import SalePersonMerchants from './pages/admin/SalePersonMerchants';
import Categories from './pages/admin/Categories';
import Appointments from './pages/admin/Appointments';
import MerchantReports from './pages/admin/MerchantReports';
import CustomerReports from './pages/admin/CustomerReports';
import CustomerReportDetails from './pages/admin/CustomerReportDetails';
import ViewMerchReport from './pages/admin/ViewMerchReport';
import Notifications from './pages/admin/Notifications';
import NotificationList from './pages/admin/NotificationList';
import Profile from './pages/admin/Profile';
import AddMerchant from './pages/admin/AddMerchant';
import EditMerchant from './pages/admin/EditMerchant';
import Branches from './pages/admin/Branches';
import Receptionists from './pages/admin/Receptionists';
import ViewMerchant from './pages/admin/ViewMerchant';
import ViewDeletedMerchant from './pages/admin/ViewDeletedMerchant';
import ViewBranch from './pages/admin/ViewBranch';
import ViewFlBranch from './pages/admin/ViewFlBranch';
import FpCustomerDetails from './pages/admin/FpCustomerDetails';
import CardDesigns from './pages/admin/CardDesigns';
import CardPreview from './pages/admin/CardPreview';
import CardImage from './pages/admin/CardImage';
import BranchReport from './pages/admin/BranchReport';
import BranchChat from './pages/admin/BranchChat';
import BranchPendingImages from './pages/admin/BranchPendingImages';
import CouponClaim from './pages/admin/CouponClaim';
import Settings from './pages/admin/Settings';
import Support from './pages/admin/Support';
import ProtectedRoute from './pages/admin/ProtectedRoute';
import AdminCharts from './pages/admin/AdminCharts';
import FirstLoopComingSoon from './pages/admin/FirstLoopComingSoon';
import AddCardCustomer from './pages/admin/AddCardCustomer';
import NotFound from './pages/NotFound';


// SALE LOGIN
import SalePersonLogin from './pages/saleperson/SalePersonLogin.jsx';
import SalePersonDashboard from './pages/saleperson/SalePersonDashboard.jsx';
import SalePersonAddMerchant from './pages/saleperson/AddMerchant.jsx';

// Merchant UI
import MerchantLayout from './pages/merchant/MerchantLayout.jsx';
import MerchantLogin from './pages/merchant/MerchantLogin.jsx';
import MerchantDashboard from './pages/merchant/MerchantDashboard.jsx';
import MerchantCustomerList from './pages/merchant/CustomerList.jsx';
import MerchantCardList from './pages/merchant/CardList.jsx';
import MerchantBranchList from './pages/merchant/BranchList.jsx';
import MerchantReceptionistList from './pages/merchant/ReceptionistList.jsx';
// import MerchantViewBranch from './pages/merchant/ViewFlBranch.jsx';
import MerchantBranchReceptionists from './pages/merchant/BranchReceptionists.jsx';
import MerchantReportsView from './pages/merchant/MerchantReports.jsx';

// Receptionist UI
import ReceptionistLayout from './pages/receptionist/ReceptionistLayout.jsx';
import ReceptionistLogin from './pages/receptionist/ReceptionistLogin.jsx';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard.jsx';
import ReceptionistCustomerList from './pages/receptionist/ReceptionistCustomerList.jsx';
import CardCheckInPayment from './pages/receptionist/CardCheckInPayment.jsx';

// Website
//first pass
import Header from './component/Header.jsx';
import Footer from './component/Footer.jsx';
import MobileMenu from './component/MobileMenu.jsx';
import ConfigurationMenu from './component/ConfigurationMenu.jsx';

import Landing from './landing/firstpass/Home.jsx';
import Company from './landing/firstpass/About.jsx';
import Offerings from './landing/firstpass/Services.jsx';
import Portfolio from './landing/firstpass/Works.jsx';
import Journal from './landing/firstpass/Blog.jsx';
import ReachUs from './landing/firstpass/Contact.jsx';
import DataPolicy from './landing/firstpass/PrivacyPolicy.jsx';
import Conditions from './landing/firstpass/TermsCustomer.jsx';
import HowItWorks from './landing/firstpass/HowItWorks.jsx';
import DeleteAccount from './landing/firstpass/DeleteAccount.jsx';
import UnderConstruction from './landing/firstpass/UnderConstruction.jsx';
import CustomerApp from './landing/firstpass/CustomerApp.jsx';

// FirstLoop Standalone Website
import FirstLoopWebsite from './landing/firstloop/App.jsx';
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
  const hideHeaderFooter = ['/under-construction', '/delete-account', '/data-policy', '/conditions', '/customer-app', '/firstloop-coming-soon'].includes(pathname) || pathname.startsWith('/firstloop') || pathname.startsWith('/card-preview') || pathname.startsWith('/card-image') || pathname.startsWith('/card-only');

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
          <Route path="/customer-app" element={<CustomerApp />} />
          <Route path="/firstloop-coming-soon" element={<FirstLoopComingSoon />} />
          <Route path="/firstloop" element={<FirstLoopWebsite />} />
          <Route path="/firstloop/*" element={<FirstLoopWebsite />} />
          <Route path="/card-preview/:id" element={<CardPreview />} />
          <Route path="/card-preview/:id/:type" element={<CardPreview />} />
          <Route path="/card-image/:id" element={<CardImage />} />
          <Route path="/card-image/:id/:type" element={<CardImage />} />
          <Route path="/card-only/:id" element={<CardImage />} />
          <Route path="/card-only/:id/:type" element={<CardImage />} />
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
        <Route path="card-preview/:id" element={<CardPreview />} />
        <Route path="card-preview/:id/:type" element={<CardPreview />} />
        <Route path="card-image/:id" element={<CardImage />} />
        <Route path="card-image/:id/:type" element={<CardImage />} />
        <Route path="card-only/:id" element={<CardImage />} />
        <Route path="card-only/:id/:type" element={<CardImage />} />
        <Route path="saleperson-login" element={<SalePersonLogin />} />
        <Route path="saleperson-dashboard" element={<SalePersonDashboard />} />
        <Route path="saleperson-add-merchant" element={<SalePersonAddMerchant />} />
        <Route path="firstloop-coming-soon" element={<FirstLoopComingSoon />} />
        <Route path="firstloop" element={<FirstLoopComingSoon />} />

        {/* Merchant UI Routes */}
        <Route path="merchant/login" element={<MerchantLogin />} />
        <Route path="merchant-login" element={<MerchantLogin />} />

        <Route path="merchant" element={<MerchantLayout />}>
          <Route index element={<Navigate to="/merchant/dashboard" replace />} />
          <Route path="dashboard" element={<MerchantDashboard />} />
          <Route path="customers" element={<MerchantCustomerList />} />
          <Route path="customers/:id" element={<FpCustomerDetails />} />
          <Route path="cards" element={<MerchantCardList />} />
          <Route path="branches" element={<MerchantBranchList />} />
          <Route path="receptionists" element={<MerchantReceptionistList />} />
          <Route path="branches/:id" element={<ViewFlBranch />} />
          <Route path="view-fl-branch/:id" element={<ViewFlBranch />} />
          <Route path="branches/:branchId/checkin" element={<CardCheckInPayment />} />
          <Route path="checkin" element={<CardCheckInPayment />} />
          <Route path="checkin/:branchId" element={<CardCheckInPayment />} />
          <Route path="add-card-customer" element={<AddCardCustomer />} />
          <Route path="add-card-customer/:branchId" element={<AddCardCustomer />} />
          <Route path="branches/:branchId/receptionists" element={<MerchantBranchReceptionists />} />
          <Route path="reports" element={<MerchantReportsView />} />
        </Route>

        {/* Receptionist UI Routes */}
        <Route path="receptionist/login" element={<ReceptionistLogin />} />
        <Route path="receptionist-login" element={<ReceptionistLogin />} />

        <Route path="receptionist" element={<ReceptionistLayout />}>
          <Route index element={<Navigate to="/receptionist/dashboard" replace />} />
          <Route path="dashboard" element={<ReceptionistDashboard />} />
          <Route path="customers" element={<ReceptionistCustomerList />} />
          <Route path="checkin" element={<CardCheckInPayment />} />
          <Route path="add-card-customer" element={<AddCardCustomer />} />
          <Route path="add-card-customer/:branchId" element={<AddCardCustomer />} />
          <Route path="view-fl-branch/:id" element={<ViewFlBranch />} />
        </Route>

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
                    <Route path="salepersons" element={<SalePersons />} />
          <Route path="salepersons/:id/merchants" element={<SalePersonMerchants />} />
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
          <Route path="view-fl-branch" element={<ViewFlBranch />} />
          <Route path="view-fl-branch/:id" element={<ViewFlBranch />} />
          <Route path="add-card-customer" element={<AddCardCustomer />} />
          <Route path="add-card-customer/:branchId" element={<AddCardCustomer />} />
          <Route path="fp-customer_details" element={<FpCustomerDetails />} />
          <Route path="fp-customer_details/:id" element={<FpCustomerDetails />} />
          <Route path="branch-report/:id" element={<BranchReport />} />
          <Route path="branch-chat/:id" element={<BranchChat />} />
          <Route path="admin-chat/:id" element={<AdminCharts />} />
          <Route path="branch-pending-images/:id" element={<BranchPendingImages />} />
          <Route path="branches" element={<Branches />} />
          <Route path="receptionists" element={<Receptionists />} />
          <Route path="settings" element={<Settings />} />
          <Route path="banners" element={<Settings />} />
          <Route path="card-designs" element={<CardDesigns />} />
          <Route path="support" element={<Support />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  const location = useLocation();
  const isAdmin = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/merchant');

  return (
    <>
      <ScrollToTopAndAnimate />
      {isAdmin ? <AdminLayout /> : <WebsiteLayout />}
    </>
  );
}
