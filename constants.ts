
import { RamadanSchedule, DayRecord } from './types';

// Ramadan 2026 starts on February 19th
export const RAMADAN_START_DATE = new Date('2026-02-19');

export const INITIAL_SALAH_RECORD = {
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false,
};

export const generateInitialRecords = (): DayRecord[] => {
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    fasting: false,
    salah: { ...INITIAL_SALAH_RECORD },
    quranPages: 0,
    date: new Date(RAMADAN_START_DATE.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString(),
  }));
};

export const RAMADAN_SCHEDULE: RamadanSchedule[] = Array.from({ length: 30 }, (_, i) => {
  const baseSeheri = new Date('2026-02-19T05:14:00');
  const baseIftar = new Date('2026-02-19T17:56:00');
  
  const currentSeheri = new Date(baseSeheri.getTime() - i * 45000); 
  const currentIftar = new Date(baseIftar.getTime() + i * 45000);

  return {
    day: i + 1,
    date: new Date(RAMADAN_START_DATE.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }),
    seheri: currentSeheri.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    iftar: currentIftar.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
});
