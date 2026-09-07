import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Store, Mail, User, Phone, AlertCircle, ArrowRight } from 'lucide-react';

export const MerchantSignupModal = () => {
  const { isSignupModalOpen, setIsSignupModalOpen, registerMerchant } = useApp();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    storeName: '',
    category: 'Cafes & Coffee Shops'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isSignupModalOpen) return null;

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
      registerMerchant(formData);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsSignupModalOpen(false);
      }}
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-purple-100 my-auto animate-in zoom-in-95 duration-200 scrollbar-none">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-5 sm:p-8 text-white relative sticky top-0 z-10 border-b border-teal-800/40">
          <button
            onClick={() => setIsSignupModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-xs font-bold text-teal-300 border border-teal-500/30 mb-2">
            <span>Merchant Onboarding</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            Get Started with First Loop
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Create your merchant account to launch Apple & Google Wallet loyalty cards in minutes.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-4 sm:space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Laura Jenkins"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  if (errors.fullName) setErrors({ ...errors, fullName: null });
                }}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
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
                placeholder="e.g. laura@coffeehouse.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
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

          {/* Mobile Number (Mandatory) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Mobile Number <span className="text-rose-500">*</span>
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
                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
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
              Business / Merchant Name <span className="text-rose-500">*</span>
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
                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="Cafes & Coffee Shops">Cafes & Coffee Shops</option>
              <option value="Restaurants & Food Service">Restaurants & Food Service</option>
              <option value="Fitness & Classes">Fitness & Classes</option>
              <option value="Hair, Beauty & Personal Care">Hair, Beauty & Personal Care</option>
              <option value="Fashion & Retail">Fashion & Retail</option>
              <option value="Pet Care & Local Services">Pet Care & Local Services</option>
            </select>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-full text-base font-bold text-white bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Opening Category Cards...</span>
                </>
              ) : (
                <>
                  <span>Submit & View Category Cards</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
