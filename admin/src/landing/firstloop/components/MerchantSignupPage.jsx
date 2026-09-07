import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Store, Mail, User, Phone, AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle2, Sparkles, ShieldCheck, Zap, Crown, Coffee, Check, HelpCircle
} from 'lucide-react';

export const MerchantSignupPage = () => {
  const { 
    selectedPlan, 
    selectedBilling, 
    setSelectedPlan, 
    setSelectedBilling, 
    setActiveTab, 
    registerMerchant 
  } = useApp();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    storeName: '',
    category: 'Cafes & Coffee Shops'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Plan Details dictionary
  const plansData = {
    starter: {
      id: 'starter',
      name: 'Starter Plan',
      tagline: 'Ideal for single cafes & local shops',
      monthlyPrice: '₹999',
      yearlyPrice: '₹799',
      yearlyTotal: '₹9,588/yr',
      badge: 'Single Store',
      icon: <Coffee className="w-5 h-5 text-teal-600" />,
      features: [
        '1 Active Digital Stamp Card Design',
        'Apple Wallet & Google Wallet passes',
        'Up to 500 active customers',
        'Unlimited QR scans & stamps',
        'Direct lock-screen push notifications',
        'Real-time visit analytics dashboard',
        'Email & community support'
      ]
    },
    growth: {
      id: 'growth',
      name: 'Growth Pro Plan',
      tagline: 'Best for busy restaurants, salons & studios',
      monthlyPrice: '₹2,499',
      yearlyPrice: '₹1,999',
      yearlyTotal: '₹23,988/yr',
      badge: 'Most Popular',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      features: [
        'Up to 3 Digital Card Designs (Loyalty + VIP)',
        'Apple Wallet & Google Wallet passes',
        'Up to 2,500 active customers',
        'Unlimited scans, stamps & automated rewards',
        'Automated birthday & win-back push messages',
        'Custom brand colors, logos & icons',
        'Advanced customer segmentation & CSV export',
        'Priority WhatsApp & phone support'
      ]
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise Scale',
      tagline: 'For retail chains, franchises & large brands',
      monthlyPrice: '₹4,999',
      yearlyPrice: '₹3,999',
      yearlyTotal: '₹47,988/yr',
      badge: 'Franchise & Chains',
      icon: <Crown className="w-5 h-5 text-indigo-600" />,
      features: [
        'Unlimited Digital Card Designs & Passes',
        'Unlimited active customer passes',
        'Multi-location staff accounts & manager PINs',
        'POS & custom Webhook/API integrations',
        'Dedicated account manager & onboarding',
        'Custom domain & white-label wallet passes',
        '24/7 SLA Priority support'
      ]
    }
  };

  const currentPlan = plansData[selectedPlan] || plansData.growth;

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name is required';
    }
    
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Please enter a valid email address (e.g. name@company.com)';
      }
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Mobile Number is required';
    } else {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length < 10) {
        errs.phone = 'Please enter a valid 10-digit mobile number';
      }
    }

    if (!formData.storeName.trim()) {
      errs.storeName = 'Business or Store Name is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      registerMerchant({
        ...formData,
        plan: selectedPlan,
        billing: selectedBilling
      });
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="pt-24 sm:pt-28 pb-20 bg-slate-50 min-h-screen">
      
      {/* Background Glow */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Navigation Bar: Back to Home */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setActiveTab('home')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold border border-slate-200/80 shadow-sm transition-all group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-slate-500" />
            <span>Back to Home</span>
          </button>

          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Instant Pass Activation</span>
          </div>
        </div>

        {/* Header Title Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Merchant Onboarding</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Launch Your Digital Loyalty Program
          </h1>
          <p className="text-slate-600 text-sm sm:text-base font-medium">
            Fill in your business details below to instantly generate your Apple & Google Wallet loyalty pass.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Plan Summary & Selector */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xl shadow-slate-900/5 relative overflow-hidden">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    {currentPlan.badge}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2 flex items-center gap-2">
                    {currentPlan.icon}
                    <span>{currentPlan.name}</span>
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">
                    {selectedBilling === 'yearly' ? currentPlan.yearlyPrice : currentPlan.monthlyPrice}
                    <span className="text-xs font-semibold text-slate-500">/mo</span>
                  </div>
                  {selectedBilling === 'yearly' && (
                    <div className="text-[10px] font-bold text-emerald-600">
                      Billed annually ({currentPlan.yearlyTotal})
                    </div>
                  )}
                </div>
              </div>

              {/* Plan Switcher Pills */}
              <div className="mt-5 space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Select Plan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(plansData).map((planKey) => {
                    const plan = plansData[planKey];
                    const isSelected = selectedPlan === planKey;
                    return (
                      <button
                        key={planKey}
                        type="button"
                        onClick={() => setSelectedPlan(planKey)}
                        className={`p-2.5 rounded-2xl text-xs font-bold text-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="truncate">{plan.name.split(' ')[0]}</div>
                        <div className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-teal-300' : 'text-slate-500'}`}>
                          {selectedBilling === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Billing Toggle (Monthly / Yearly) */}
              <div className="mt-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700">Billing Interval:</div>
                <div className="inline-flex rounded-xl bg-slate-200/80 p-1">
                  <button
                    type="button"
                    onClick={() => setSelectedBilling('monthly')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedBilling === 'monthly'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBilling('yearly')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedBilling === 'yearly'
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Yearly</span>
                    <span className="text-[9px] bg-emerald-400 text-slate-950 font-black px-1 rounded-full">
                      -20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Included Features Checklist */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  What's included in {currentPlan.name}:
                </div>
                <ul className="space-y-2.5">
                  {currentPlan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                      <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Trust & Guarantee Box */}
            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">100% Risk-Free Guarantee</h4>
                  <p className="text-xs text-slate-300">Fast & simple setup • Cancel anytime</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-slate-300 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Instant card generation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Apple & Google ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>24/7 Setup Assistance</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Merchant Registration Form */}
          <div className="lg:col-span-7">
            
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-10 relative overflow-hidden">
              
              <div className="mb-6 pb-6 border-b border-slate-100">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Business Registration
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  Provide your store details to set up your merchant dashboard and digital loyalty cards.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        if (errors.fullName) setErrors({ ...errors, fullName: null });
                      }}
                      className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                        errors.fullName
                          ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500'
                          : 'border-slate-200 focus:border-teal-600 focus:ring-teal-500/20'
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="e.g. rahul@artisanroast.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: null });
                      }}
                      className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                        errors.email
                          ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500'
                          : 'border-slate-200 focus:border-teal-600 focus:ring-teal-500/20'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mobile Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: null });
                      }}
                      className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                        errors.phone
                          ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500'
                          : 'border-slate-200 focus:border-teal-600 focus:ring-teal-500/20'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>

                {/* Business / Merchant Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Business / Store Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Artisan Roast Coffee"
                      value={formData.storeName}
                      onChange={(e) => {
                        setFormData({ ...formData, storeName: e.target.value });
                        if (errors.storeName) setErrors({ ...errors, storeName: null });
                      }}
                      className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                        errors.storeName
                          ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500'
                          : 'border-slate-200 focus:border-teal-600 focus:ring-teal-500/20'
                      }`}
                    />
                  </div>
                  {errors.storeName && (
                    <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>{errors.storeName}</span>
                    </p>
                  )}
                </div>

                {/* Industry Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Industry Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Cafes & Coffee Shops">Cafes & Coffee Shops</option>
                    <option value="Restaurants & Food Service">Restaurants & Food Service</option>
                    <option value="Fitness & Classes">Fitness & Classes</option>
                    <option value="Hair, Beauty & Personal Care">Hair, Beauty & Personal Care</option>
                    <option value="Fashion & Retail">Fashion & Retail</option>
                    <option value="Pet Care & Local Services">Pet Care & Local Services</option>
                  </select>
                </div>

                {/* Notification Notice */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    By registering, your merchant dashboard and digital wallet passes will be set up instantly. Registration details will be confirmed to your email and dispatched securely.
                  </span>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-teal-600 via-teal-700 to-sky-700 hover:from-teal-700 hover:to-sky-800 shadow-xl shadow-teal-600/25 hover:shadow-teal-600/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Creating Your Digital Passes...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Registration & View Passes</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
