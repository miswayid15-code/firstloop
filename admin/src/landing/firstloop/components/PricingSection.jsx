import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Check, ArrowRight, Zap, Crown, Coffee, ShieldCheck, Sparkles, HelpCircle
} from 'lucide-react';

export const PricingSection = () => {
  const { navigateToSignup } = useApp();
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'yearly'

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      badge: 'Single Store',
      tagline: 'Ideal for single cafes, boutique stores & local neighborhood shops.',
      monthlyPrice: '₹999',
      yearlyPrice: '₹799',
      yearlyTotal: '₹9,588 billed annually',
      isPopular: false,
      icon: <Coffee className="w-6 h-6 text-teal-600" />,
      features: [
        '1 Digital Card Design (Loyalty Stamp Pass)',
        'Apple Wallet & Google Wallet passes',
        'Up to 500 active customers',
        'Unlimited QR scans & stamp issuing',
        'Push notifications straight to lock-screen',
        'Real-time visit analytics & metrics',
        'Email & community support'
      ],
      ctaText: 'Choose Plan'
    },
    {
      id: 'growth',
      name: 'Growth Pro',
      badge: 'Most Popular',
      tagline: 'Designed for busy restaurants, salons, studios & growing shops.',
      monthlyPrice: '₹2,499',
      yearlyPrice: '₹1,999',
      yearlyTotal: '₹23,988 billed annually',
      isPopular: true,
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      features: [
        'Up to 3 Digital Card Designs (Loyalty + VIP Membership)',
        'Apple Wallet & Google Wallet passes',
        'Up to 2,500 active customers',
        'Unlimited scans & automated reward stamping',
        'Automated birthday & win-back push messages',
        'Custom brand colors, logos & icons',
        'Advanced customer segmentation & CSV export',
        'Priority WhatsApp & phone support'
      ],
      ctaText: 'Choose Plan'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      badge: 'Franchise & Scale',
      tagline: 'Built for multi-location franchises, retail chains & large brands.',
      monthlyPrice: '₹4,999',
      yearlyPrice: '₹3,999',
      yearlyTotal: '₹47,988 billed annually',
      isPopular: false,
      icon: <Crown className="w-6 h-6 text-indigo-600" />,
      features: [
        'Unlimited Digital Card Designs & Passes',
        'Apple Wallet & Google Wallet passes',
        'Unlimited active customer passes',
        'Multi-location staff accounts & manager PINs',
        'Custom Webhooks & POS integration support',
        'Dedicated onboarding & account manager',
        'Custom domain & white-label pass branding',
        '24/7 SLA Priority support'
      ],
      ctaText: 'Choose Plan'
    }
  ];

  return (
    <section id="pricing" className="py-20 lg:py-24 bg-slate-50/70 relative overflow-hidden border-t border-b border-slate-200/60">
      
      {/* Background Decorative Blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-teal-200/25 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-100/80 text-teal-800 text-xs font-extrabold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Pricing Plans</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Simple, Predictable Plans for Every Stage
          </h2>
          
          <p className="text-slate-600 text-base sm:text-lg font-medium">
            Choose a plan to launch your digital Apple Wallet & Google Wallet loyalty cards.
          </p>
        </div>

        {/* Monthly / Yearly Billing Toggle */}
        <div className="flex items-center justify-center mb-14">
          <div className="bg-white p-1.5 rounded-full border border-slate-200/90 shadow-md flex items-center gap-2">
            
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                billing === 'monthly'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>

            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                billing === 'yearly'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Yearly Billing</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${
                billing === 'yearly'
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-teal-100 text-teal-800'
              }`}>
                Save 20% + 2 Months Free
              </span>
            </button>

          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-14">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 relative ${
                plan.isPopular
                  ? 'bg-white border-2 border-teal-600 shadow-2xl shadow-teal-900/10 ring-4 ring-teal-500/10 -translate-y-1 sm:-translate-y-2'
                  : 'bg-white border border-slate-200/90 shadow-card hover:shadow-xl hover:border-slate-300'
              }`}
            >
              {/* Most Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-teal-600 via-teal-700 to-sky-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg shadow-teal-900/20 whitespace-nowrap border border-white/20">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shadow-sm">
                    {plan.icon}
                  </div>
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${
                    plan.isPopular
                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {plan.badge}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {plan.name}
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed font-medium">
                  {plan.tagline}
                </p>

                {/* Price Display */}
                <div className="pb-6 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                      {billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-slate-500 text-sm font-semibold">/month</span>
                  </div>
                  {billing === 'yearly' && (
                    <div className="text-xs font-bold text-emerald-600 mt-1">
                      {plan.yearlyTotal}
                    </div>
                  )}
                </div>

                {/* Features Checklist */}
                <div className="py-6 space-y-3.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    What's included:
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 font-medium">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                          plan.isPopular
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Plan Action CTA */}
              <div className="pt-6 border-t border-slate-100 mt-auto">
                <button
                  onClick={() => navigateToSignup(plan.id, billing)}
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-md ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white shadow-teal-600/30 hover:shadow-teal-600/40'
                      : 'bg-slate-900 hover:bg-teal-700 text-white shadow-slate-900/10'
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Below Pricing: Dedicated Separate Page Form Onboarding Gateway */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            
            <div className="space-y-3 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                <ShieldCheck className="w-4 h-4" />
                <span>Instant Wallet Pass Setup</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Ready to setup your digital card program?
              </h3>

              <p className="text-sm text-slate-300 font-normal leading-relaxed">
                Click below to choose your plan and complete your merchant registration. Fill in your business details in under 2 minutes and get live Apple & Google Wallet passes.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-teal-400" />
                  <span>Instant card generation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-teal-400" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-teal-400" />
                  <span>Apple & Google Wallet Ready</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto text-center">
              <button
                onClick={() => navigateToSignup('growth', billing)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-extrabold text-sm shadow-xl shadow-teal-500/30 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Go to Registration Page</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="text-[11px] text-slate-400 mt-2 font-medium">
                Opens full registration page (no modal popups)
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
