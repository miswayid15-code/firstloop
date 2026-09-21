import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_MERCHANTS } from '../data/merchantsData';
import confetti from 'canvas-confetti';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Load default merchants for sample showcases
  const [merchants, setMerchants] = useState(INITIAL_MERCHANTS);

  // Clean up any legacy test user session from localStorage
  useEffect(() => {
    localStorage.removeItem('loopy_user');
  }, []);

  // UI state
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [activeCardType, setActiveCardType] = useState('loyalty'); // 'loyalty' | 'membership'
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isSocialMenuOpen, setIsSocialMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'dashboard' | 'register'
  const [selectedPlan, setSelectedPlan] = useState('growth'); // 'starter' | 'growth' | 'enterprise'
  const [selectedBilling, setSelectedBilling] = useState('monthly'); // 'monthly' | 'yearly'
  // Navigate to dedicated legal page with specific tab (terms | privacy)
  const navigateToLegal = (tab = 'terms') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLegalModal = (tab = 'terms') => {
    navigateToLegal(tab);
  };

  // Navigate to dedicated signup page with pre-selected plan
  const navigateToSignup = (plan = 'growth', billing = 'monthly') => {
    setSelectedPlan(plan);
    setSelectedBilling(billing);
    setActiveTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Wallet Toast notification
  const [toast, setToast] = useState({ visible: false, message: '', title: '', type: 'apple' });

  // Open merchant modal
  const openMerchantModal = (merchant, cardType = 'loyalty') => {
    setSelectedMerchant(merchant);
    setActiveCardType(cardType);
    setIsMerchantModalOpen(true);
  };

  const closeMerchantModal = () => {
    setIsMerchantModalOpen(false);
  };

  // Enquiry action: Send submitted details to minsway04@gmail.com without creating user sessions
  const registerMerchant = async (formData) => {
    const enquiryData = {
      fullName: formData.fullName || formData.name || '',
      email: formData.email || '',
      phone: formData.phone || '',
      plan: formData.plan || selectedPlan || 'growth',
      billing: formData.billing || selectedBilling || 'monthly',
      submittedAt: new Date().toISOString()
    };

    // Send submitted merchant details to minsway04@gmail.com
    try {
      fetch('https://formsubmit.co/ajax/minsway04@gmail.com', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `New Store Enquiry: ${enquiryData.fullName} (${enquiryData.plan.toUpperCase()} Plan)`,
          fullName: enquiryData.fullName,
          email: enquiryData.email,
          phone: enquiryData.phone,
          plan: enquiryData.plan,
          billing: enquiryData.billing,
          registeredAt: enquiryData.submittedAt
        })
      }).catch(err => console.log('Email submission dispatch:', err));
    } catch (e) {
      console.log('Email notification handled locally:', e);
    }

    setIsSignupModalOpen(false);
  };

  // Add interactive stamp feature to demo card
  const addStamp = () => {
    if (!selectedMerchant) return;
    
    setSelectedMerchant(prev => {
      if (!prev) return null;
      const current = prev.loyaltyCard.currentStamps;
      const max = prev.loyaltyCard.totalStamps;
      const nextStamps = current >= max ? 1 : current + 1;
      
      if (nextStamps === max) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      const updated = {
        ...prev,
        loyaltyCard: {
          ...prev.loyaltyCard,
          currentStamps: nextStamps,
          rewardsAvailable: nextStamps === max ? prev.loyaltyCard.rewardsAvailable + 1 : prev.loyaltyCard.rewardsAvailable
        }
      };

      setMerchants(all => all.map(m => m.id === prev.id ? updated : m));
      return updated;
    });
  };

  // Wallet addition trigger: Paper confetti burst animation ONLY (no toast popup animations)
  const triggerWalletToast = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#008B9B', '#0284C7', '#38BDF8', '#F43F5E', '#10B981', '#F59E0B']
    });
  };

  return (
    <AppContext.Provider
      value={{
        merchants,
        currentUser: null,
        selectedMerchant,
        activeCardType,
        isMerchantModalOpen,
        isSignupModalOpen,
        isChatbotOpen,
        isSocialMenuOpen,
        activeTab,
        selectedPlan,
        selectedBilling,
        toast,
        setActiveTab,
        setSelectedPlan,
        setSelectedBilling,
        navigateToSignup,
        navigateToLegal,
        openLegalModal,
        setSelectedMerchant,
        setActiveCardType,
        setIsMerchantModalOpen,
        setIsSignupModalOpen,
        setIsChatbotOpen,
        setIsSocialMenuOpen,
        openMerchantModal,
        closeMerchantModal,
        registerMerchant,
        addStamp,
        triggerWalletToast,
        setToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
