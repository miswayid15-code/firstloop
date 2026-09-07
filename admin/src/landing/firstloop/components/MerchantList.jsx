import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LoyaltyStampCard } from './LoyaltyStampCard';
import { MembershipCard } from './MembershipCard';
import { WalletButtons } from './WalletButtons';
import { 
  Store, ArrowLeft, Coffee, Crown, CheckCircle2, Sparkles, 
  User, Mail, Phone, ShieldCheck, Edit3, ArrowRight, Zap
} from 'lucide-react';

export const MerchantList = () => {
  const { currentUser, setActiveTab, navigateToSignup } = useApp();
  const [activeCardType, setActiveCardType] = useState('loyalty');

  // Fallback merchant data if visited before form submission
  const userMerchant = currentUser ? {
    id: 'current_user_merchant',
    name: currentUser.storeName || `${currentUser.fullName}'s Store`,
    category: currentUser.category || 'Cafes & Coffee Shops',
    fullName: currentUser.fullName || 'Store Owner',
    email: currentUser.email || 'merchant@example.com',
    phone: currentUser.phone || '+91 98765 43210',
    plan: currentUser.plan || 'Growth Pro',
    billing: currentUser.billing || 'monthly',
    registeredAt: currentUser.signedUpAt || 'Today',
    loyaltyCard: {
      title: 'Customer Reward Pass',
      merchantName: currentUser.storeName || `${currentUser.fullName}'s Store`,
      totalStamps: 10,
      currentStamps: 1,
      rewardText: 'Free Special Reward on 10th Visit',
      memberName: currentUser.fullName || 'Valued Customer'
    },
    membershipCard: {
      title: 'VIP Founder Member',
      merchantName: currentUser.storeName || `${currentUser.fullName}'s Store`,
      tier: 'Founder VIP Tier',
      memberName: currentUser.fullName || 'Valued Customer'
    }
  } : {
    id: 'demo_merchant',
    name: 'Artisan Roast Coffee & Bakery',
    category: 'Cafes & Coffee Shops',
    fullName: 'Rahul Sharma',
    email: 'rahul@artisanroast.com',
    phone: '+91 98765 43210',
    plan: 'Growth Pro Plan',
    billing: 'yearly',
    registeredAt: 'Today',
    loyaltyCard: {
      title: 'Customer Reward Pass',
      merchantName: 'Artisan Roast Coffee & Bakery',
      totalStamps: 10,
      currentStamps: 1,
      rewardText: 'Free Handcrafted Drink on 10th Stamp',
      memberName: 'Demo Customer'
    },
    membershipCard: {
      title: 'VIP Founder Member',
      merchantName: 'Artisan Roast Coffee & Bakery',
      tier: 'VIP Gold Tier',
      memberName: 'Demo Customer'
    }
  };

  return (
    <div className="pt-24 sm:pt-28 pb-24 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Controls Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => setActiveTab('home')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-extrabold border border-slate-200 shadow-sm transition-all group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-slate-600" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-900 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Sample Watermark Preview</span>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
              <span>Instant Pass Activation</span>
            </div>
          </div>
        </div>

        {/* Hero Header for the Single Submitted User Card */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-teal-800/40 mb-10 relative overflow-hidden">
          
          {/* Subtle ambient light */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-extrabold border border-teal-500/30">
                <Store className="w-3.5 h-3.5" />
                <span>{userMerchant.category}</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {userMerchant.name}
              </h1>
              
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                {currentUser ? (
                  <>
                    Congratulations <strong>{currentUser.fullName}</strong>! Below is your personalized digital loyalty card design configured with the <strong className="text-teal-300">{currentUser.plan || 'Growth Pro'}</strong> plan.
                  </>
                ) : (
                  <>
                    Below is the interactive sample digital loyalty pass for your store. Tap to test stamping and preview wallet integration.
                  </>
                )}
              </p>
            </div>

            {/* Plan Badge Capsule */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 self-start md:self-auto text-left md:text-right">
              <div className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">
                Active Package
              </div>
              <div className="text-lg font-black text-white">
                {userMerchant.plan}
              </div>
              <div className="text-xs font-semibold text-emerald-300 mt-0.5">
                ● Sample Pass Ready
              </div>
            </div>
          </div>
        </div>

        {/* If no user submitted yet, show helpful prompt */}
        {!currentUser && (
          <div className="mb-8 p-4 bg-teal-50 rounded-2xl border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-teal-900">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-teal-600 shrink-0" />
              <span>You are viewing the default sample pass. Register your store to customize your business name and card details!</span>
            </div>
            <button
              onClick={() => navigateToSignup('growth', 'monthly')}
              className="px-4 py-2 rounded-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold whitespace-nowrap shadow-sm cursor-pointer"
            >
              Register Your Store
            </button>
          </div>
        )}

        {/* SINGLE CARD SHOWCASE SECTION (ONLY FOR SUBMITTED USER) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/5 p-6 sm:p-10 space-y-8">
          
          {/* Card Type Segmented Tab Switcher */}
          <div className="max-w-md mx-auto bg-slate-100 p-1.5 rounded-2xl flex items-center justify-between border border-slate-200 gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveCardType('loyalty')}
              className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeCardType === 'loyalty'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Sample Loyalty Card</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCardType('membership')}
              className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeCardType === 'membership'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Sample VIP Pass</span>
            </button>
          </div>

          {/* Single Card Display with Sample Watermark */}
          <div className="py-2">
            {activeCardType === 'loyalty' ? (
              <LoyaltyStampCard merchant={userMerchant} />
            ) : (
              <MembershipCard merchant={userMerchant} />
            )}
          </div>

          {/* Add Pass to Mobile Wallet Section */}
          <div className="pt-6 border-t border-slate-100 max-w-md mx-auto space-y-4">
            <div className="text-center">
              <h4 className="text-sm font-extrabold text-slate-900">Add Sample Pass to Mobile Wallet</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Experience instant Apple Wallet (.pkpass) and Google Wallet pass installation
              </p>
            </div>

            <WalletButtons />
          </div>

          {/* Submitted Store Details Summary Grid */}
          <div className="pt-8 border-t border-slate-100">
            <div className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center justify-between">
              <span>Submitted Account Details</span>
              <button
                onClick={() => navigateToSignup('growth', 'monthly')}
                className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 text-xs font-bold lowercase first-letter:uppercase cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {/* <span>Edit / Change Plan</span> */}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Business / Store</span>
                <span className="font-extrabold text-slate-900 text-sm">{userMerchant.name}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Merchant Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{userMerchant.fullName}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Mobile Phone</span>
                <span className="font-extrabold text-slate-900 text-sm">{userMerchant.phone}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Registered Plan</span>
                <span className="font-extrabold text-teal-700 text-sm">{userMerchant.plan}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
