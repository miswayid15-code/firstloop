import React, { useEffect, useState } from 'react';
import mainLogo from '../assets/mainlogo.png';

export const Preloader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Fast, modern, silky load time (~1.1s total)
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setIsLoading(false), 450);
    }, 1050);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-white flex items-center justify-center transition-all duration-500 ease-out ${
        fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Soft Ambient Pastel Glow */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-teal-400/10 via-sky-400/10 to-teal-500/10 blur-[90px] pointer-events-none animate-pulse"></div>

      {/* Center Logo Presentation - Pure Floating Logo (No Box) */}
      <div className="relative flex items-center justify-center">
        
        {/* Outer Circular Halo & Orbital Spinner */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
          
          {/* Subtle Outer Pulse Ripple Wave */}
          <div 
            className="absolute inset-0 rounded-full border border-teal-500/20 animate-ping"
            style={{ animationDuration: '2.2s' }}
          />

          {/* Thin Modern Conic Gradient Spinner Ring */}
          <div 
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              animationDuration: '2.2s',
              background: 'conic-gradient(from 0deg, transparent 0 240deg, #0d9488 310deg, #0ea5e9 360deg)',
              padding: '2px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude'
            }}
          />

          {/* Orbiting Glowing Neon Satellite Bead */}
          <div 
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: '2.2s' }}
          >
            <div className="w-2 h-2 rounded-full bg-teal-600 shadow-[0_0_8px_rgba(13,148,136,0.8)] absolute -top-0.5 left-1/2 -translate-x-1/2" />
          </div>

          {/* Pure Center Logo (No Box Container) */}
          <div className="relative z-10 flex items-center justify-center">
            <img 
              src={mainLogo} 
              alt="First Loop Logo" 
              className="h-14 sm:h-16 w-auto object-contain animate-pulse drop-shadow-sm select-none"
              style={{ animationDuration: '1.8s' }}
            />
          </div>

        </div>

      </div>

    </div>
  );
};
