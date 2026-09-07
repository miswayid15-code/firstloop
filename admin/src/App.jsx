import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import AppToaster from './components/AppToaster.jsx';

// ============================================================
// ADMIN
// ============================================================

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
import AddCardCustomer from './pages/admin/AddCardCustomer';


// ============================================================
// SALE PERSON
// ============================================================

import SalePersonLogin from './pages/saleperson/SalePersonLogin.jsx';
import SalePersonDashboard from './pages/saleperson/SalePersonDashboard.jsx';
import SalePersonAddMerchant from './pages/saleperson/AddMerchant.jsx';


// ============================================================
// MERCHANT
// ============================================================

import MerchantLayout from './pages/merchant/MerchantLayout.jsx';
import MerchantLogin from './pages/merchant/MerchantLogin.jsx';
import MerchantDashboard from './pages/merchant/MerchantDashboard.jsx';
import MerchantCustomerList from './pages/merchant/CustomerList.jsx';
import MerchantCardList from './pages/merchant/CardList.jsx';
import MerchantBranchList from './pages/merchant/BranchList.jsx';
import MerchantReceptionistList from './pages/merchant/ReceptionistList.jsx';
import MerchantBranchReceptionists from './pages/merchant/BranchReceptionists.jsx';
import MerchantReportsView from './pages/merchant/MerchantReports.jsx';


// ============================================================
// RECEPTIONIST
// ============================================================

import ReceptionistLayout from './pages/receptionist/ReceptionistLayout.jsx';
import ReceptionistLogin from './pages/receptionist/ReceptionistLogin.jsx';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard.jsx';
import ReceptionistCustomerList from './pages/receptionist/ReceptionistCustomerList.jsx';
import CardCheckInPayment from './pages/receptionist/CardCheckInPayment.jsx';


// ============================================================
// FIRSTPASS WEBSITE
// ============================================================

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


// ============================================================
// FIRSTLOOP WEBSITE
// ============================================================

import FirstLoopWebsite from './landing/firstloop/App.jsx';


// ============================================================
// SCROLL TO TOP
// ============================================================

function ScrollToTopAndAnimate() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window to top
    window.scrollTo(0, 0);

    // Close mobile menu drawer if active
    document
      .querySelector('.offcanvas-menu')
      ?.classList.remove('show');

    document.body.classList.remove('overflow-hidden');

    // Clean up previous GSAP ScrollTriggers
    if (window.ScrollTrigger) {
      window.ScrollTrigger
        .getAll()
        .forEach(trigger => trigger.kill());
    }

    // Re-initialize dynamic features after React renders
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


// ============================================================
// FIRSTPASS WEBSITE LAYOUT
// ============================================================

function WebsiteLayout() {
  const { pathname } = useLocation();

  const hideHeaderFooter = [
    '/under-construction',
    '/delete-account',
    '/data-policy',
    '/conditions',
    '/customer-app',
    '/firstloop-coming-soon'
  ].includes(pathname)
    || pathname.startsWith('/card-preview')
    || pathname.startsWith('/card-image')
    || pathname.startsWith('/card-only');

  const [loading, setLoading] = useState(!hideHeaderFooter);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (!loading) return;

    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 1200);

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
        <div
          className={`preloader-wrapper ${
            fade ? 'preloader-fade-out' : ''
          }`}
        >
          <div className="preloader-logo-container">
            <img
              src="/asset/images/img/fs.png"
              alt="Logo"
              className="preloader-logo"
            />

            <div className="preloader-spinner"></div>
          </div>
        </div>
      )}

      {!hideHeaderFooter && <Header />}

      <main
        id={hideHeaderFooter ? undefined : 'wrapper'}
        style={
          hideHeaderFooter
            ? undefined
            : { overflowX: 'hidden' }
        }
      >
        <Routes>

          {/* FirstPass Website */}
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
          <Route
            path="/under-construction"
            element={<UnderConstruction />}
          />
          <Route
            path="/customer-app"
            element={<CustomerApp />}
          />

          {/* Card Preview */}
          <Route
            path="/card-preview/:id"
            element={<CardPreview />}
          />

          <Route
            path="/card-preview/:id/:type"
            element={<CardPreview />}
          />

          {/* Card Image */}
          <Route
            path="/card-image/:id"
            element={<CardImage />}
          />

          <Route
            path="/card-image/:id/:type"
            element={<CardImage />}
          />

          {/* Card Only */}
          <Route
            path="/card-only/:id"
            element={<CardImage />}
          />

          <Route
            path="/card-only/:id/:type"
            element={<CardImage />}
          />

          <Route path="*" element={<NotFound />} />

        </Routes>
      </main>

      {!hideHeaderFooter && <Footer />}
      {!hideHeaderFooter && <MobileMenu />}
      {!hideHeaderFooter && <ConfigurationMenu />}
    </>
  );
}


// ============================================================
// FIRSTLOOP WEBSITE LAYOUT
// ============================================================

function FirstLoopWebsiteLayout() {
  return (
    <>
      <ScrollToTopAndAnimate />

      <Routes>
        <Route
          path="/"
          element={<FirstLoopWebsite />}
        />

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </>
  );
}


// ============================================================
// ADMIN LAYOUT
//
// Used for:
//
// firstloop.co.in/admin/...
// firstpassapp.co/admin/...
//
// ============================================================

function AdminLayout() {
  return (
    <>
      <AppToaster />

      <Routes>

        {/* =====================================================
            ADMIN LOGIN
            ===================================================== */}

        <Route
          path="/admin"
          element={<Login />}
        />

        <Route
          path="/admin/"
          element={<Login />}
        />


        {/* =====================================================
            ADMIN PROTECTED ROUTES
            ===================================================== */}

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >

          <Route
            path="/admin/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/admin/merchants"
            element={<Merchants />}
          />

          <Route
            path="/admin/deleted-merchants"
            element={<DeletedMerchants />}
          />

          <Route
            path="/admin/customers"
            element={<Customers />}
          />

          <Route
            path="/admin/salepersons"
            element={<SalePersons />}
          />

          <Route
            path="/admin/salepersons/:id/merchants"
            element={<SalePersonMerchants />}
          />

          <Route
            path="/admin/categories"
            element={<Categories />}
          />

          <Route
            path="/admin/appointments"
            element={<Appointments />}
          />

          <Route
            path="/admin/coupon-claim"
            element={<CouponClaim />}
          />

          <Route
            path="/admin/reports"
            element={
              <Navigate
                to="/admin/merchant-reports"
                replace
              />
            }
          />

          <Route
            path="/admin/merchant-reports"
            element={<MerchantReports />}
          />

          <Route
            path="/admin/merchant-report/:id"
            element={<ViewMerchReport />}
          />

          <Route
            path="/admin/customer-reports"
            element={<CustomerReports />}
          />

          <Route
            path="/admin/customer-report/:id"
            element={<CustomerReportDetails />}
          />

          <Route
            path="/admin/notifications"
            element={<Notifications />}
          />

          <Route
            path="/admin/notification-list"
            element={<NotificationList />}
          />

          <Route
            path="/admin/profile"
            element={<Profile />}
          />

          <Route
            path="/admin/add-merchant"
            element={<AddMerchant />}
          />

          <Route
            path="/admin/edit-merchant/:id"
            element={<EditMerchant />}
          />

          <Route
            path="/admin/view-merchant/:id"
            element={<ViewMerchant />}
          />

          <Route
            path="/admin/view-deleted-merchant/:id"
            element={<ViewDeletedMerchant />}
          />

          <Route
            path="/admin/view-branch/:id"
            element={<ViewBranch />}
          />

          <Route
            path="/admin/view-fl-branch"
            element={<ViewFlBranch />}
          />

          <Route
            path="/admin/view-fl-branch/:id"
            element={<ViewFlBranch />}
          />

          <Route
            path="/admin/add-card-customer"
            element={<AddCardCustomer />}
          />

          <Route
            path="/admin/add-card-customer/:branchId"
            element={<AddCardCustomer />}
          />

          <Route
            path="/admin/fp-customer_details"
            element={<FpCustomerDetails />}
          />

          <Route
            path="/admin/fp-customer_details/:id"
            element={<FpCustomerDetails />}
          />

          <Route
            path="/admin/branch-report/:id"
            element={<BranchReport />}
          />

          <Route
            path="/admin/branch-chat/:id"
            element={<BranchChat />}
          />

          <Route
            path="/admin/admin-chat/:id"
            element={<AdminCharts />}
          />

          <Route
            path="/admin/branch-pending-images/:id"
            element={<BranchPendingImages />}
          />

          <Route
            path="/admin/branches"
            element={<Branches />}
          />

          <Route
            path="/admin/receptionists"
            element={<Receptionists />}
          />

          <Route
            path="/admin/settings"
            element={<Settings />}
          />

          <Route
            path="/admin/banners"
            element={<Settings />}
          />

          <Route
            path="/admin/card-designs"
            element={<CardDesigns />}
          />

          <Route
            path="/admin/support"
            element={<Support />}
          />

        </Route>


        {/* =====================================================
            SALE PERSON
            ===================================================== */}

        <Route
          path="/admin/saleperson-login"
          element={<SalePersonLogin />}
        />

        <Route
          path="/admin/saleperson-dashboard"
          element={<SalePersonDashboard />}
        />

        <Route
          path="/admin/saleperson-add-merchant"
          element={<SalePersonAddMerchant />}
        />


        {/* =====================================================
            ADMIN CARD PREVIEW
            ===================================================== */}

        <Route
          path="/admin/card-preview/:id"
          element={<CardPreview />}
        />

        <Route
          path="/admin/card-preview/:id/:type"
          element={<CardPreview />}
        />

        <Route
          path="/admin/card-image/:id"
          element={<CardImage />}
        />

        <Route
          path="/admin/card-image/:id/:type"
          element={<CardImage />}
        />

        <Route
          path="/admin/card-only/:id"
          element={<CardImage />}
        />

        <Route
          path="/admin/card-only/:id/:type"
          element={<CardImage />}
        />

        {/* =====================================================
            FALLBACK
            ===================================================== */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </>
  );
}


// ============================================================
// MERCHANT LAYOUT
//
// ONLY:
//
// firstloop.co.in/admins/merchant/...
//
// ============================================================

function MerchantAdminLayout() {
  return (
    <>
      <AppToaster />

      <Routes>

        {/* Merchant Login */}
        <Route
          path="/admins/merchant/login"
          element={<MerchantLogin />}
        />

        <Route
          path="/admins/merchant-login"
          element={<MerchantLogin />}
        />

        {/* Merchant */}
        <Route
          path="/admins/merchant"
          element={<MerchantLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="/admins/merchant/dashboard"
                replace
              />
            }
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

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </>
  );
}


// ============================================================
// RECEPTIONIST LAYOUT
//
// ONLY:
//
// firstloop.co.in/admins/receptionist/...
//
// ============================================================

function ReceptionistAdminLayout() {
  return (
    <>
      <AppToaster />

      <Routes>

        {/* Receptionist Login */}
        <Route
          path="/admins/receptionist/login"
          element={<ReceptionistLogin />}
        />

        <Route
          path="/admins/receptionist-login"
          element={<ReceptionistLogin />}
        />

        {/* Receptionist */}
        <Route
          path="/admins/receptionist"
          element={<ReceptionistLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="/admins/receptionist/dashboard"
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

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </>
  );
}


// ============================================================
// MAIN APP
// ============================================================

export default function App() {

  const location = useLocation();

  const hostname = window.location.hostname;
  const pathname = location.pathname;


  // ==========================================================
  // FIRSTLOOP DOMAIN
  // ==========================================================

  const isFirstLoop =
    hostname === 'firstloop.co.in' ||
    hostname === 'www.firstloop.co.in';


  // ==========================================================
  // FIRSTPASS DOMAIN
  // ==========================================================

  const isFirstPass =
    hostname === 'firstpassapp.co' ||
    hostname === 'www.firstpassapp.co';


  // ==========================================================
  // FIRSTLOOP
  //
  // /
  // /admin/...
  // /admins/merchant/...
  // /admins/receptionist/...
  // ==========================================================

  if (isFirstLoop) {

    // FirstLoop Admin
    if (
      pathname === '/admin' ||
      pathname.startsWith('/admin/')
    ) {
      return (
        <>
          <ScrollToTopAndAnimate />
          <AdminLayout />
        </>
      );
    }


    // FirstLoop Merchant
    if (
      pathname === '/admins/merchant' ||
      pathname.startsWith('/admins/merchant/')
    ) {
      return (
        <>
          <ScrollToTopAndAnimate />
          <MerchantAdminLayout />
        </>
      );
    }


    // FirstLoop Receptionist
    if (
      pathname === '/admins/receptionist' ||
      pathname.startsWith('/admins/receptionist/')
    ) {
      return (
        <>
          <ScrollToTopAndAnimate />
          <ReceptionistAdminLayout />
        </>
      );
    }


    // FirstLoop Website
    if (pathname === '/') {
      return <FirstLoopWebsiteLayout />;
    }


    // Anything else on FirstLoop
    return (
      <>
        <ScrollToTopAndAnimate />
        <NotFound />
      </>
    );
  }


  // ==========================================================
  // FIRSTPASS
  //
  // /
  // /admin/...
  //
  // NO MERCHANT
  // NO RECEPTIONIST
  // ==========================================================

  if (isFirstPass) {

    // FirstPass Admin
    if (
      pathname === '/admin' ||
      pathname.startsWith('/admin/')
    ) {
      return (
        <>
          <ScrollToTopAndAnimate />
          <AdminLayout />
        </>
      );
    }


    // FirstPass Website
    return (
      <>
        <ScrollToTopAndAnimate />
        <WebsiteLayout />
      </>
    );
  }


  // ==========================================================
  // UNKNOWN DOMAIN
  // ==========================================================

  return (
    <>
      <ScrollToTopAndAnimate />
      <NotFound />
    </>
  );
}