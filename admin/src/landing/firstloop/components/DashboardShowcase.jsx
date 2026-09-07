import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  Palette, 
  Store, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import das1 from '../assets/das1.png';
import das2 from '../assets/das2.png';
import das3 from '../assets/das3.png';

export const DashboardShowcase = () => {
  const { setActiveTab } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const sectionRef = useRef(null);

  const dashboards = [
    {
      id: 0,
      title: "Live Merchant Overview & Analytics",
      tag: "Real-Time Operations",
      icon: BarChart3,
      description: "Monitor real-time customer footfall, active digital stamp cards, membership activity, and today's check-in stream across all your branches.",
      features: [
        "Live customer check-in & redemption tracking",
        "Active stamp cards & membership tier counts",
        "Multi-branch performance dashboard"
      ],
      image: das1,
      alt: "FirstLoop Merchant Overview Dashboard",
      color: "from-teal-500 to-sky-500",
      accent: "text-teal-600 bg-teal-50 border-teal-200"
    },
    {
      id: 1,
      title: "Loyalty Card List & Builder Studio",
      tag: "Card Studio",
      icon: Palette,
      description: "Design and customize your digital stamp passes and VIP membership tiers. Configure reward milestones, discounts, and brand styling with instant wallet sync.",
      features: [
        "Visual 10-stamp loyalty card builder",
        "Custom milestone rewards (10%, 50%, Free Gifts)",
        "Instant QR code generation for counter scanning"
      ],
      image: das2,
      alt: "FirstLoop Loyalty Card List & Studio",
      color: "from-sky-500 to-blue-600",
      accent: "text-sky-600 bg-sky-50 border-sky-200"
    },
    {
      id: 2,
      title: "Merchant Branch Locations & Staff",
      tag: "Multi-Outlet Scaling",
      icon: Store,
      description: "Manage multiple retail outlets, assign receptionist phone numbers, and control direct branch studio access effortlessly with zero hardware requirements.",
      features: [
        "Multi-outlet location directory with address details",
        "Assigned receptionist & staff phone logins",
        "One-click branch studio access & status controls"
      ],
      image: das3,
      alt: "FirstLoop Merchant Branch Locations Management",
      color: "from-purple-500 to-indigo-600",
      accent: "text-purple-600 bg-purple-50 border-purple-200"
    }
  ];

  // Auto cycle cards gently if not interacted
  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % dashboards.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlay, dashboards.length]);

  // Handle scroll trigger into view to gently advance
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress through the section (0 to 1)
      const start = rect.top;
      const totalHeight = rect.height;
      if (start < windowHeight * 0.7 && start > -totalHeight * 0.5) {
        // In viewport
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNext = () => {
    setIsAutoPlay(false);
    setActiveIndex((prev) => (prev + 1) % dashboards.length);
  };

  const handlePrev = () => {
    setIsAutoPlay(false);
    setActiveIndex((prev) => (prev - 1 + dashboards.length) % dashboards.length);
  };

  const handleSelect = (idx) => {
    setIsAutoPlay(false);
    setActiveIndex(idx);
  };

  return (
    <section 
      id="dashboard-showcase" 
      ref={sectionRef}
      className="py-24 bg-slate-900 text-white relative overflow-hidden border-t border-b border-slate-800"
    >
      {/* Ambient background lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-sky-500/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/90 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider shadow-inner">
            <Store className="w-3.5 h-3.5 text-teal-400" />
            <span>Complete Merchant Studio</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            One powerful dashboard to manage your entire loyalty program
          </h2>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            From single boutique stores to multi-outlet chains — track visits, customize cards, and empower your staff seamlessly.
          </p>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-14">
          {dashboards.map((dash, idx) => {
            const Icon = dash.icon;
            const isActive = activeIndex === idx;

            return (
              <button
                key={dash.id}
                onClick={() => handleSelect(idx)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white border-teal-400/50 shadow-lg shadow-teal-500/20 scale-105'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{dash.tag}</span>
              </button>
            );
          })}
        </div>

        {/* 3D Wallet Stacking Showcase Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side: Active Dashboard Details */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-500/10 border border-teal-400/20 text-teal-300 text-xs font-bold">
                <span>View {activeIndex + 1} of 3</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {dashboards[activeIndex].title}
              </h3>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {dashboards[activeIndex].description}
              </p>
            </div>

            {/* Key Feature Bullets */}
            <div className="space-y-3 pt-2">
              {dashboards[activeIndex].features.map((feat, fIdx) => (
                <div key={fIdx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">{feat}</span>
                </div>
              ))}
            </div>

            {/* Navigation Controls */}
            <div className="pt-6 flex items-center gap-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  aria-label="Previous dashboard"
                  className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next dashboard"
                  className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>

          {/* Right Side: 3D Apple Wallet Style Stacking Deck */}
          <div className="lg:col-span-7 flex justify-center items-center py-6">
            
            <div 
              className="relative w-full max-w-2xl h-[340px] sm:h-[420px] lg:h-[460px] flex items-center justify-center"
              style={{ perspective: '1200px' }}
            >
              
              {dashboards.map((dash, idx) => {
                // Calculate position relative to active card in the wallet stack
                // diff: 0 = active in front
                // diff: 1 = card 1 step behind in wallet pocket
                // diff: 2 = card 2 steps behind
                const total = dashboards.length;
                const diff = (idx - activeIndex + total) % total;

                // 3D Wallet card transform calculations:
                // Front card: translateY = 0, scale = 1, zIndex = 30, opacity = 1
                // 1st Back card: translateY = -35px, scale = 0.92, zIndex = 20, opacity = 0.8
                // 2nd Back card: translateY = -70px, scale = 0.84, zIndex = 10, opacity = 0.55
                let translateY = 0;
                let scale = 1;
                let zIndex = 30;
                let opacity = 1;
                let brightness = 1;

                if (diff === 0) {
                  translateY = 0;
                  scale = 1;
                  zIndex = 30;
                  opacity = 1;
                  brightness = 1;
                } else if (diff === 1) {
                  translateY = -35;
                  scale = 0.93;
                  zIndex = 20;
                  opacity = 0.75;
                  brightness = 0.88;
                } else if (diff === 2) {
                  translateY = -68;
                  scale = 0.86;
                  zIndex = 10;
                  opacity = 0.5;
                  brightness = 0.75;
                }

                return (
                  <div
                    key={dash.id}
                    onClick={() => handleSelect(idx)}
                    className="absolute top-12 left-0 right-0 mx-auto w-full max-w-xl cursor-pointer transition-all duration-700 ease-out origin-top"
                    style={{
                      transform: `translateY(${translateY}px) scale(${scale})`,
                      zIndex,
                      opacity,
                      filter: `brightness(${brightness})`,
                      transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease, filter 0.7s ease'
                    }}
                  >
                    {/* Browser / Wallet Frame Card */}
                    <div className="bg-slate-950 rounded-2xl sm:rounded-3xl border-2 border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden group hover:border-teal-500/60 transition-colors">
                      
                      {/* Top Window Bar */}
                      <div className="bg-slate-900/95 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                        </div>

                        <div className="px-3 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                          <span>admin.firstloop.co.in</span>
                        </div>

                        <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                          {dash.tag}
                        </div>
                      </div>

                      {/* Main Dashboard Screen Image */}
                      <div className="relative bg-slate-900 aspect-[16/9] overflow-hidden">
                        <img 
                          src={dash.image} 
                          alt={dash.alt}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                        />

                        {/* Subtle Glassmorphic Overlay Gradient on unselected cards */}
                        {diff !== 0 && (
                          <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] hover:bg-slate-950/10 transition-colors flex items-center justify-center">
                            <span className="px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold border border-slate-700 shadow-lg">
                              Click to bring forward
                            </span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
