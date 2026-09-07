import React from 'react';
import { Sparkles } from 'lucide-react';
import cardImg from '../assets/card.png';

export const LoyaltyStampCard = ({ merchant }) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-4 font-sans">
      
      {/* High-Resolution Digital Stamp Card Design from card.png */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200 group transition-all duration-300 hover:scale-[1.02] hover:shadow-teal-900/20 bg-white">
        <img 
          src={cardImg} 
          alt="FirstPass Loyalty Stamp Card" 
          className="w-full h-auto object-cover rounded-3xl"
        />

        {/* Diagonal SAMPLE Watermark Overlay */}
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
          {/* Main Translucent Diagonal Watermark Ribbon */}
          <div className="transform -rotate-25 bg-slate-950/45 backdrop-blur-[2px] border-y-2 border-dashed border-white/60 py-2 sm:py-2.5 px-12 sm:px-20 shadow-2xl">
            <span className="text-base sm:text-xl font-black tracking-[0.3em] text-white uppercase select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              SAMPLE DESIGN
            </span>
          </div>
          
          {/* Repeating Background Sub-Watermark Pattern */}
          <div className="absolute inset-0 flex flex-col justify-between py-5 px-3 select-none opacity-30 transform -rotate-12 pointer-events-none font-mono text-[9px] font-black text-white uppercase tracking-widest">
            <div className="flex justify-between"><span>SAMPLE CARD</span><span>FIRST LOOP DEMO</span></div>
            <div className="flex justify-between px-6"><span>SAMPLE DESIGN</span><span>WATERMARK PREVIEW</span></div>
            <div className="flex justify-between"><span>FIRST LOOP DEMO</span><span>SAMPLE CARD</span></div>
          </div>
        </div>

        {/* Top Left Watermark Badge */}
        <div className="absolute top-3 left-3 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-300 shadow-md flex items-center gap-1 z-30">
          <Sparkles className="w-3 h-3 text-slate-950" />
          <span>Sample Watermark</span>
        </div>

        {/* Floating Interactive Badge */}
        <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-white/20 shadow-md flex items-center gap-1.5 z-30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>10-Stamp Pass</span>
        </div>
      </div>

    </div>
  );
};

