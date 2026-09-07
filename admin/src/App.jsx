import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AppToaster from './components/AppToaster.jsx';
import Navbar from './components/Navbar.jsx';
import FirstLoopWebsite from './landing/firstloop/App.jsx';
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
function DomainLoginRoute({ type }) {
  const hostname = window.location.hostname;

  const isFirstLoopDomain =
    hostname === 'firstloop.co.in' ||
    hostname === 'www.firstloop.co.in';

  if (type === 'merchant' && isFirstLoopDomain) {
    return <MerchantLogin />;
  }

  if (type === 'receptionist' && isFirstLoopDomain) {
    return <ReceptionistLogin />;
  }

  return <Navigate to="/not-found" replace />;
}
function AdminLayout() {
  const hostname = window.location.hostname;

  const isFirstLoopDomain =
    hostname === 'firstloop.co.in' ||
    hostname === 'www.firstloop.co.in';

  const isFirstPassDomain =
    hostname === 'firstpassapp.co' ||
    hostname === 'www.firstpassapp.co';

  return (
    <>
      <AppToaster />

      <Routes>
        {/* Common routes */}
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

        {/* =====================================================
            FIRSTLOOP ONLY
            /admin/merchant/login
            /admin/receptionist/login
        ====================================================== */}
        {isFirstLoopDomain && (
          <>
            <Route
              path="merchant/login"
              element={<MerchantLogin />}
            />

            <Route
              path="receptionist/login"
              element={<ReceptionistLogin />}
            />
          </>
        )}

        {/* =====================================================
            FIRSTPASS ONLY
            Merchant routes
        ====================================================== */}
        {isFirstPassDomain && (
          <>
            <Route path="merchant" element={<MerchantLayout />}>
              <Route
                index
                element={<Navigate to="/merchant/dashboard" replace />}
              />

              <Route
                path="dashboard"
                element={<MerchantDashboard />}
              />

              <Route
                path="customers"
                element={<MerchantCustomerList />}
              />

              <Route
                path="customers/:id"
                element={<FpCustomerDetails />}
              />

              <Route
                path="cards"
                element={<MerchantCardList />}
              />

              <Route
                path="branches"
                element={<MerchantBranchList />}
              />

              <Route
                path="receptionists"
                element={<MerchantReceptionistList />}
              />

              <Route
                path="branches/:id"
                element={<ViewFlBranch />}
              />

              <Route
                path="view-fl-branch/:id"
                element={<ViewFlBranch />}
              />

              <Route
                path="branches/:branchId/checkin"
                element={<CardCheckInPayment />}
              />

              <Route
                path="checkin"
                element={<CardCheckInPayment />}
              />

              <Route
                path="checkin/:branchId"
                element={<CardCheckInPayment />}
              />

              <Route
                path="add-card-customer"
                element={<AddCardCustomer />}
              />

              <Route
                path="add-card-customer/:branchId"
                element={<AddCardCustomer />}
              />

              <Route
                path="branches/:branchId/receptionists"
                element={<MerchantBranchReceptionists />}
              />

              <Route
                path="reports"
                element={<MerchantReportsView />}
              />
            </Route>
          </>
        )}

        {/* =====================================================
            RECEPTIONIST ROUTES
            Keep these only if they should be accessible from
            FirstLoop. Otherwise protect them with isFirstLoopDomain.
        ====================================================== */}
        {isFirstLoopDomain && (
          <Route
            path="receptionist"
            element={<ReceptionistLayout />}
          >
            <Route
              index
              element={
                <Navigate
                  to="/admin/receptionist/dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<ReceptionistDashboard />}
            />

            <Route
              path="customers"
              element={<ReceptionistCustomerList />}
            />

            <Route
              path="checkin"
              element={<CardCheckInPayment />}
            />

            <Route
              path="add-card-customer"
              element={<AddCardCustomer />}
            />

            <Route
              path="add-card-customer/:branchId"
              element={<AddCardCustomer />}
            />

            <Route
              path="view-fl-branch/:id"
              element={<ViewFlBranch />}
            />
          </Route>
        )}

        {/* =====================================================
            FIRSTPASS ADMIN ROUTES
            Keep ALL your existing admin routes here
        ====================================================== */}

        {/* Example:
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="merchants" element={<Merchants />} />
        ...
        */}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  const location = useLocation();

  const isFirstLoopDomain =
    window.location.hostname === 'firstloop.co.in' ||
    window.location.hostname === 'www.firstloop.co.in';

  const isFirstPassDomain =
    window.location.hostname === 'firstpassapp.co' ||
    window.location.hostname === 'www.firstpassapp.co';

  const isFirstLoopRoot =
    isFirstLoopDomain && location.pathname === '/';

  const isFirstLoopMerchantLogin =
    isFirstLoopDomain &&
    location.pathname === '/admin/merchant/login';

  const isFirstLoopReceptionistLogin =
    isFirstLoopDomain &&
    location.pathname === '/admin/receptionist/login';

  const isFirstLoopAllowed =
    isFirstLoopRoot ||
    isFirstLoopMerchantLogin ||
    isFirstLoopReceptionistLogin;

  const isAdmin =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/merchant');

  return (
    <>
      <ScrollToTopAndAnimate />

      {isFirstLoopAllowed ? (
        isFirstLoopRoot ? (
          <FirstLoopWebsite />
        ) : (
          <AdminLayout />
        )
      ) : isFirstPassDomain && isAdmin ? (
        <AdminLayout />
      ) : isAdmin ? (
        <AdminLayout />
      ) : (
        <WebsiteLayout />
      )}
    </>
  );
}