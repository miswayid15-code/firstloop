import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LoyaltyStampCard } from './LoyaltyStampCard';
import { MembershipCard } from './MembershipCard';
import { WalletButtons } from './WalletButtons';
import { IconRenderer } from './IconRenderer';
import { X, Store, Coffee, Crown } from 'lucide-react';

export const MerchantModal = () => {
  const { 
    isMerchantModalOpen, closeMerchantModal, selectedMerchant, 
    activeCardType, setActiveCardType 
  } = useApp();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeMerchantModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeMerchantModal]);

  if (!isMerchantModalOpen || !selectedMerchant) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeMerchantModal();
      }}
    >
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-purple-100 my-auto animate-in zoom-in-95 duration-200 scrollbar-none">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-5 sm:p-8 text-white relative sticky top-0 z-10 shadow-md border-b border-teal-800/40">
          <button
            onClick={closeMerchantModal}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4 pr-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shadow-md shrink-0">
              <IconRenderer name={selectedMerchant.logo} className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-[10px] sm:text-[11px] font-bold text-teal-300 border border-teal-500/30 mb-0.5 sm:mb-1">
                <Store className="w-3 h-3 text-teal-400" />
                <span>{selectedMerchant.category}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                {selectedMerchant.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
          
          {/* Sample Watermark Banner */}
          <div className="bg-amber-50/90 rounded-2xl p-3 border border-amber-200/90 text-amber-950 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
              <span className="font-extrabold text-amber-900">Sample Card Design (Watermark Preview)</span>
            </div>
            <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
              Sample Pass
            </span>
          </div>

          {/* Card Type Segmented Control Tab */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center justify-between border border-slate-200 gap-1">
            <button
              onClick={() => setActiveCardType('loyalty')}
              className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                activeCardType === 'loyalty'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span>Sample Loyalty Card</span>
            </button>

            <button
              onClick={() => setActiveCardType('membership')}
              className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                activeCardType === 'membership'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
              <span>Sample VIP Pass</span>
            </button>
          </div>

          {/* Card Visual Display */}
          <div className="py-1 sm:py-2">
            {activeCardType === 'loyalty' ? (
              <LoyaltyStampCard merchant={selectedMerchant} />
            ) : (
              <MembershipCard merchant={selectedMerchant} />
            )}
          </div>

          {/* Add to Mobile Wallet Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="text-center">
              <h4 className="text-sm font-bold text-slate-900">Add Pass to Mobile Wallet</h4>
              <p className="text-xs text-slate-500">Save to your smartphone to collect stamps and receive push updates</p>
            </div>

            <WalletButtons />
          </div>

        </div>

      </div>
    </div>
  );
};
