import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import mainLogo from '../assets/mainlogo.png';

export const Footer = () => {
  const navigate = useNavigate();
  const { setActiveTab, navigateToLegal, navigateToSignup } = useApp();

  return (
    <footer className="border-t border-teal-600/30 pt-16 pb-12 transition-colors duration-300" style={{ backgroundColor: '#14b8a6' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Logo Only Section */}
          <div className="md:col-span-1 space-y-4">
            <div 
              className="cursor-pointer inline-block"
              onClick={() => setActiveTab('home')}
            >
              <img 
                src={mainLogo} 
                alt="First Loop Logo" 
                className="h-12 sm:h-14 w-auto object-contain hover:scale-105 transition-transform drop-shadow-sm" 
              />
              <div className="flex items-center text-lg sm:text-xl font-black tracking-tight mt-1">
                <span className="text-slate-950">First</span>
                <span className="text-white">Loop</span>
              </div>
            </div>
            <p className="text-xs text-teal-950 font-medium leading-relaxed">
              Create and manage digital stamp cards in Apple Wallet & Google Wallet.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-950">Product</h4>
            <ul className="space-y-2 text-xs font-semibold text-teal-950/85">
              <li><a href="#features" onClick={() => setActiveTab('home')} className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" onClick={() => setActiveTab('home')} className="hover:text-white transition-colors">Pricing Plans</a></li>
              <li><a href="#dashboard-showcase" onClick={() => setActiveTab('home')} className="hover:text-white transition-colors">Dashboard Showcase</a></li>
              <li><button onClick={() => navigateToSignup('growth', 'monthly')} className="hover:text-white transition-colors text-left cursor-pointer">Plans</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-950">Legal</h4>
            <ul className="space-y-2 text-xs font-semibold text-teal-950/85">
              <li>
                <button 
                  onClick={() => navigateToLegal('terms')} 
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Terms of Use
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateToLegal('privacy')} 
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-950">Connect</h4>
            <ul className="space-y-2 text-xs font-semibold text-teal-950/85">
              <li className="font-mono text-xs text-slate-950 font-bold">alex@firstloop.com</li>
            </ul>

            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-teal-700/50 flex items-center justify-center text-white hover:bg-slate-950 hover:text-white transition-all shadow-sm" aria-label="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-teal-700/50 flex items-center justify-center text-white hover:bg-slate-950 hover:text-white transition-all shadow-sm" aria-label="Instagram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-teal-600/30 flex flex-col sm:flex-row items-center justify-between text-xs text-teal-950/80 gap-4 font-semibold">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>© 2026 First Loop. All rights reserved.</span>
            <span className="hidden sm:inline text-teal-800">•</span>
            <button 
              onClick={() => navigateToLegal('terms')} 
              className="text-teal-950 hover:text-white transition-colors cursor-pointer"
            >
              Terms of Use
            </button>
            <span className="text-teal-800">•</span>
            <button 
              onClick={() => navigateToLegal('privacy')} 
              className="text-teal-950 hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-teal-800">•</span>
            <button 
              onClick={() => navigate('/panel/merchant/login')}
              className="text-slate-950 hover:text-white transition-colors cursor-pointer font-extrabold"
            >
              Merchant Login
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
