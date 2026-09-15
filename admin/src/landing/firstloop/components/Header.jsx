import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Menu, X, User, LogIn } from 'lucide-react';
import mainLogo from '../assets/mainlogo.png';

export const Header = () => {
  const navigate = useNavigate();
  const { navigateToSignup, currentUser, activeTab, setActiveTab } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (hash) => {
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none flex justify-center pt-3 sm:pt-4 px-3 sm:px-6 lg:px-8 w-full">
      <div className="max-w-7xl w-full pointer-events-auto">
        
        {/* Floating Milky Glass Capsule Header */}
        <div className="bg-white/80 backdrop-blur-2xl border border-white/70 shadow-2xl shadow-slate-950/15 rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-4 transition-all duration-300">
          
          {/* Left: Brand Logo using mainlogo.png & "First Loop" name */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            onClick={() => setActiveTab('home')}
          >
            <img 
              src={mainLogo} 
              alt="First Loop Logo" 
              className="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
            <div className="flex items-center text-lg sm:text-xl font-black tracking-tight">
              <span className="text-slate-950">First</span>
              <span className="text-teal-600">Loop</span>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-bold text-slate-800">
            <button 
              onClick={() => setActiveTab('home')}
              className={`hover:text-teal-600 transition-colors cursor-pointer ${activeTab === 'home' ? 'text-teal-700 font-extrabold' : ''}`}
            >
              Home
            </button>
            <a 
              href="#features" 
              onClick={() => handleNavClick('#features')}
              className="hover:text-teal-600 transition-colors"
            >
              Features
            </a>
            <a 
              href="#pricing" 
              onClick={() => handleNavClick('#pricing')}
              className="hover:text-teal-600 transition-colors"
            >
              Pricing
            </a>
            <a 
              href="#dashboard-showcase" 
              onClick={() => handleNavClick('#dashboard-showcase')}
              className="hover:text-teal-600 transition-colors"
            >
              Dashboard
            </a>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-teal-600 transition-colors cursor-pointer ${activeTab === 'dashboard' ? 'text-teal-700 font-extrabold' : ''}`}
            >
              Plans
            </button>
          </nav>

          {/* Right: Log In & Get Started CTA / User Profile */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {currentUser ? (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2.5 pl-3.5 pr-2 py-1.5 rounded-full bg-slate-900/10 hover:bg-slate-900/20 border border-slate-900/15 text-xs font-bold text-slate-900 transition-all cursor-pointer group shadow-sm"
                title="View Sample Card Designs"
              >
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-black text-slate-900 text-[11px] truncate max-w-[120px]">
                    {currentUser.fullName || currentUser.storeName}
                  </span>
                  <span className="text-[9px] font-extrabold text-teal-700 uppercase tracking-wider group-hover:text-teal-900 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                    <span>Sample Cards</span>
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-600 to-sky-600 text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                  <User className="w-4 h-4" />
                </div>
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/panel/merchant/login')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-slate-700 hover:text-teal-700 hover:bg-slate-100 transition-all cursor-pointer border border-slate-200/80"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => navigateToSignup('growth', 'monthly')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 shadow-md shadow-teal-600/30 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <span>Get Started</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => navigate('/merchant/login')}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => navigateToSignup('growth', 'monthly')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-teal-600 shadow-sm cursor-pointer"
            >
              Sign Up
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/90 backdrop-blur-2xl border border-white/70 rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-top-3 duration-200">
            <button
              onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-sm font-bold text-slate-800 hover:text-teal-600"
            >
              Home
            </button>
            <a
              href="#features"
              onClick={() => { handleNavClick('#features'); setMobileMenuOpen(false); }}
              className="block py-2 text-sm font-bold text-slate-800 hover:text-teal-600"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={() => { handleNavClick('#pricing'); setMobileMenuOpen(false); }}
              className="block py-2 text-sm font-bold text-slate-800 hover:text-teal-600"
            >
              Pricing
            </a>
            <a
              href="#dashboard-showcase"
              onClick={() => { handleNavClick('#dashboard-showcase'); setMobileMenuOpen(false); }}
              className="block py-2 text-sm font-bold text-slate-800 hover:text-teal-600"
            >
              Dashboard
            </a>
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-sm font-bold text-slate-800 hover:text-teal-600 cursor-pointer"
            >
              Plans
            </button>
            <div className="pt-2 border-t border-slate-200/60 space-y-2">
              <button
                onClick={() => { navigate('/merchant/login'); setMobileMenuOpen(false); }}
                className="w-full text-center py-2.5 rounded-full text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-teal-600" />
                <span>Merchant Login</span>
              </button>
              <button
                onClick={() => { navigateToSignup('growth', 'monthly'); setMobileMenuOpen(false); }}
                className="w-full text-center py-3 rounded-full text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-sky-600 shadow-md cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
