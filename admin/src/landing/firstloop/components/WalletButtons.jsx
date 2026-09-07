import React from 'react';
import { useApp } from '../context/AppContext';

export const WalletButtons = () => {
  const { triggerWalletToast } = useApp();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
      
      {/* Apple Wallet Badge */}
      <button
        onClick={() => triggerWalletToast('apple')}
        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-black hover:bg-zinc-900 text-white font-sans shadow-lg border border-zinc-800 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 group"
      >
        <div className="w-7 h-7 flex items-center justify-center">
          <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.61.71-1.14 1.86-1 2.97 1.08.08 2.15-.57 2.81-1.37z" />
          </svg>
        </div>
        <div className="text-left">
          <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider leading-none">
            Add to
          </div>
          <div className="text-sm font-bold text-white leading-tight">
            Apple Wallet
          </div>
        </div>
      </button>

      {/* Google Wallet Badge */}
      <button
        onClick={() => triggerWalletToast('google')}
        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-zinc-950 hover:bg-black text-white font-sans shadow-lg border border-zinc-800 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 group"
      >
        <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
          <span className="text-lg font-black bg-gradient-to-r from-blue-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">G</span>
        </div>
        <div className="text-left">
          <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider leading-none">
            Add to
          </div>
          <div className="text-sm font-bold text-white leading-tight">
            Google Wallet
          </div>
        </div>
      </button>

    </div>
  );
};
