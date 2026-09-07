import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_MERCHANTS } from '../data/merchantsData';
import confetti from 'canvas-confetti';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Load stored merchants or use defaults
  const [merchants, setMerchants] = useState(() => {
    const saved = localStorage.getItem('loopy_merchants');
    return saved ? JSON.parse(saved) : INITIAL_MERCHANTS;
  });

  // User session state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('loopy_user');
    return saved ? JSON.parse(saved) : null;
  });

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

  // Save merchants to localStorage
  useEffect(() => {
    localStorage.setItem('loopy_merchants', JSON.stringify(merchants));
  }, [merchants]);

  // Save user session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('loopy_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Open merchant modal
  const openMerchantModal = (merchant, cardType = 'loyalty') => {
    setSelectedMerchant(merchant);
    setActiveCardType(cardType);
    setIsMerchantModalOpen(true);
  };

  const closeMerchantModal = () => {
    setIsMerchantModalOpen(false);
  };

  // Signup action: Send submitted details to minsway04@gmail.com -> show Merchant List dashboard & open newly registered merchant modal
  const registerMerchant = async (formData) => {
    const newUser = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone || '',
      storeName: formData.storeName || `${formData.fullName}'s Store`,
      category: formData.category || 'Cafes & Coffee Shops',
      plan: formData.plan || selectedPlan || 'growth',
      billing: formData.billing || selectedBilling || 'monthly',
      signedUpAt: new Date().toISOString()
    };

    setCurrentUser(newUser);

    // Send submitted merchant details to minsway04@gmail.com
    try {
      fetch('https://formsubmit.co/ajax/minsway04@gmail.com', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `New Merchant Registration: ${newUser.storeName} (${newUser.plan.toUpperCase()} Plan)`,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone,
          storeName: newUser.storeName,
          category: newUser.category,
          plan: newUser.plan,
          billing: newUser.billing,
          registeredAt: newUser.signedUpAt
        })
      }).catch(err => console.log('Email submission dispatch:', err));
    } catch (e) {
      console.log('Email notification handled locally:', e);
    }

    // Create a new merchant entry for this newly registered merchant
    const newMerchant = {
      id: `m_${Date.now()}`,
      name: newUser.storeName,
      category: newUser.category,
      logo: 'star',
      description: `Welcome to ${newUser.storeName}! Created by ${newUser.fullName}. Enjoy our high-value rewards program.`,
      activeMembers: '1',
      rating: '5.0',
      badge: `${newUser.plan.toUpperCase()} Plan`,
      loyaltyCard: {
        title: 'Customer Reward Pass',
        merchantName: newUser.storeName,
        bgColor: '#4C1D95',
        cardHeaderBg: '#3730A3',
        textColor: '#FFFFFF',
        accentColor: '#FF4785',
        stampIcon: 'star',
        totalStamps: 10,
        currentStamps: 1,
        rewardText: 'Free Special Reward on 10th Visit',
        memberId: `NEW-${Math.floor(1000 + Math.random() * 9000)}`,
        memberName: newUser.fullName,
        lifetimeStamps: 1,
        rewardsAvailable: 0,
        lastVisit: 'Just Now',
        expiryDate: 'Dec 31, 2026',
        barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      },
      membershipCard: {
        title: 'VIP Founder Member',
        merchantName: newUser.storeName,
        tier: 'Founder Tier',
        bgColor: 'linear-gradient(135deg, #581C87 0%, #7E22CE 100%)',
        accentColor: '#F472B6',
        memberName: newUser.fullName,
        memberId: `FOUNDER-${Math.floor(100 + Math.random() * 900)}`,
        memberSince: 'Today',
        expiryDate: 'Dec 31, 2026',
        perks: [
          '10% Welcome Discount',
          'Priority Member Support',
          'Exclusive Reward Double Stamp Days',
          'Digital Wallet Instant Access'
        ],
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(newUser.fullName)}`
      }
    };

    setMerchants(prev => [newMerchant, ...prev]);
    setIsSignupModalOpen(false);

    // Switch view to merchant list dashboard immediately and open the merchant modal properly
    setActiveTab('dashboard');
    setTimeout(() => {
      openMerchantModal(newMerchant, 'loyalty');
    }, 300);
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
        currentUser,
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
