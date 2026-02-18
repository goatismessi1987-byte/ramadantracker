
import React from 'react';
import { Moon, ShieldCheck } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="py-12 px-4 relative overflow-hidden flex flex-col items-center text-center">
      {/* Decorative Moon */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-10 pointer-events-none">
        <Moon size={300} className="text-amber-400 rotate-12" fill="currentColor" />
      </div>

      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
        <ShieldCheck size={16} />
        Ramadan Habit Tracker
      </div>
      
      <h1 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-sm font-serif">
        Ramadan Mubarak
      </h1>

      <div className="max-w-3xl glass p-8 rounded-3xl border-2 border-amber-500/30 shadow-[0_0_50px_-12px_rgba(251,191,36,0.25)] relative group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-2xl md:text-3xl font-bold text-amber-100 leading-relaxed font-['Noto_Serif_Bengali']">
          “নিশ্চয়ই আল্লাহ সবকিছু দেখছেন, তাই আমি সত্য তথ্যে নিজের আমলনামা পূর্ণ করবো।”
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="h-px w-12 bg-amber-500/50" />
          <span className="text-amber-500/70 text-sm font-arabic italic">Allahu Akbar</span>
          <div className="h-px w-12 bg-amber-500/50" />
        </div>
      </div>
    </header>
  );
};

export default Header;
