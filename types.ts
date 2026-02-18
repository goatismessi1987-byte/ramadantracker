
export interface SalahRecord {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export interface DayRecord {
  day: number;
  fasting: boolean;
  salah: SalahRecord;
  quranPages: number;
  date: string;
}

export interface UserProfile {
  id: string;
  name: string;
  password?: string; // Added password field
  isCurrentUser: boolean;
  records: DayRecord[];
}

export interface QuranVerse {
  arabic: string;
  bengali: string;
  english: string;
  reference: string;
}

export interface RamadanSchedule {
  day: number;
  date: string;
  seheri: string;
  iftar: string;
  // Added raw Date objects to facilitate countdown and timezone calculations
  seheriRaw: Date;
  iftarRaw: Date;
}