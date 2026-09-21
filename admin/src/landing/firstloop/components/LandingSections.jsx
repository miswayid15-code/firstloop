import React from 'react';
import { useApp } from '../context/AppContext';
import { PricingSection } from './PricingSection';
import { DashboardShowcase } from './DashboardShowcase';
import customerImg from '../assets/customer.png';
import { 
  Palette, QrCode, Bell, BarChart3, Zap, Coffee, Utensils, Dumbbell, 
  Dog, ChevronRight, Scissors, UserCheck, ArrowRight, Check
} from 'lucide-react';
import {
  BrandControlIcon,
  FastEnrollmentIcon,
  SimpleStampingIcon,
  ClearInsightsIcon
} from './LandingIcons';

export const LandingSections = () => {
  const { navigateToSignup, setActiveTab } = useApp();

  const featuresList = [
    {
      step: '01',
      title: 'Brand Control',
      description: 'Create digital stamp cards with your exact logo, brand colors, custom rewards, and headers in minutes.',
      icon: <BrandControlIcon className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" />,
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    {
      step: '02',
      title: 'Fast Enrollment',
      description: 'Customers join instantly via QR code scan or direct web link straight to Apple Wallet & Google Wallet.',
      icon: <FastEnrollmentIcon className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" />,
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    {
      step: '03',
      title: 'Simple Stamping',
      description: 'Add stamps and redeem customer rewards in seconds with our Stamper App or instant web barcode scanner.',
      icon: <SimpleStampingIcon className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" />,
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    {
      step: '04',
      title: 'Clear Insights',
      description: 'Track customer signups, total stamps issued, repeat visit frequency, and real business ROI in real-time.',
      icon: <ClearInsightsIcon className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" />,
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200'
    }
  ];

  return (
    <div className="bg-white">
      
      {/* SECTION 1: Everything you need (Clean Human UI Cards) */}
      <section id="features" className="py-20 lg:py-24 border-b border-slate-100 bg-slate-50/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-100/80 text-teal-800 text-xs font-extrabold uppercase tracking-wider">
              <span>Complete Merchant Toolkit</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Everything you need to run a digital stamp card program
            </h2>
            <p className="text-slate-600 text-base sm:text-lg font-medium">
              Design cards, enroll customers, reward visits, and track results seamlessly.
            </p>
          </div>

          {/* 4 Clean Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {featuresList.map((item, idx) => (
              <div
                key={idx}
                onClick={() => navigateToSignup('growth', 'monthly')}
                className="group relative bg-white rounded-3xl p-7 border border-slate-200/80 shadow-card hover:shadow-xl hover:border-teal-500/40 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-teal-400 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center shadow-md group-hover:shadow-teal-glow transition-all duration-300 shrink-0">
                      {item.icon}
                    </div>

                    <span className="text-[11px] font-black tracking-widest px-3 py-1 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors mb-2.5">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
                    {item.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-1 text-xs font-bold text-teal-600 group-hover:text-teal-700">
                  <span>Explore {item.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 2: One-Stop Solution (Uploaded Image Section) */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 inline-block">
                ONE-STOP SOLUTION
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Smart tools. Real-time results
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                First Loop brings card design, customer enrollment, stamping, messaging, and reporting together in one simple dashboard.
              </p>
              
              <ul className="space-y-3 font-semibold text-slate-700 pt-2">
                <li className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <span>Active cards, stamps, and rewards at a glance</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <span>Optimize what works best for your specific business</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <span>Know your most loyal repeat customers</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="group bg-white p-6 sm:p-7 rounded-3xl shadow-card border border-slate-100 hover:shadow-xl hover:border-teal-300 transition-all cursor-pointer">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 flex items-center justify-center mb-5 transition-all shadow-sm group-hover:shadow-md">
                  <BrandControlIcon className="w-9 h-9 group-hover:rotate-6 transition-transform" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Card design</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Beautiful digital stamp cards with your brand logo, colors, and graphics.
                </p>
              </div>

              <div className="group bg-white p-6 sm:p-7 rounded-3xl shadow-card border border-slate-100 hover:shadow-xl hover:border-teal-300 transition-all cursor-pointer">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 flex items-center justify-center mb-5 transition-all shadow-sm group-hover:shadow-md">
                  <Bell className="w-9 h-9 group-hover:rotate-6 transition-transform stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Smart messaging</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Send lock-screen push notifications to your customers at the right time.
                </p>
              </div>

              <div className="group bg-white p-6 sm:p-7 rounded-3xl shadow-card border border-slate-100 hover:shadow-xl hover:border-teal-300 transition-all cursor-pointer">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 flex items-center justify-center mb-5 transition-all shadow-sm group-hover:shadow-md">
                  <FastEnrollmentIcon className="w-9 h-9 group-hover:rotate-6 transition-transform" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Enrollment</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Share your card via QR code or direct web link so customers join in seconds.
                </p>
              </div>

              <div className="group bg-white p-6 sm:p-7 rounded-3xl shadow-card border border-slate-100 hover:shadow-xl hover:border-teal-300 transition-all cursor-pointer">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 flex items-center justify-center mb-5 transition-all shadow-sm group-hover:shadow-md">
                  <ClearInsightsIcon className="w-9 h-9 group-hover:rotate-6 transition-transform" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Insights & Reporting</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Track customer behavior and campaign performance to clearly prove ROI.
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3: Engage Your Most Valuable Customers */}
      <section className="py-20 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-10 -translate-y-1/2 w-96 h-96 bg-teal-200/30 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Visual: ONLY customer.png floating with floating lily flowers */}
            <div className="lg:col-span-6 relative flex justify-center items-center py-6">
              
              {/* Main Floating Wrapper */}
              <div className="relative w-full max-w-md sm:max-w-lg animate-float-slow group">
                
                {/* Transparent Image Container (No dark blue background) */}
                <div className="relative transition-transform duration-500 hover:scale-[1.02]">
                  <img 
                    src={customerImg} 
                    alt="Engage your most valuable customers" 
                    className="w-full h-auto object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.12)]" 
                  />
                </div>

                {/* Floating Water Lily Blossom 1 (Top Left) - Pure Floating Flower */}
                <div className="absolute -top-6 -left-6 z-20 pointer-events-none animate-float-slow filter drop-shadow-[0_8px_16px_rgba(244,63,94,0.45)]">
                  <svg className="w-14 h-14 sm:w-16 sm:h-16 fill-pink-500 text-pink-300 transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24">
                    <path d="M12 2c-1.5 3-4 5-4 8 0 3 2.5 5 4 5s4-2 4-5c0-3-2.5-5-4-8z" />
                    <path d="M12 7c-3 1-6 4-6 7 0 3.5 2.5 6 6 6s6-2.5 6-6c0-3-3-6-6-7z" opacity="0.85" />
                    <path d="M6 13c-2.5.5-4 2.5-4 4.5C2 20 4.5 21 6 21c3 0 5-2 6-4-2.5 0-4.5-1.5-6-4z" opacity="0.7" />
                    <path d="M18 13c2.5.5 4 2.5 4 4.5 0 2.5-2.5 3.5-4 3.5-3 0-5-2-6-4 2.5 0 4.5-1.5 6-4z" opacity="0.7" />
                  </svg>
                </div>

                {/* Floating Lily Blossom 2 (Top Right) - Pure Floating Flower */}
                <div className="absolute -top-6 -right-5 z-20 pointer-events-none animate-float-reverse filter drop-shadow-[0_8px_16px_rgba(236,72,153,0.45)]">
                  <svg className="w-14 h-14 sm:w-16 sm:h-16 fill-rose-500 text-pink-200 transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24">
                    <path d="M12 3a4 4 0 0 0-4 4c0 3 2.5 5 4 7 1.5-2 4-4 4-7a4 4 0 0 0-4-4z" />
                    <path d="M7 9a4 4 0 0 0-4 4c0 3 3 5 6 6-1.5-2.5-1-5.5 1-7-1.5-1.5-2-2-3-3z" opacity="0.85" />
                    <path d="M17 9a4 4 0 0 1 4 4c0 3-3 5-6 6 1.5-2.5 1-5.5-1-7 1.5-1.5 2-2 3-3z" opacity="0.85" />
                  </svg>
                </div>

                {/* Floating Lily Petals 3 (Bottom Left) - Pure Floating Flower */}
                <div className="absolute -bottom-5 -left-5 z-20 pointer-events-none animate-float-reverse filter drop-shadow-[0_8px_16px_rgba(244,63,94,0.45)]">
                  <svg className="w-12 h-12 sm:w-14 sm:h-14 fill-pink-500 text-pink-300 transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24">
                    <path d="M12 2.5C9.5 5.5 7 8 7 11c0 2.8 2.2 5 5 5s5-2.2 5-5c0-3-2.5-5.5-5-8.5z" />
                    <path d="M5 11c-2 1-3.5 3-3.5 5 0 2.5 2 4 4 4 2.5 0 4.5-2 5.5-4-2.5 0-4.5-1.5-6-5z" opacity="0.75" />
                  </svg>
                </div>

                {/* Floating Water Lily Flower 4 (Bottom Right) - Pure Floating Flower */}
                <div className="absolute -bottom-6 -right-6 z-20 pointer-events-none animate-float-slow filter drop-shadow-[0_8px_16px_rgba(225,29,72,0.45)]">
                  <svg className="w-14 h-14 sm:w-16 sm:h-16 fill-rose-600 text-pink-300 transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24">
                    <path d="M12 2C9 5 6.5 8 6.5 11c0 3 2.5 5.5 5.5 5.5s5.5-2.5 5.5-5.5C17.5 8 15 5 12 2z" />
                    <path d="M5 11c-2 1-3.5 3-3.5 5 0 2.5 2 4 4 4 2.5 0 4.5-2 5.5-4-2.5 0-4.5-1.5-6-5z" opacity="0.8" />
                    <path d="M19 11c2 1 3.5 3 3.5 5 0 2.5-2 4-4 4-2.5 0-4.5-2-5.5-4 2.5 0 4.5-1.5 6-5z" opacity="0.8" />
                  </svg>
                </div>

              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 inline-block">
                ENHANCE ENGAGEMENT
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Engage your most valuable customers
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Reward regulars and stay visible between visits. Every stamp or reward updates the card in your customer's wallet — keeping your business top of mind.
              </p>

              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-bold text-slate-900">Data you can act on</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs mt-0.5 font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span>Capture customer details at enrolment to see who your most loyal customers are and how often they return.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs mt-0.5 font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span>Track cards, stamps, and rewards in real time to optimize offers and boost repeat visits.</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4: Dashboard Showcase (Complete Merchant Studio) */}
      <DashboardShowcase />

      {/* SECTION 5: Simple, Predictable 3-Tier Pricing */}
      <PricingSection />

      {/* SECTION 6: Final CTA Section */}
      <section className="py-20 hero-navy-bg text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Starting with First Loop is easy and fast
          </h2>
          <p className="text-lg text-slate-200 max-w-2xl mx-auto font-normal">
            It only takes a few clicks to choose your plan and launch your digital customer loyalty cards.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigateToSignup('growth', 'monthly')}
              className="px-9 py-4 rounded-full text-base font-bold text-white bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 shadow-xl shadow-teal-500/40 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Choose Plan & Get Started
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
