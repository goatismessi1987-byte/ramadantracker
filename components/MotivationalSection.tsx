
import React, { useEffect, useState } from 'react';
import { fetchDailyVerse, getRandomStaticVerse } from '../services/geminiService';
import { QuranVerse } from '../types';
import { Quote, Sparkles } from 'lucide-react';

const MotivationalSection: React.FC = () => {
  // Start with a random static verse for instant loading
  const [verse, setVerse] = useState<QuranVerse>(getRandomStaticVerse());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadFreshVerse = async () => {
      setIsRefreshing(true);
      const data = await fetchDailyVerse();
      if (data) setVerse(data);
      setIsRefreshing(false);
    };
    loadFreshVerse();
  }, []);

  return (
    <div className="glass p-6 rounded-2xl border-l-4 border-l-amber-500 shadow-xl mb-8 group transition-all duration-300 hover:bg-emerald-900/40 relative overflow-hidden">
      {isRefreshing && (
        <div className="absolute top-2 right-2 animate-pulse text-amber-500/20">
          <Sparkles size={14} />
        </div>
      )}
      <div className="flex items-start gap-4">
        <Quote className="text-amber-400 shrink-0 mt-1 opacity-50 group-hover:opacity-100 transition-opacity" size={32} />
        <div className="space-y-4 w-full text-center sm:text-left">
          <p className="font-arabic text-3xl text-amber-100 leading-relaxed mb-4 tracking-wide drop-shadow-md" dir="rtl">
            {verse?.arabic}
          </p>
          <div className="space-y-2">
            <p className="text-emerald-50 text-lg leading-snug italic font-medium font-['Noto_Serif_Bengali']">
              "{verse?.bengali}"
            </p>
            <p className="text-emerald-200/70 text-sm italic">
              "{verse?.english}"
            </p>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <div className="h-px w-8 bg-amber-500/30" />
            <p className="text-amber-400/80 text-[10px] font-bold tracking-[0.2em] uppercase">
              {verse?.reference}
            </p>
            <div className="h-px w-8 bg-amber-500/30" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotivationalSection;
