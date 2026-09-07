import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle2, ArrowRight, TrendingUp, TrendingDown, Edit2, Minus, Plus
} from 'lucide-react';
import cardImg from '../assets/card.png';

export const Hero = () => {
  const { navigateToSignup, triggerWalletToast, setActiveTab, openMerchantModal, merchants } = useApp();

  const sampleMerchant = merchants[0];

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20 lg:pb-24 border-b border-slate-800/80">
      
      {/* Deep Rich Gradient Glows behind text */}
      <div className="absolute -top-12 left-1/4 w-96 h-96 bg-teal-600/25 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content - 100% Crisp Visible Text */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-teal-500/40 text-xs font-bold text-teal-300 shadow-md">
              <span>Next-Gen Customer Retention Platform</span>
            </div>

            {/* Main Headline - Crystal Clear Text Contrast */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
              Digital stamp cards for <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-300 to-cyan-200">
                Apple & Google Wallet
              </span>
            </h1>

            {/* Subtitle - Sharp Visible Contrast */}
            <p className="text-slate-300 text-base sm:text-lg lg:text-xl font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Create and manage digital stamp cards in mobile wallets. Reward repeat visits, capture data, and message customers  <strong className="text-white font-semibold underline decoration-teal-400 decoration-2 underline-offset-4"></strong>.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => navigateToSignup('growth', 'monthly')}
                className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold text-white bg-gradient-to-r from-teal-500 via-teal-600 to-sky-600 hover:from-teal-600 hover:to-sky-700 shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3 group cursor-pointer"
              >
                <span>Choose Plan</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

          {/* Right Visual Representation - Animated Smartphone Mockup */}
          <div className="lg:col-span-6 relative flex justify-center mt-6 lg:mt-0">
            
            <div className="relative w-full max-w-xs sm:max-w-sm">
              
              {/* Floating Widget 1: Rewards Redeemed (Top Left) with Animation */}
              <div className="absolute -top-6 -left-4 sm:-left-10 z-30 bg-white/95 backdrop-blur-xl text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-200/90 animate-float-slow hidden sm:block">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rewards Redeemed</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">193</span>
                  <span className="inline-flex items-center text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                    <TrendingDown className="w-3 h-3 mr-0.5" /> 19.74%
                  </span>
                </div>
                <div className="w-32 h-1.5 bg-teal-100 rounded-full mt-2.5 overflow-hidden">
                  <div className="w-3/4 h-full bg-teal-600 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Official Apple Wallet Badge Button (Mid Left) */}
              <button 
                onClick={() => triggerWalletToast('apple')}
                className="absolute top-1/3 -left-6 sm:-left-16 z-40 bg-black hover:bg-zinc-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.61.71-1.14 1.86-1 2.97 1.08.08 2.15-.57 2.81-1.37z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold leading-none">Add to</div>
                  <div className="text-xs font-extrabold text-white leading-tight">Apple Wallet</div>
                </div>
              </button>

              {/* Official Google Wallet Badge Button (Mid Right) */}
              <button 
                onClick={() => triggerWalletToast('google')}
                className="absolute top-1/3 -right-6 sm:-right-16 z-40 bg-zinc-950 hover:bg-black text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
              >
                <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-base font-black bg-gradient-to-r from-blue-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">G</span>
                </div>
                <div className="text-left">
                  <div className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold leading-none">Add to</div>
                  <div className="text-xs font-extrabold text-white leading-tight">Google Wallet</div>
                </div>
              </button>

              {/* Smartphone Frame with Animated Screen Content */}
              <div className="relative rounded-[42px] bg-slate-950 p-3.5 shadow-2xl border-4 border-slate-800">
                
                {/* Notch */}
                <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-800"></div>
                </div>

                {/* Animated Smartphone Screen Content */}
                <div className="bg-slate-900 text-slate-100 rounded-[28px] p-4 space-y-4 overflow-hidden border border-slate-800 shadow-inner">
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-semibold text-slate-400">&lt; Back</span>
                    <span className="font-bold text-white">Card Details</span>
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  {/* Stamp Card Image */}
                  <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-700/60 group transition-transform hover:scale-[1.02] duration-300">
                    <img 
                      src={cardImg} 
                      alt="Digital Stamp Card" 
                      className="w-full h-auto object-cover rounded-xl"
                    />
                  </div>

                  {/* Customer details fields */}
                  <div className="space-y-1.5 text-xs font-medium">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">First Name:</span>
                      <span className="font-semibold text-slate-200">Laura</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Last Name:</span>
                      <span className="font-semibold text-slate-200">Loopy</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Company:</span>
                      <span className="font-semibold text-slate-200">Loopy loyalty</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Lifetime Stamps:</span>
                      <span className="font-bold text-teal-400">18</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400">Rewards Available:</span>
                      <span className="font-bold text-emerald-400">1</span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-0.5">
                      <span className="text-slate-400">Last Visit:</span>
                      <span className="text-slate-300">26/01/2026, 03:24</span>
                    </div>
                  </div>

                  {/* Stamp Action Controls inside Phone */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span>Add 2 Stamps</span>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center font-bold text-white text-xs cursor-pointer hover:bg-rose-500">
                          <Minus className="w-3 h-3" />
                        </span>
                        <span className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs cursor-pointer hover:bg-emerald-500">
                          <Plus className="w-3 h-3" />
                        </span>
                      </div>
                    </div>

                    {/* <button
                      onClick={() => openMerchantModal(sampleMerchant, 'loyalty')}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      View Live Card Details
                    </button> */}
                  </div>

                </div>
              </div>

              {/* Floating Widget 2: Stamps Given (Bottom Left) with Animation */}
              <div className="absolute -bottom-6 -left-6 z-30 bg-white/95 backdrop-blur-xl text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-200/90 animate-float-reverse hidden sm:block">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stamps Given</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">1,254</span>
                  <span className="inline-flex items-center text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3 mr-0.5" /> 102.48%
                  </span>
                </div>
              </div>

              {/* Floating Widget 3: Weekly Customers (Bottom Right) with Animated Bars */}
              <div className="absolute -bottom-10 -right-6 z-30 bg-white/95 backdrop-blur-xl text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-200/90 hidden sm:block">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Weekly Customers</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">8,074</div>
                <div className="flex items-end gap-1.5 h-8 mt-2 pt-1">
                  <div className="w-3 bg-teal-300 h-full rounded-t-sm animate-pulse"></div>
                  <div className="w-3 bg-teal-400 h-4/5 rounded-t-sm"></div>
                  <div className="w-3 bg-teal-500 h-3/5 rounded-t-sm"></div>
                  <div className="w-3 bg-teal-600 h-full rounded-t-sm"></div>
                  <div className="w-3 bg-sky-500 h-2/3 rounded-t-sm"></div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
