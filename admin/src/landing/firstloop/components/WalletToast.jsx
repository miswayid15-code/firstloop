import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, X, Sparkles, Smartphone } from 'lucide-react';

export const WalletToast = () => {
  const { toast, setToast } = useApp();

  if (!toast.visible) return null;

  const isApple = toast.type === 'apple';

  return (
    <div className="fixed top-6 right-6 z-50 max-w-md w-full bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-start gap-3 animate-in slide-in-from-top-5 duration-300">
      
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        isApple ? 'bg-zinc-800 text-white' : 'bg-blue-600 text-white'
      }`}>
        <Smartphone className="w-5 h-5" />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold flex items-center gap-1.5">
            <span>{toast.title}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </h4>
          <button
            onClick={() => setToast(t => ({ ...t, visible: false }))}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {toast.message}
        </p>

        <div className="pt-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Interactive Pass Simulator Active</span>
        </div>
      </div>

    </div>
  );
};
