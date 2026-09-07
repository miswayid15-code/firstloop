import React from 'react';
import './index.css';
import { AppProvider, useApp } from './context/AppContext';
import { Preloader } from './components/Preloader';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { LandingSections } from './components/LandingSections';
import { PricingRegistrationPage } from './components/PricingRegistrationPage';
import { MerchantList } from './components/MerchantList';
import { LegalPage } from './components/LegalPage';
import { MerchantModal } from './components/MerchantModal';
import { SocialMenu } from './components/SocialMenu';
import { BackToTop } from './components/BackToTop';
import { Footer } from './components/Footer';

const MainContent = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative selection:bg-teal-500 selection:text-white">
      
      {/* Animated Preloader */}
      <Preloader />

      {/* Sticky Top Header */}
      <Header />

      {/* Main Dynamic View */}
      <main className="flex-1">
        {activeTab === 'home' ? (
          <>
            <Hero />
            <LandingSections />
          </>
        ) : activeTab === 'dashboard' ? (
          <MerchantList />
        ) : activeTab === 'terms' || activeTab === 'privacy' ? (
          <LegalPage initialTab={activeTab} />
        ) : (
          <PricingRegistrationPage />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Modals & Overlays */}
      <MerchantModal />
      <SocialMenu />
      <BackToTop />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
