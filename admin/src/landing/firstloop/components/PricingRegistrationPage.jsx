import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Mail, User, AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle2, ShieldCheck, Zap, Crown, Coffee, Check,
  Lock, Eye, EyeOff, Sparkles
} from 'lucide-react';
import PhoneNumberField from '../../../components/PhoneNumberField.jsx';
import API from '../../../api';
import { toast } from 'react-hot-toast';

export const PricingRegistrationPage = () => {
  const navigate = useNavigate();
  const { 
    selectedPlan = 'growth', 
    selectedBilling = 'yearly', 
    setSelectedPlan, 
    setSelectedBilling, 
    setActiveTab, 
    registerMerchant,
    navigateToLegal
  } = useApp();

  const [billing, setBilling] = useState(selectedBilling || 'yearly');
  const [activePlanKey, setActivePlanKey] = useState(selectedPlan || 'growth');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+91',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const formRef = useRef(null);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      fullName: 'Starter Plan',
      tagline: 'Ideal for single cafes & local shops',
      monthlyPrice: '₹999',
      yearlyPrice: '₹799',
      yearlyTotal: '₹9,588/year',
      badge: 'Single Store',
      icon: Coffee,
      popular: false,
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
    {
      id: 'growth',
      name: 'Growth Pro',
      fullName: 'Growth Pro Plan',
      tagline: 'Best for busy restaurants, salons & studios',
      monthlyPrice: '₹2,499',
      yearlyPrice: '₹1,999',
      yearlyTotal: '₹23,988/year',
      badge: 'Most Popular',
      icon: Zap,
      popular: true,
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
    {
      id: 'enterprise',
      name: 'Enterprise',
      fullName: 'Enterprise Scale',
      tagline: 'For retail chains, franchises & large brands',
      monthlyPrice: '₹4,999',
      yearlyPrice: '₹3,999',
      yearlyTotal: '₹47,988/year',
      badge: 'Franchise & Chains',
      icon: Crown,
      popular: false,
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
  ];

  const currentPlan = plans.find(p => p.id === activePlanKey) || plans[1];

  const handleSelectPlan = (planId) => {
    setActivePlanKey(planId);
    if (setSelectedPlan) setSelectedPlan(planId);
    // Smooth scroll down to the form
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleBillingToggle = (type) => {
    setBilling(type);
    if (setSelectedBilling) setSelectedBilling(type);
  };

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
        errs.email = 'Please enter a valid email address';
      }
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Mobile Number is required';
    } else {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length < 7) {
        errs.phone = 'Please enter a valid mobile number';
      }
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const payload = {
    
      name: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      country_code: formData.countryCode || '+91',
      password: formData.password,
      // plan: currentPlan.fullName,
      // planId: currentPlan.id,
      // plan_id: currentPlan.id,
      // billing: billing,
      // billingInterval: billing,
      // price: billing === 'yearly' ? currentPlan.yearlyPrice : currentPlan.monthlyPrice
    };

    try {
      const response = await API.post('api/merchant/register-step1', payload);
      const data = response?.data || {};

      if (data.status === 1) {
        // Store merchant auth session
        if (data.access_token || data.token) {
          localStorage.setItem("mer_access_token", data.access_token || data.token);
        }
        if (data.refresh_token) {
          localStorage.setItem("mer_refresh_token", data.refresh_token);
        }
        localStorage.setItem("merchant_data", JSON.stringify(data));
        localStorage.setItem("role", "merchant");
        sessionStorage.setItem("role", "merchant");

        // Set theme attributes for FirstLoop merchant dashboard
        document.documentElement.setAttribute('data-role', 'firstloop');
        document.body.setAttribute('data-role', 'firstloop');
        document.documentElement.setAttribute('data-theme', 'firstloop');
        document.body.setAttribute('data-theme', 'firstloop');

        toast.success(data.message || 'Registration successful!');

        if (registerMerchant) {
          registerMerchant({
            ...payload,
            apiResponse: data
          });
        }
        setRegistrationSuccess(true);

        // Immediate redirect to merchant dashboard
        navigate('/merchant/dashboard');
      } else {
        const errMsg = data.message || 'Registration failed';
        toast.error(errMsg);
      }
    } catch (error) {
      console.error('Merchant Registration Step 1 Error:', error);
      const apiMsg = error?.response?.data?.message || error?.message || 'Registration failed. Please try again.';
      toast.error(apiMsg);
      if (error?.response?.data?.errors) {
        setErrors(prev => ({ ...prev, ...error.response.data.errors }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 sm:pt-28 pb-24 bg-slate-50 min-h-screen">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Bar: Back to Home */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => setActiveTab('home')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-extrabold border border-slate-200/90 shadow-sm transition-all group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-slate-600" />
            <span>Back to Home</span>
          </button>

          <div className="text-xs font-bold text-teal-800 bg-teal-100/80 px-3.5 py-1.5 rounded-full border border-teal-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
            <span>Instant Digital Card Activation</span>
          </div>
        </div>

        {/* Header Title Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
            <span>Simple, Transparent Plans</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Choose Your First Loop Plan
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
            Select a plan below to launch your digital Apple Wallet & Google Wallet loyalty cards in minutes.
          </p>

          {/* Monthly / Yearly Toggle Button inside Section */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs sm:text-sm font-bold ${billing === 'monthly' ? 'text-slate-900 font-black' : 'text-slate-500'}`}>
              Monthly Billed
            </span>
            
            <div className="bg-slate-200/90 p-1 rounded-full flex items-center border border-slate-300/80">
              <button
                type="button"
                onClick={() => handleBillingToggle('monthly')}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  billing === 'monthly'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => handleBillingToggle('yearly')}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billing === 'yearly'
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Yearly</span>
                <span className="bg-emerald-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                  Save 20%
                </span>
              </button>
            </div>

            <span className={`text-xs sm:text-sm font-bold flex items-center gap-1 ${billing === 'yearly' ? 'text-teal-700 font-black' : 'text-slate-500'}`}>
              <span>Yearly Billed</span>
            </span>
          </div>
        </div>

        {/* 3 Pricing Packages Grid (Same Box Model) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = activePlanKey === plan.id;
            const displayPrice = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                className={`bg-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative cursor-pointer ${
                  isSelected
                    ? 'border-2 border-teal-600 shadow-2xl shadow-teal-900/10 scale-102 lg:-translate-y-2 ring-4 ring-teal-500/15'
                    : plan.popular
                    ? 'border-2 border-slate-300 shadow-xl hover:shadow-2xl hover:border-teal-400 hover:-translate-y-1'
                    : 'border border-slate-200 shadow-md hover:shadow-xl hover:border-slate-300 hover:-translate-y-1'
                }`}
              >
                {/* Plan Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                    plan.popular
                      ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm'
                      : isSelected
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {plan.badge}
                  </span>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Selected</span>
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">{plan.name}</h3>
                  </div>

                  <p className="text-xs text-slate-500 min-h-[32px] font-medium leading-relaxed">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="my-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900">{displayPrice}</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-500">/ month</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-semibold">
                      {billing === 'yearly' ? `Billed annually (${plan.yearlyTotal})` : 'Billed monthly'}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      What's Included:
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                            isSelected ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Plan Select Action Button */}
                <div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(plan.id);
                    }}
                    className={`w-full py-3.5 rounded-2xl text-xs font-black tracking-wide uppercase transition-all shadow-md cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white hover:bg-teal-800 shadow-slate-900/20'
                        : plan.popular
                        ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white hover:from-teal-700 hover:to-sky-700 shadow-teal-600/30'
                        : 'bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white'
                    }`}
                  >
                    {isSelected ? 'Selected (Fill Form Below)' : `Choose ${plan.name}`}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* SEPARATE INLINE FORM SECTION (BELOW PACKAGE BOX SECTION) */}
        <div ref={formRef} className="max-w-4xl mx-auto scroll-mt-28">
          
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/5 overflow-hidden">
            
            {/* Form Section Header with Selected Package Details */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-6 sm:p-8 text-white border-b border-teal-800/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-xs font-bold text-teal-300 border border-teal-500/30 mb-2">
                    <span>Merchant Registration</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Complete Your Store Registration
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Enter your details below to activate your digital loyalty program and wallet passes.
                  </p>
                </div>

                {/* Live Selected Plan Capsule */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-left sm:text-right shrink-0">
                  <div className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">
                    Selected Package
                  </div>
                  <div className="text-lg font-black text-white">
                    {currentPlan.fullName}
                  </div>
                  <div className="text-xs font-semibold text-emerald-300 mt-0.5">
                    {billing === 'yearly' ? currentPlan.yearlyPrice : currentPlan.monthlyPrice}/mo ({billing === 'yearly' ? 'Yearly' : 'Monthly'})
                  </div>
                </div>

              </div>
            </div>

            {/* Registration Form */}
            <div className="p-6 sm:p-10">
              
              {registrationSuccess ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Registration Successful!</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Welcome to First Loop! Redirecting to your merchant dashboard...
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => navigate('/merchant/dashboard')}
                      className="px-8 py-3.5 rounded-full bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-600/30 cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Go to Merchant Dashboard</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('home')}
                      className="px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Return to Homepage
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
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
                          className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
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
                          className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
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

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Mandatory Mobile Phone Number */}
                    <div>
                      <PhoneNumberField
                        value={formData.phone}
                        countryCode={formData.countryCode || '+91'}
                        required={true}
                        label="Mobile Phone Number"
                        placeholder="e.g. 98765 43210"
                        onChange={(value, countryCode) => {
                          setFormData(prev => ({
                            ...prev,
                            phone: value || '',
                            countryCode: countryCode || '+91'
                          }));
                          if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
                        }}
                      />
                      {errors.phone && (
                        <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>{errors.phone}</span>
                        </p>
                      )}
                    </div>

                    {/* Account Password */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create password (min. 6 characters)"
                          value={formData.password}
                          onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                            if (errors.password) setErrors({ ...errors, password: null });
                          }}
                          className={`w-full pl-11 pr-11 py-3.5 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                            errors.password
                              ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-500'
                              : 'border-slate-200 focus:border-teal-600 focus:ring-teal-500/20'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>{errors.password}</span>
                        </p>
                      )}
                    </div>

                  </div>


                  {/* Guarantee Banner */}
                  <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200/80 flex items-center gap-3 text-xs text-teal-900">
                    <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <strong className="font-bold">Instant Setup:</strong> Select your package to generate live Apple & Google Wallet passes. Cancel anytime.
                    </div>
                  </div>

                  {/* Submit Button (Renamed to Submit) */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-teal-600 via-teal-700 to-sky-700 hover:from-teal-700 hover:to-sky-800 shadow-xl shadow-teal-600/25 hover:shadow-teal-600/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-slate-500 text-center font-medium">
                      By submitting, you agree to First Loop's{' '}
                      <button
                        type="button"
                        onClick={() => navigateToLegal('terms')}
                        className="text-teal-700 hover:text-teal-900 underline font-bold cursor-pointer"
                      >
                        Terms of Service
                      </button>
                      {' '}and{' '}
                      <button
                        type="button"
                        onClick={() => navigateToLegal('privacy')}
                        className="text-teal-700 hover:text-teal-900 underline font-bold cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                      .
                    </p>
                  </div>

                </form>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
