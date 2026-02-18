
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import MotivationalSection from './components/MotivationalSection';
import DayCard from './components/DayCard';
import { DayRecord, UserProfile, RamadanSchedule } from './types';
import { generateInitialRecords, RAMADAN_SCHEDULE, RAMADAN_START_DATE } from './constants';
import { Calendar, Users, LayoutDashboard, Clock, Info, BellRing, LogOut, UserPlus, Key, ArrowLeft, Eye, MapPin, Timer, X } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'group' | 'schedule'>('dashboard');
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('ramadan_all_users');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedId = localStorage.getItem('ramadan_current_user_id');
    const users = JSON.parse(localStorage.getItem('ramadan_all_users') || '[]');
    return users.find((u: UserProfile) => u.id === savedId) || null;
  });
  
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Detailed view state
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationOffset, setLocationOffset] = useState(0); // Minutes offset from Chittagong base

  // Persistence
  useEffect(() => {
    localStorage.setItem('ramadan_all_users', JSON.stringify(allUsers));
    if (currentUser) {
      localStorage.setItem('ramadan_current_user_id', currentUser.id);
    } else {
      localStorage.removeItem('ramadan_current_user_id');
    }
  }, [allUsers, currentUser]);

  // Clock & Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reminder Logic: Notify at 11:30 PM (23:30)
  useEffect(() => {
    const checkReminder = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      
      // If it's 11:30 PM or later in the day, show the reminder
      if (currentHour === 23 && currentMin >= 30) {
        // Check if dismissed for today already using session storage
        const dismissedToday = sessionStorage.getItem(`dismissed_reminder_${now.toDateString()}`);
        if (!dismissedToday) {
          setShowReminder(true);
        }
      } else {
        setShowReminder(false);
      }
    };
    checkReminder();
    const interval = setInterval(checkReminder, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const dismissReminder = () => {
    setShowReminder(false);
    sessionStorage.setItem(`dismissed_reminder_${new Date().toDateString()}`, 'true');
  };

  // Geolocation for Chittagong logic
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { longitude } = position.coords;
        // Chittagong is ~91.78 E. For every degree difference, roughly 4 mins.
        const baseLng = 91.78;
        const diff = longitude - baseLng;
        const offset = Math.round(diff * 4);
        setLocationOffset(offset);
      }, (err) => {
        console.warn("Geolocation access denied or failed. Defaulting to exact Chittagong base time.", err);
      });
    }
  }, []);

  const currentRamadanDay = useMemo(() => {
    const diffTime = currentTime.getTime() - RAMADAN_START_DATE.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(30, diffDays));
  }, [currentTime]);

  const countdownInfo = useMemo(() => {
    const todaySchedule = RAMADAN_SCHEDULE[currentRamadanDay - 1];
    if (!todaySchedule) return null;

    // Apply location offset
    const seheriTime = new Date(todaySchedule.seheriRaw);
    seheriTime.setMinutes(seheriTime.getMinutes() + locationOffset);
    
    const iftarTime = new Date(todaySchedule.iftarRaw);
    iftarTime.setMinutes(iftarTime.getMinutes() + locationOffset);

    // Use current year/month/date for today's comparison
    const now = new Date();
    const todaySeheri = new Date(now);
    todaySeheri.setHours(seheriTime.getHours(), seheriTime.getMinutes(), 0);
    
    const todayIftar = new Date(now);
    todayIftar.setHours(iftarTime.getHours(), iftarTime.getMinutes(), 0);

    let target: Date;
    let label: string;

    if (now < todaySeheri) {
      target = todaySeheri;
      label = "Seheri Ends In";
    } else if (now < todayIftar) {
      target = todayIftar;
      label = "Iftar Starts In";
    } else {
      // Show next day Seheri
      const tomorrowSchedule = RAMADAN_SCHEDULE[currentRamadanDay];
      if (tomorrowSchedule) {
        const tomSeheri = new Date(tomorrowSchedule.seheriRaw);
        tomSeheri.setMinutes(tomSeheri.getMinutes() + locationOffset);
        target = new Date(now);
        target.setDate(target.getDate() + 1);
        target.setHours(tomSeheri.getHours(), tomSeheri.getMinutes(), 0);
        label = "Next Seheri In";
      } else {
        return null;
      }
    }

    const diff = target.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return { label, h: hours, m: mins, s: secs, seheri: todaySeheri, iftar: todayIftar };
  }, [currentRamadanDay, currentTime, locationOffset]);

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !passwordInput.trim()) return;
    if (allUsers.some(u => u.name.toLowerCase() === nameInput.toLowerCase())) {
      setLoginError('This name is already taken.');
      return;
    }
    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      name: nameInput.trim(),
      password: passwordInput.trim(),
      isCurrentUser: true,
      records: generateInitialRecords(),
    };
    setAllUsers([...allUsers, newUser]);
    setCurrentUser(newUser);
    setNameInput('');
    setPasswordInput('');
    setLoginError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = allUsers.find(u => 
      u.name.toLowerCase() === nameInput.toLowerCase() && u.password === passwordInput
    );
    if (user) {
      setCurrentUser(user);
      setNameInput('');
      setPasswordInput('');
      setLoginError('');
    } else {
      setLoginError('Invalid name or password.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewingUser(null);
    setActiveTab('dashboard');
  };

  const updateRecord = (updatedRecord: DayRecord) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      records: currentUser.records.map(r => r.day === updatedRecord.day ? updatedRecord : r)
    };
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const calculateStats = (user: UserProfile) => {
    const totalFastings = user.records.filter(r => r.fasting).length;
    const totalPages = user.records.reduce((acc, r) => acc + r.quranPages, 0);
    const totalPrayers = user.records.reduce((acc, r) => {
      return acc + Object.values(r.salah).filter(v => v).length;
    }, 0);
    
    // Overall Progress Logic (40% Fasting, 40% Salah, 20% Quran per day)
    const totalPossiblePoints = 30 * 100;
    const earnedPoints = user.records.reduce((acc, r) => {
      const prayersDone = Object.values(r.salah).filter(v => v).length;
      const quranWeight = Math.min(r.quranPages, 20);
      return acc + (r.fasting ? 40 : 0) + (prayersDone * 8) + quranWeight;
    }, 0);
    const overallProgress = Math.round((earnedPoints / totalPossiblePoints) * 100);

    return { totalFastings, totalPages, totalPrayers, overallProgress };
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 min-h-screen flex flex-col items-center justify-center space-y-12">
        <Header />
        <div className="w-full max-w-md glass p-8 rounded-3xl border border-amber-500/30 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="flex bg-emerald-950/50 p-1 rounded-xl mb-6">
            <button onClick={() => { setAuthMode('register'); setLoginError(''); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'register' ? 'bg-amber-500 text-emerald-950 shadow-md' : 'text-emerald-400'}`}>Create Account</button>
            <button onClick={() => { setAuthMode('login'); setLoginError(''); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'login' ? 'bg-amber-500 text-emerald-950 shadow-md' : 'text-emerald-400'}`}>Log In</button>
          </div>
          <form onSubmit={authMode === 'register' ? handleCreateProfile : handleLogin} className="space-y-4">
            <div className="relative">
               <input type="text" required value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="User Name" className="w-full bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-3 text-emerald-50 outline-none focus:border-amber-500 transition-all" />
            </div>
            <div className="relative">
               <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Password" className="w-full bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-3 text-emerald-50 outline-none focus:border-amber-500 transition-all" />
            </div>
            {loginError && <p className="text-red-400 text-xs text-center font-bold uppercase tracking-widest">{loginError}</p>}
            <button type="submit" className="w-full py-4 bg-amber-500 text-emerald-950 font-black rounded-xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg active:scale-95">
              {authMode === 'register' ? <UserPlus size={20} /> : <Key size={20} />}
              {authMode === 'register' ? 'Join the Journey' : 'Log In'}
            </button>
          </form>
        </div>
        <div className="flex flex-col items-center gap-4 py-8 border-t border-emerald-900/50 w-full max-w-md">
           <img src="https://placehold.co/120x120/022c22/fbbf24?text=AG&font=serif" alt="Atongko Group Logo" className="w-20 h-20 object-contain drop-shadow-[0_0_10px_rgba(251,191,36,0.3)] opacity-80" />
           <div className="text-center">
             <p className="text-emerald-500 text-xs uppercase tracking-widest font-bold">App Builder</p>
             <p className="text-amber-400 font-bold text-lg">Powered by Atongko Group</p>
           </div>
        </div>
      </div>
    );
  }

  const currentStats = calculateStats(currentUser);

  return (
    <div className="max-w-6xl mx-auto pb-32 px-4 relative">
      {/* 11:30 PM Reminder Notification */}
      {showReminder && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-lg animate-in fade-in slide-in-from-top-10 duration-500">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-emerald-950 p-4 sm:p-5 rounded-3xl flex items-center justify-between gap-4 shadow-[0_20px_50px_-12px_rgba(251,191,36,0.5)] border-2 border-emerald-900/20">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-950 text-amber-500 p-2 rounded-2xl animate-bounce">
                <BellRing size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Daily Reminder (11:30 PM)</span>
                <p className="text-sm sm:text-base font-bold leading-tight">আজকের আমলনামা কি পূর্ণ করেছেন? আপনার রিপোর্ট সাবমিট করুন।</p>
              </div>
            </div>
            <button 
              onClick={dismissReminder}
              className="p-2 hover:bg-emerald-950/10 rounded-full transition-colors"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex justify-between items-center py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white leading-none">{currentUser.name}</span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
              <MapPin size={10} /> {locationOffset === 0 ? 'Chittagong' : `Local Offset: ${locationOffset > 0 ? '+' : ''}${locationOffset}m`}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2.5 rounded-xl glass border-emerald-800 text-emerald-400 hover:text-white transition-all"><LogOut size={20} /></button>
      </div>

      <Header />

      {/* Real-time Countdown Section */}
      {countdownInfo && (
        <div className="glass p-6 rounded-3xl border border-amber-500/20 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Timer size={100} className="text-amber-500" />
          </div>
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-amber-500 font-black uppercase tracking-[0.3em] text-[10px]">Current Status</h3>
            <p className="text-white text-2xl font-bold flex items-center gap-2">
              Ramadan Day {currentRamadanDay}
              <span className="text-emerald-500 text-sm font-medium">| Chittagong Time</span>
            </p>
            <div className="flex gap-4 pt-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-emerald-500 font-bold uppercase">Seheri End</span>
                <span className="text-lg font-mono text-blue-300 font-bold">
                  {countdownInfo.seheri.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-emerald-500 font-bold uppercase">Iftar Time</span>
                <span className="text-lg font-mono text-amber-500 font-bold">
                  {countdownInfo.iftar.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
            <span className="text-emerald-400 font-black uppercase tracking-widest text-xs">{countdownInfo.label}</span>
            <div className="flex gap-2">
              {[
                { val: countdownInfo.h, label: 'HRS' },
                { val: countdownInfo.m, label: 'MIN' },
                { val: countdownInfo.s, label: 'SEC' }
              ].map((t, idx) => (
                <div key={idx} className="flex flex-col items-center glass bg-emerald-950/80 px-4 py-3 rounded-2xl min-w-[70px] border border-amber-500/10">
                  <span className="text-3xl font-black text-amber-500 font-mono leading-none">{t.val.toString().padStart(2, '0')}</span>
                  <span className="text-[9px] text-emerald-600 font-bold mt-1">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="mt-8 space-y-8">
        <MotivationalSection />

        <div className="flex justify-center p-1.5 bg-emerald-950/90 glass rounded-2xl w-fit mx-auto sticky top-4 z-40 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
          <button onClick={() => { setActiveTab('dashboard'); setViewingUser(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeTab === 'dashboard' && !viewingUser ? 'bg-amber-500 text-emerald-950 font-black shadow-lg' : 'text-emerald-300 hover:text-white'}`}>
            <LayoutDashboard size={20} /> <span className="hidden sm:inline">My Tracker</span>
          </button>
          <button onClick={() => { setActiveTab('group'); setViewingUser(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeTab === 'group' || viewingUser ? 'bg-amber-500 text-emerald-950 font-black shadow-lg' : 'text-emerald-300 hover:text-white'}`}>
            <Users size={20} /> <span className="hidden sm:inline">Leaderboard</span>
          </button>
          <button onClick={() => { setActiveTab('schedule'); setViewingUser(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-amber-500 text-emerald-950 font-black shadow-lg' : 'text-emerald-300 hover:text-white'}`}>
            <Clock size={20} /> <span className="hidden sm:inline">2026 Table</span>
          </button>
        </div>

        {activeTab === 'dashboard' && !viewingUser && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass p-6 rounded-3xl border-b-4 border-amber-500/30 text-center">
                <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">Monthly Score</span>
                <span className="text-5xl font-black text-white">{currentStats.overallProgress}%</span>
              </div>
              <div className="glass p-6 rounded-3xl border-b-4 border-blue-500/30 text-center">
                <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">Total Fasts</span>
                <span className="text-5xl font-black text-white">{currentStats.totalFastings}</span>
              </div>
              <div className="glass p-6 rounded-3xl border-b-4 border-emerald-500/30 text-center">
                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">Total Prayers</span>
                <span className="text-5xl font-black text-white">{currentStats.totalPrayers}</span>
              </div>
              <div className="glass p-6 rounded-3xl border-b-4 border-purple-500/30 text-center">
                <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">Quran Pages</span>
                <span className="text-5xl font-black text-white">{currentStats.totalPages}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentUser.records.map(record => (
                <DayCard key={record.day} record={record} onUpdate={updateRecord} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'group' && !viewingUser && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass rounded-3xl overflow-hidden border border-emerald-800/50">
              <div className="p-6 border-b border-emerald-800/50 bg-emerald-900/20">
                <h2 className="text-xl font-black text-amber-400 uppercase tracking-widest">Accountability Leaderboard</h2>
                <p className="text-sm text-emerald-500">See who is leading the month in Ibadah.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-emerald-950/50 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4">Participant</th>
                      <th className="px-6 py-4 text-center">Fasts</th>
                      <th className="px-6 py-4 text-center">Prayers</th>
                      <th className="px-6 py-4 text-center">Quran</th>
                      <th className="px-6 py-4 text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/50">
                    {allUsers.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-20 text-center text-emerald-500 italic">No participants yet...</td></tr>
                    ) : (
                      allUsers.map((user) => {
                        const stats = calculateStats(user);
                        return (
                          <tr key={user.id} className="group cursor-pointer hover:bg-emerald-900/30 transition-colors" onClick={() => setViewingUser(user)}>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black bg-emerald-800 text-emerald-100 group-hover:bg-amber-500 group-hover:text-emerald-950 transition-all">
                                  {user.name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-emerald-100 group-hover:text-amber-400">{user.name}</span>
                                  <span className="text-[10px] text-emerald-600 uppercase font-black">View Profile</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center font-bold text-white">{stats.totalFastings}</td>
                            <td className="px-6 py-5 text-center text-emerald-400">{stats.totalPrayers}</td>
                            <td className="px-6 py-5 text-center text-blue-400">{stats.totalPages} <span className="text-[8px] uppercase">pgs</span></td>
                            <td className="px-6 py-5 text-right">
                              <div className="inline-flex flex-col items-end">
                                <div className="w-24 h-2 bg-emerald-950 rounded-full overflow-hidden mb-1">
                                  <div className="h-full bg-amber-500" style={{ width: `${stats.overallProgress}%` }} />
                                </div>
                                <span className="text-[10px] font-black text-amber-500">{stats.overallProgress}% SCORE</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {viewingUser && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <button onClick={() => setViewingUser(null)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-900/40 text-emerald-300 hover:text-amber-400 border border-emerald-800"><ArrowLeft size={18} /> Back</button>
              <h2 className="text-2xl font-black text-amber-400 uppercase tracking-tighter">{viewingUser.name}'s Progress</h2>
              <div className="w-24"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {viewingUser.records.map(record => <DayCard key={record.day} record={record} onUpdate={() => {}} readOnly={true} />)}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="glass rounded-3xl overflow-hidden border border-amber-500/20">
              <div className="p-8 bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 flex items-center justify-between border-b border-amber-500/20">
                <div>
                  <h2 className="text-3xl font-black text-amber-400">Chittagong Schedule</h2>
                  <p className="text-emerald-300 font-bold uppercase text-xs tracking-widest mt-1 flex items-center gap-2">
                    <MapPin size={14} /> Location Adjusted Timings
                  </p>
                </div>
                <Calendar className="text-amber-400/10" size={80} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-emerald-950 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">Ramadan</th>
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5 text-center">Seheri (End)</th>
                      <th className="px-8 py-5 text-center">Iftar (Start)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-800/50">
                    {RAMADAN_SCHEDULE.map((item) => {
                      const seheri = new Date(item.seheriRaw);
                      seheri.setMinutes(seheri.getMinutes() + locationOffset);
                      const iftar = new Date(item.iftarRaw);
                      iftar.setMinutes(iftar.getMinutes() + locationOffset);
                      return (
                        <tr key={item.day} className="hover:bg-emerald-900/30 transition-colors">
                          <td className="px-8 py-5 font-black text-emerald-100">Day {item.day}</td>
                          <td className="px-8 py-5 text-emerald-400 font-medium">{item.date}</td>
                          <td className="px-8 py-5 text-center text-lg font-mono font-black text-blue-300">
                            {seheri.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </td>
                          <td className="px-8 py-5 text-center text-lg font-mono font-black text-amber-400">
                            {iftar.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 pt-10 border-t border-emerald-900/50 text-center text-emerald-500 text-sm space-y-12 pb-10">
        <div className="flex flex-col items-center gap-6 pt-6 border-t border-emerald-900/20 max-w-sm mx-auto">
           <div className="relative group">
             <div className="absolute inset-0 bg-amber-500/20 blur-2xl group-hover:bg-amber-500/40 transition-all rounded-full" />
             <img src="https://placehold.co/150x150/022c22/fbbf24?text=AG&font=serif" alt="Atongko Group Logo" className="w-24 h-24 object-contain relative z-10 drop-shadow-2xl brightness-110" />
           </div>
           <div className="space-y-1">
             <p className="text-[10px] text-emerald-600 uppercase font-black tracking-[0.4em]">App Builder</p>
             <p className="text-amber-400 font-black text-2xl tracking-tight drop-shadow-sm">Powered by Atongko Group</p>
           </div>
        </div>
        <div className="font-arabic text-3xl text-amber-500/30">রমضان مبارক</div>
      </footer>
    </div>
  );
};

export default App;
