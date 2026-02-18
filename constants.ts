
import { RamadanSchedule, DayRecord } from './types';

// Ramadan 2026 starts on February 19th
export const RAMADAN_START_DATE = new Date('2026-02-19T00:00:00');

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

// Chittagong Base Timings (Approx 5-10 mins earlier than Dhaka)
export const RAMADAN_SCHEDULE: RamadanSchedule[] = Array.from({ length: 30 }, (_, i) => {
  const baseSeheri = new Date('2026-02-19T05:08:00'); // Chittagong baseline
  const baseIftar = new Date('2026-02-19T17:50:00');  // Chittagong baseline
  
  // Timings slightly shift as the month progresses
  const currentSeheri = new Date(baseSeheri.getTime() - i * 45000); 
  const currentIftar = new Date(baseIftar.getTime() + i * 45000);

  return {
    day: i + 1,
    date: new Date(RAMADAN_START_DATE.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }),
    seheri: currentSeheri.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    iftar: currentIftar.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    // raw values for calculations
    seheriRaw: currentSeheri,
    iftarRaw: currentIftar
  };
});
