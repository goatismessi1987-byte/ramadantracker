
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import MotivationalSection from './components/MotivationalSection';
import DayCard from './components/DayCard';
import { DayRecord, UserProfile } from './types';
import { generateInitialRecords, RAMADAN_SCHEDULE, RAMADAN_START_DATE } from './constants';
import { sheetService } from './services/sheetService';
import { 
  Calendar, 
  LayoutDashboard, 
  Clock, 
  BellRing, 
  LogOut, 
  UserPlus, 
  MapPin, 
  Timer, 
  X, 
  CheckCircle,
  AlertCircle,
  Trophy,
  Users,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Loader2,
  CloudUpload
} from 'lucide-react';

const ACTIVE_USER_KEY = 'ramadan_active_user_v1';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leaderboard' | 'schedule'>('dashboard');
  const [leaderboardUsers, setLeaderboardUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auth & UI state
  const [authMode, setAuthMode] = useState<'welcome' | 'register' | 'login'>('welcome');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [showReminder, setShowReminder] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationOffset, setLocationOffset] = useState(0);

  // 1. Restore session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(ACTIVE_USER_KEY);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id) {
          setCurrentUser(parsed);
        }
      } catch (e) {
        console.error("Session restoration failed", e);
      }
    }
  }, []);

  // Timer for countdown and reminders
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkReminder = () => {
      const now = new Date();
      if (now.getHours() === 23 && now.getMinutes() >= 30) {
        const dismissedToday = sessionStorage.getItem(`dismissed_reminder_${now.toDateString()}`);
        if (!dismissedToday) setShowReminder(true);
      } else setShowReminder(false);
    };
    checkReminder();
    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocationOffset(Math.round((position.coords.longitude - 91.78) * 4));
      });
    }
  }, []);

  // Sync leaderboard when the tab is visited
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      const fetchLB = async () => {
        setIsLoading(true);
        const users = await sheetService.getAllUsers();
        setLeaderboardUsers(users);
        setIsLoading(false);
      };
      fetchLB();
    }
  }, [activeTab]);

  const currentRamadanDay = useMemo(() => {
    const diffTime = currentTime.getTime() - RAMADAN_START_DATE.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.min(30, diffDays));
  }, [currentTime]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    
    const trimmedName = nameInput.trim();
    if (!trimmedName || !passwordInput.trim()) {
      setAuthError('Please enter both name and password.');
      setIsLoading(false);
      return;
    }

    // Check if user already exists
    const allUsers = await sheetService.getAllUsers();
    const existing = allUsers.find(u => u.name.toLowerCase() === trimmedName.toLowerCase());
    
    if (existing) {
      setAuthError('This name is already taken. Please choose another or sign in.');
      setIsLoading(false);
      return;
    }

    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      name: trimmedName,
      password: passwordInput,
      isCurrentUser: true,
      records: generateInitialRecords(),
    };

    const success = await sheetService.registerUser(newUser);
    if (success) {
      setCurrentUser(newUser);
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(newUser));
      resetForm();
    } else {
      setAuthError('Cloud registration failed. Please try again.');
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);

    const trimmedName = nameInput.trim();
    const allUsers = await sheetService.getAllUsers();
    
    // Search for user matching name and password
    const user = allUsers.find(u => 
      u.name.toLowerCase() === trimmedName.toLowerCase() && 
      u.password === passwordInput
    );

    if (user) {
      setCurrentUser(user);
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
      resetForm();
    } else {
      setAuthError('Invalid account name or password. Please try again.');
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(ACTIVE_USER_KEY);
    setAuthMode('welcome');
  };

  const resetForm = () => {
    setNameInput('');
    setPasswordInput('');
    setAuthError('');
  };

  const updateRecord = async (updatedRecord: DayRecord) => {
    if (!currentUser) return;
    
    // Update local state first (Optimistic)
    const updatedRecords = currentUser.records.map(r => r.day === updatedRecord.day ? updatedRecord : r);
    const updatedUser = { ...currentUser, records: updatedRecords };
    setCurrentUser(updatedUser);
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(updatedUser));

    // Async cloud sync
    setIsSyncing(true);
    const success = await sheetService.syncUserRecords(currentUser.id, updatedRecords);
    if (!success) {
      console.error("Cloud sync failed. Data is saved on this device only.");
    }
    setIsSyncing(false);
  };

  const calculateStats = (user: UserProfile) => {
    if (!user.records) return { totalFastings: 0, totalPages: 0, totalPrayers: 0, overallProgress: 0 };
    const totalFastings = user.records.filter(r => r.fasting).length;
    const totalPages = user.records.reduce((acc, r) => acc + (r.quranPages || 0), 0);
    const totalPrayers = user.records.reduce((acc, r) => acc + Object.values(r.salah).filter(v => v).length, 0);
    
    const lastDayWithActivity = [...user.records].reverse().find(r => r.fasting || Object.values(r.salah).some(v => v) || r.quranPages > 0)?.day || 0;
    const activePeriod = Math.max(currentRamadanDay, lastDayWithActivity);
    const relevantRecords = user.records.slice(0, activePeriod);
    
    const totalDailyPercentagesSum = relevantRecords.reduce((acc, r) => {
      const prayersDone = Object.values(r.salah).filter(v => v).length;
      const quranWeight = Math.min(r.quranPages, 20);
      return acc + ((r.fasting ? 40 : 0) + (prayersDone * 8) + quranWeight);
    }, 0);
    const divisor = relevantRecords.length || 1;
    return { totalFastings, totalPages, totalPrayers, overallProgress: Math.round(totalDailyPercentagesSum / divisor) };
  };

  const sortedLeaderboard = useMemo(() => {
    return leaderboardUsers
      .map(user => ({ user, stats: calculateStats(user) }))
      .sort((a, b) => b.stats.overallProgress - a.stats.overallProgress);
  }, [leaderboardUsers, currentRamadanDay]);

  const countdownInfo = useMemo(() => {
    const todaySchedule = RAMADAN_SCHEDULE[currentRamadanDay - 1];
    if (!todaySchedule) return null;
    const seheriTime = new Date(todaySchedule.seheriRaw);
    seheriTime.setMinutes(seheriTime.getMinutes() + locationOffset);
    const iftarTime = new Date(todaySchedule.iftarRaw);
    iftarTime.setMinutes(iftarTime.getMinutes() + locationOffset);
    const now = new Date();
    const todaySeheri = new Date(now);
    todaySeheri.setHours(seheriTime.getHours(), seheriTime.getMinutes(), 0);
    const todayIftar = new Date(now);
    todayIftar.setHours(iftarTime.getHours(), iftarTime.getMinutes(), 0);
    let target: Date, label: string;
    if (now < todaySeheri) { target = todaySeheri; label = "Seheri Ends In"; }
    else if (now < todayIftar) { target = todayIftar; label = "Iftar Starts In"; }
    else {
      const tomorrowSchedule = RAMADAN_SCHEDULE[currentRamadanDay];
      if (tomorrowSchedule) {
        const tomSeheri = new Date(tomorrowSchedule.seheriRaw);
        tomSeheri.setMinutes(tomSeheri.getMinutes() + locationOffset);
        target = new Date(now); target.setDate(target.getDate() + 1);
        target.setHours(tomSeheri.getHours(), tomSeheri.getMinutes(), 0);
        label = "Next Seheri In";
      } else return null;
    }
    const diff = target.getTime() - now.getTime();
    return { label, h: Math.floor(diff / (1000 * 60 * 60)), m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)), s: Math.floor((diff % (1000 * 60)) / 1000), seheri: todaySeheri, iftar: todayIftar };
  }, [currentRamadanDay, currentTime, locationOffset]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 min-h-screen flex flex-col items-center justify-center space-y-12">
        <Header />
        <div className="w-full max-w-md glass p-8 rounded-3xl border border-amber-500/30 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-500">
          
          {authMode === 'welcome' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-amber-400">Join the Tracker</h2>
                <p className="text-emerald-400 text-sm">Sync your Ramadan habits across all your devices.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setAuthMode('login')}
                  className="w-full py-4 bg-amber-500 text-emerald-950 font-black rounded-xl flex items-center justify-center gap-2 hover:bg-amber-400 shadow-lg transition-all"
                >
                  Sign In to Account
                </button>
                <button 
                  onClick={() => setAuthMode('register')}
                  className="w-full py-4 bg-emerald-900/40 text-emerald-400 border border-emerald-800 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-800 transition-all"
                >
                  Create New Profile
                </button>
              </div>
            </div>
          )}

          {(authMode === 'register' || authMode === 'login') && (
            <form onSubmit={authMode === 'register' ? handleRegister : handleLogin} className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <button type="button" onClick={() => setAuthMode('welcome')} className="p-2 hover:bg-emerald-900 rounded-lg"><ArrowLeft size={18} /></button>
                <span className="font-black uppercase tracking-widest text-sm">{authMode === 'register' ? 'Register Account' : 'Welcome Back'}</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest px-2">Account Name</label>
                <input type="text" required value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="e.g. Abdullah" className="w-full bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-3 text-emerald-50 outline-none focus:border-amber-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest px-2">Account Password</label>
                <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••••••" className="w-full bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-3 text-emerald-50 outline-none focus:border-amber-500" />
              </div>
              {authError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex gap-2"><AlertCircle size={14} /> {authError}</div>}
              <button disabled={isLoading} type="submit" className="w-full py-4 bg-amber-500 text-emerald-950 font-black rounded-xl hover:bg-amber-400 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                {isLoading && <Loader2 className="animate-spin" size={20} />}
                {authMode === 'register' ? 'Create Profile' : 'Sign In'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-emerald-800/50 text-center">
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center justify-center gap-1"><ShieldCheck size={10} /> Secure Private Storage Active</p>
          </div>
        </div>
      </div>
    );
  }

  const currentStats = calculateStats(currentUser);

  return (
    <div className="max-w-6xl mx-auto pb-32 px-4 relative">
      {showReminder && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-lg animate-in fade-in slide-in-from-top-10">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-emerald-950 p-5 rounded-3xl flex items-center justify-between gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-950 text-amber-500 p-2 rounded-2xl animate-bounce"><BellRing size={24} /></div>
              <p className="text-sm font-bold">আজকের আমলনামা কি পূর্ণ করেছেন? আপডেট করুন।</p>
            </div>
            <button onClick={() => setShowReminder(false)} className="p-2"><X size={20} /></button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center font-black shadow-lg">{currentUser.name.charAt(0)}</div>
          <div className="flex flex-col">
            <span className="font-bold text-white leading-none">{currentUser.name}</span>
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold"><MapPin size={10} /> {locationOffset === 0 ? 'Chittagong' : `Adjusted: ${locationOffset > 0 ? '+' : ''}${locationOffset}m`}</div>
               <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                 {isSyncing ? <Loader2 size={10} className="animate-spin" /> : <CloudUpload size={10} />} SYNCED
               </div>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2.5 rounded-xl glass border-emerald-800 text-emerald-400 hover:text-white flex items-center gap-2 text-xs font-bold">
          <LogOut size={18} /> <span className="hidden sm:inline">Switch Profile</span>
        </button>
      </div>

      <Header />

      {countdownInfo && activeTab === 'dashboard' && (
        <div className="glass p-6 rounded-3xl border border-amber-500/20 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Timer size={100} className="text-amber-500" /></div>
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-amber-500 font-black uppercase tracking-[0.3em] text-[10px]">Today</h3>
            <p className="text-white text-2xl font-bold">Ramadan Day {currentRamadanDay}</p>
            <div className="flex gap-4 pt-2">
              <div className="flex flex-col text-sm">
                <span className="text-[10px] text-emerald-500 font-bold uppercase">Seheri End</span>
                <span className="font-mono text-blue-300 font-bold">{countdownInfo.seheri.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
              </div>
              <div className="flex flex-col text-sm">
                <span className="text-[10px] text-emerald-500 font-bold uppercase">Iftar Time</span>
                <span className="font-mono text-amber-500 font-bold">{countdownInfo.iftar.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
            <span className="text-emerald-400 font-black uppercase tracking-widest text-[10px]">{countdownInfo.label}</span>
            <div className="flex gap-2">
              {[ { val: countdownInfo.h }, { val: countdownInfo.m }, { val: countdownInfo.s } ].map((t, idx) => (
                <div key={idx} className="flex flex-col items-center glass bg-emerald-950/80 px-4 py-3 rounded-2xl min-w-[65px] border border-amber-500/10">
                  <span className="text-2xl font-black text-amber-500 font-mono">{t.val.toString().padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="mt-8 space-y-8">
        {activeTab === 'dashboard' && <MotivationalSection />}

        <div className="flex justify-center p-1.5 bg-emerald-950/90 glass rounded-2xl w-fit mx-auto sticky top-4 z-40 border border-amber-500/20 backdrop-blur-xl">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-amber-500 text-emerald-950 font-black shadow-lg' : 'text-emerald-300 hover:text-white'}`}>
            <LayoutDashboard size={20} /> <span className="hidden sm:inline">Tracker</span>
          </button>
          <button onClick={() => setActiveTab('leaderboard')} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeTab === 'leaderboard' ? 'bg-amber-500 text-emerald-950 font-black shadow-lg' : 'text-emerald-300 hover:text-white'}`}>
            <Users size={20} /> <span className="hidden sm:inline">Member Rankings</span>
          </button>
          <button onClick={() => setActiveTab('schedule')} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-amber-500 text-emerald-950 font-black shadow-lg' : 'text-emerald-300 hover:text-white'}`}>
            <Clock size={20} /> <span className="hidden sm:inline">Schedule</span>
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Overall %', val: `${currentStats.overallProgress}%`, border: 'border-amber-500' },
                { label: 'Total Fasts', val: currentStats.totalFastings, border: 'border-blue-500' },
                { label: 'Prayers Done', val: currentStats.totalPrayers, border: 'border-emerald-500' },
                { label: 'Quran Pages', val: currentStats.totalPages, border: 'border-purple-500' }
              ].map((stat, i) => (
                <div key={i} className={`glass p-4 sm:p-6 rounded-3xl border-b-4 ${stat.border}/30 shadow-lg`}>
                  <span className="text-amber-500 text-[10px] font-black uppercase mb-1 block">{stat.label}</span>
                  <span className="text-2xl sm:text-4xl font-black text-white">{stat.val}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentUser.records.map(record => <DayCard key={record.day} record={record} onUpdate={updateRecord} />)}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="glass rounded-3xl overflow-hidden border border-emerald-800/50 animate-in slide-in-from-bottom-5">
            <div className="p-6 bg-emerald-900/20 border-b border-emerald-800/50 flex justify-between items-center">
              <h2 className="text-xl font-black text-amber-400 flex items-center gap-2"><Trophy size={20} /> Global Member Rankings</h2>
              {isLoading && <Loader2 className="animate-spin text-amber-500" size={20} />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-emerald-950/50 text-emerald-400 text-[10px] uppercase font-black">
                  <tr>
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4 text-center">Total Fasts</th>
                    <th className="px-6 py-4 text-right">Avg Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/50">
                  {sortedLeaderboard.map(({ user, stats }, index) => (
                    <tr key={user.id} className={`hover:bg-emerald-900/30 transition-colors ${user.id === currentUser.id ? 'bg-amber-500/5' : ''}`}>
                      <td className="px-6 py-5 font-black">#{index + 1}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{user.name}</span>
                          {user.id === currentUser.id && <span className="text-[8px] bg-amber-500 text-emerald-950 px-1.5 py-0.5 rounded font-black">YOU</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-mono">{stats.totalFastings}</td>
                      <td className="px-6 py-5 text-right font-black text-amber-500">{stats.overallProgress}%</td>
                    </tr>
                  ))}
                  {!isLoading && sortedLeaderboard.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-emerald-600 italic">No rankings found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-emerald-950/50 text-center text-[10px] text-emerald-600 font-bold uppercase tracking-widest border-t border-emerald-800/50">
              * Rankings include all members using this tracker.
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="glass rounded-3xl overflow-hidden max-w-4xl mx-auto animate-in fade-in shadow-2xl border border-amber-500/20">
            <div className="p-8 bg-emerald-900/50 flex justify-between border-b border-amber-500/10">
              <h2 className="text-3xl font-black text-amber-400">2026 Table</h2>
              <Calendar className="text-amber-400/20" size={60} />
            </div>
            <table className="w-full">
              <thead className="bg-emerald-950 text-amber-500 text-[10px] uppercase font-black"><tr className="px-8 py-4">
                <th className="px-8 py-5">Day</th><th className="px-8 py-5 text-center">Seheri</th><th className="px-8 py-5 text-center">Iftar</th>
              </tr></thead>
              <tbody className="divide-y divide-emerald-800/50">
                {RAMADAN_SCHEDULE.map((item) => {
                  const seheri = new Date(item.seheriRaw); seheri.setMinutes(seheri.getMinutes() + locationOffset);
                  const iftar = new Date(item.iftarRaw); iftar.setMinutes(iftar.getMinutes() + locationOffset);
                  return (
                    <tr key={item.day} className="hover:bg-emerald-900/30">
                      <td className="px-8 py-5 font-black">Day {item.day}</td>
                      <td className="px-8 py-5 text-center font-mono">{seheri.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                      <td className="px-8 py-5 text-center font-mono text-amber-400">{iftar.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer className="mt-20 pt-10 border-t border-emerald-900/50 text-center pb-10">
         <img src="https://placehold.co/150x150/022c22/fbbf24?text=AG&font=serif" alt="Logo" className="w-16 h-16 mx-auto mb-4 opacity-50" />
         <p className="text-amber-400 font-black">Powered by Atongko Group</p>
         <p className="text-emerald-700 text-[10px] font-bold uppercase mt-1">Private Secure Cloud Data Storage Active</p>
      </footer>
    </div>
  );
};

export default App;
