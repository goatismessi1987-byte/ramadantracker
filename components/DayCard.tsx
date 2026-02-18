
import React from 'react';
import { DayRecord, SalahRecord } from '../types';
import { Check, BookOpen, Sun, Moon, MapPin } from 'lucide-react';

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

  const handlePagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    onUpdate({ ...record, quranPages: parseInt(e.target.value) || 0 });
  };

  const salahList: { key: keyof SalahRecord; label: string }[] = [
    { key: 'fajr', label: 'F' },
    { key: 'dhuhr', label: 'D' },
    { key: 'asr', label: 'A' },
    { key: 'maghrib', label: 'M' },
    { key: 'isha', label: 'I' },
  ];

  return (
    <div className={`glass p-4 rounded-xl border transition-all duration-300 ${record.fasting ? 'border-amber-500/50' : 'border-emerald-800/50'} flex flex-col gap-4`}>
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold text-amber-400">Day {record.day}</span>
        <span className="text-xs text-emerald-300/60">{record.date}</span>
      </div>

      {/* Fasting Toggle */}
      <button
        onClick={toggleFasting}
        disabled={readOnly}
        className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
          record.fasting 
            ? 'bg-amber-500 text-emerald-950 font-bold' 
            : 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-800'
        }`}
      >
        <Sun size={18} className={record.fasting ? 'animate-pulse' : ''} />
        {record.fasting ? 'Fasting Today' : 'Not Fasting'}
      </button>

      {/* Salah Tracking */}
      <div className="grid grid-cols-5 gap-2">
        {salahList.map((s) => (
          <button
            key={s.key}
            onClick={() => toggleSalah(s.key)}
            disabled={readOnly}
            className={`flex flex-col items-center justify-center h-12 rounded-lg transition-all ${
              record.salah[s.key]
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-emerald-900/30 text-emerald-500 border border-emerald-500/20'
            }`}
            title={s.key.charAt(0).toUpperCase() + s.key.slice(1)}
          >
            <span className="text-[10px] font-bold mb-1">{s.label}</span>
            {record.salah[s.key] ? <Check size={14} strokeWidth={4} /> : <div className="w-2 h-2 rounded-full bg-emerald-900/50" />}
          </button>
        ))}
      </div>

      {/* Quran Input */}
      <div className="flex items-center gap-3 bg-emerald-900/30 p-2 rounded-lg border border-emerald-500/10">
        <BookOpen size={18} className="text-amber-400" />
        <div className="flex flex-col flex-1">
          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-tighter">Quran Recitation</span>
          {readOnly ? (
            <span className="text-emerald-50 font-bold">{record.quranPages} pages</span>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={record.quranPages}
                onChange={handlePagesChange}
                className="bg-transparent border-none focus:ring-0 text-emerald-50 w-12 font-bold"
                placeholder="0"
              />
              <span className="text-xs text-emerald-400">pages</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DayCard;
