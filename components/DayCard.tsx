
import React from 'react';
import { DayRecord, SalahRecord } from '../types';
import { Check, BookOpen, Sun, Moon, Zap, Plus, Minus } from 'lucide-react';

interface DayCardProps {
  record: DayRecord;
  onUpdate: (updated: DayRecord) => void;
  readOnly?: boolean;
}

const DayCard: React.FC<DayCardProps> = ({ record, onUpdate, readOnly = false }) => {
  const toggleSalah = (salah: keyof SalahRecord) => {
    if (readOnly) return;
    onUpdate({
      ...record,
      salah: { ...record.salah, [salah]: !record.salah[salah] }
    });
  };

  const toggleFasting = () => {
    if (readOnly) return;
    onUpdate({ ...record, fasting: !record.fasting });
  };

  const handlePagesChange = (val: number) => {
    if (readOnly) return;
    const newPages = Math.max(0, val);
    onUpdate({ ...record, quranPages: newPages });
  };

  const salahList: { key: keyof SalahRecord; label: string }[] = [
    { key: 'fajr', label: 'F' },
    { key: 'dhuhr', label: 'D' },
    { key: 'asr', label: 'A' },
    { key: 'maghrib', label: 'M' },
    { key: 'isha', label: 'I' },
  ];

  /**
   * New Progress Logic:
   * Fasting: 40%
   * Salah: 40% (8% per prayer)
   * Quran: 20% (1% per page, capped at 20 pages)
   * Total: 100%
   */
  const prayersDone = Object.values(record.salah).filter(v => v).length;
  const quranWeight = Math.min(record.quranPages, 20); // Max 20% for 20 pages
  const progress = Math.min(100, (record.fasting ? 40 : 0) + (prayersDone * 8) + quranWeight);

  return (
    <div className={`glass p-5 rounded-2xl border transition-all duration-500 relative overflow-hidden group ${record.fasting ? 'border-amber-500/40' : 'border-emerald-800/40'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <span className="text-2xl font-black text-amber-400">Day {record.day}</span>
          <span className="text-[10px] text-emerald-300/60 uppercase tracking-widest">{record.date}</span>
        </div>
        <div className="flex flex-col items-end">
          <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${progress >= 100 ? 'bg-amber-500 text-emerald-950' : 'bg-emerald-900 text-emerald-400'}`}>
            {Math.floor(progress)}% COMPLETE
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-emerald-950 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-4">
        {/* Fasting Toggle */}
        <button
          onClick={toggleFasting}
          disabled={readOnly}
          className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
            record.fasting 
              ? 'bg-amber-500 text-emerald-950 font-bold shadow-lg shadow-amber-500/20' 
              : 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800 border border-emerald-800/50'
          }`}
        >
          <Sun size={18} className={record.fasting ? 'animate-spin-slow' : ''} />
          {record.fasting ? 'Fasting Today' : 'Mark Fasting'}
        </button>

        {/* Salah Tracking */}
        <div className="grid grid-cols-5 gap-2">
          {salahList.map((s) => (
            <button
              key={s.key}
              onClick={() => toggleSalah(s.key)}
              disabled={readOnly}
              className={`flex flex-col items-center justify-center h-14 rounded-xl transition-all active:scale-90 ${
                record.salah[s.key]
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-transparent'
                  : 'bg-emerald-950/50 text-emerald-600 border border-emerald-800/50'
              }`}
            >
              <span className="text-[9px] font-black mb-1">{s.label}</span>
              {record.salah[s.key] ? <Check size={16} strokeWidth={4} /> : <div className="w-1.5 h-1.5 rounded-full bg-emerald-800" />}
            </button>
          ))}
        </div>

        {/* Quran Input Shape */}
        <div className="bg-emerald-950/50 p-4 rounded-2xl border border-emerald-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <BookOpen size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-emerald-500 uppercase font-black tracking-widest leading-none">Quran</span>
              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter">Goal: 20 pgs</span>
            </div>
          </div>
          
          {readOnly ? (
            <div className="bg-emerald-900/40 px-4 py-2 rounded-xl text-amber-400 font-black text-xl">
              {record.quranPages}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handlePagesChange(record.quranPages - 1)}
                className="w-8 h-8 rounded-lg bg-emerald-900/50 flex items-center justify-center text-emerald-400 hover:bg-emerald-800 transition-colors"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <div className="w-14 h-14 rounded-xl bg-emerald-900 flex items-center justify-center border-2 border-emerald-800/50 relative">
                <input
                  type="number"
                  value={record.quranPages === 0 ? '' : record.quranPages}
                  onChange={(e) => handlePagesChange(parseInt(e.target.value) || 0)}
                  className="bg-transparent border-none focus:ring-0 text-amber-400 w-full text-center font-black text-xl p-0"
                  placeholder="0"
                />
              </div>
              <button 
                onClick={() => handlePagesChange(record.quranPages + 1)}
                className="w-8 h-8 rounded-lg bg-emerald-900/50 flex items-center justify-center text-emerald-400 hover:bg-emerald-800 transition-colors"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {progress >= 100 && (
        <div className="absolute -top-2 -right-2 rotate-12 bg-amber-500 text-emerald-950 text-[8px] font-black px-2 py-0.5 rounded shadow-xl border border-emerald-900 pointer-events-none">
          MASHALLAH
        </div>
      )}
    </div>
  );
};

export default DayCard;
