
import React, { useEffect, useState } from 'react';
import { fetchDailyVerse } from '../services/geminiService';
import { QuranVerse } from '../types';
import { Quote } from 'lucide-react';

const MotivationalSection: React.FC = () => {
  const [verse, setVerse] = useState<QuranVerse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVerse = async () => {
      const data = await fetchDailyVerse();
      setVerse(data);
      setLoading(false);
    };
    loadVerse();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-32 flex items-center justify-center animate-pulse glass rounded-2xl border-emerald-500/20">
        <p className="text-amber-400 font-medium">Loading wisdom...</p>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-2xl border-l-4 border-l-amber-500 shadow-xl mb-8 group transition-all duration-300 hover:bg-emerald-900/40">
      <div className="flex items-start gap-4">
        <Quote className="text-amber-400 shrink-0 mt-1" size={32} />
        <div className="space-y-4 w-full text-center sm:text-left">
          <p className="font-arabic text-3xl text-amber-100 leading-relaxed mb-4 tracking-wide" dir="rtl">
            {verse?.arabic}
          </p>
          <div className="space-y-2">
            <p className="text-emerald-50 text-lg leading-snug italic font-medium">
              "{verse?.bengali}"
            </p>
            <p className="text-emerald-200/70 text-sm italic">
              "{verse?.english}"
            </p>
          </div>
          <p className="text-amber-400/80 text-xs font-bold tracking-widest uppercase">
            — {verse?.reference}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MotivationalSection;
