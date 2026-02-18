
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import MotivationalSection from './components/MotivationalSection';
import DayCard from './components/DayCard';
import { DayRecord, UserProfile } from './types';
import { generateInitialRecords, RAMADAN_SCHEDULE, RAMADAN_START_DATE } from './constants';
import { supabase } from './supabase';
import { 
  Calendar, 
  Users, 
  LayoutDashboard, 
  Clock, 
  BellRing, 
  LogOut, 
  UserPlus, 
  Key, 
  ArrowLeft, 
  MapPin, 
  Timer, 
  X, 
  Trophy,
  Cloud,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'group' | 'schedule'>('dashboard');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // UI state
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationOffset, setLocationOffset] = useState(0);

  // Helper to map username to a unique email for Supabase Auth
  const getEmailFromUsername = (username: string) => `${username.toLowerCase().replace(/\s/g, '')}@ramadan.app`;

  // 1. Initialize session and real-time listeners
  useEffect(() => {
    const initApp = async () => {
      setIsSyncing(true);
      try {
        // Check current auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        // Fetch initial leaderboard/users data
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*');
        
        if (fetchError) {
          // If table doesn't exist yet, we don't crash, we just log it
          console.warn("Leaderboard table not found or accessible:", fetchError.message);
          setIsConnected(false);
        } else if (data) {
          setIsConnected(true);
          setAllUsers(data as UserProfile[]);
          
          if (session?.user) {
            const matchingUser = (data as UserProfile[]).find(u => u.id === session.user.id);
            if (matchingUser) {
              setCurrentUser(matchingUser);
            } else {
              // Fallback if auth exists but no DB record (e.g. table deleted)
              setCurrentUser({
                id: session.user.id,
                name: session.user.user_metadata?.full_name || "Guest User",
                isCurrentUser: true,
                records: generateInitialRecords(),
              });
            }
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    initApp();

    // Real-time listener for the "users" table
    const channel = supabase
      .channel('global-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          setAllUsers((prev) => {
            if (payload.eventType === 'INSERT') {
              const newUser = payload.new as UserProfile;
              return prev.some(u => u.id === newUser.id) ? prev : [...prev, newUser];
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as UserProfile;
              if (currentUser?.id === updated.id) setCurrentUser(updated);
              return prev.map(u => u.id === updated.id ? updated : u);
            } else if (payload.eventType === 'DELETE') {
              return prev.filter(u => u.id === payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
      });

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  // Timer, Geolocation, and Reminders
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
    const interval = setInterval(checkReminder, 30000);
    return () => clearInterval(interval);
  }, []);

  const dismissReminder = () => {
    const now = new Date();
    sessionStorage.setItem(`dismissed_reminder_${now.toDateString()}`, 'true');
    setShowReminder(false);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { longitude } = position.coords;
        setLocationOffset(Math.round((longitude - 91.78) * 4));
      }, (err) => console.warn("Geo access denied.", err));
    }
  }, []);

  const currentRamadanDay = useMemo(() => {
    const diffTime = currentTime.getTime() - RAMADAN_START_DATE.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.min(30, diffDays));
  }, [currentTime]);

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

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!nameInput.trim() || !passwordInput.trim()) return;

    try {
      // 1. Supabase Auth Sign Up
      // Ensure your Supabase Dashboard has "Allow new users to sign up" enabled in Auth settings
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: getEmailFromUsername(nameInput),
        password: passwordInput,
        options: { 
          data: { full_name: nameInput.trim() } 
        }
      });

      if (authError) {
        console.error("Supabase Auth Registration Error:", authError.message, authError);
        throw authError;
      }
      
      if (!authData.user) throw new Error("Registration failed: No user object returned.");

      // 2. Create user record in 'users' table
      const newUser: UserProfile = {
        id: authData.user.id,
        name: nameInput.trim(),
        isCurrentUser: true,
        records: generateInitialRecords(),
      };

      // We attempt to save to the database but don't block the user if the table isn't created yet
      const { error: dbError } = await supabase.from('users').insert([newUser]);
      if (dbError) {
        console.error("Leaderboard record could not be created:", dbError.message, dbError);
      }

      setCurrentUser(newUser);
      setNameInput(''); setPasswordInput('');
    } catch (err: any) {
      console.error("Registration Exception caught in App.tsx:", err.message, err);
      // Provide helpful guidance for the "Email signups are disabled" error
      if (err.message?.includes("disabled")) {
        setLoginError("Signups are disabled in your Supabase Dashboard (Auth -> Providers -> Email).");
      } else {
        setLoginError(err.message || 'Registration failed.');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: getEmailFromUsername(nameInput),
        password: passwordInput,
      });

      if (authError) {
        console.error("Supabase Auth Login Error:", authError.message, authError);
        throw authError;
      }
      
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!dbError && userData) {
        setCurrentUser(userData as UserProfile);
      } else {
        // Fallback if record missing from DB but auth works
        setCurrentUser({
          id: authData.user.id,
          name: nameInput,
          isCurrentUser: true,
          records: generateInitialRecords(),
        });
      }
      setNameInput(''); setPasswordInput('');
    } catch (err: any) {
      console.error("Login Exception caught in App.tsx:", err.message, err);
      setLoginError(err.message || 'Login failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout Error:", err);
    }
    setCurrentUser(null); setViewingUser(null); setActiveTab('dashboard');
  };

  const updateRecord = async (updatedRecord: DayRecord) => {
    if (!currentUser) return;
    const updatedRecords = currentUser.records.map(r => r.day === updatedRecord.day ? updatedRecord : r);
    setCurrentUser({ ...currentUser, records: updatedRecords });
    
    const { error } = await supabase
      .from('users')
      .update({ records: updatedRecords })
      .eq('id', currentUser.id);
    
    if (error) {
      console.error("Sync Error: Failed to update user record in database:", error.message, error);
    }
  };

  const calculateStats = (user: UserProfile) => {
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

  const sortedUsers = useMemo(() => {
    return [...allUsers]
      .map(user => ({ user, stats: calculateStats(user) }))
      .sort((a, b) => b.stats.overallProgress - a.stats.overallProgress);
  }, [allUsers, currentRamadanDay]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 min-h-screen flex flex-col items-center justify-center space-y-12">
        <Header />
        <div className="w-full max-w-md glass p-8 rounded-3xl border border-amber-500/30 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="flex bg-emerald-950/50 p-1 rounded-xl mb-6">
            <button onClick={() => { setAuthMode('register'); setLoginError(''); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'register' ? 'bg-amber-500 text-emerald-950 shadow-md' : 'text-emerald-400'}`}>Register</button>
            <button onClick={() => { setAuthMode('login'); setLoginError(''); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'login' ? 'bg-amber-500 text-emerald-950 shadow-md' : 'text-emerald-400'}`}>Log In</button>
          </div>
          <form onSubmit={authMode === 'register' ? handleCreateProfile : handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest px-2">Account Name</label>
              <input type="text" required value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="e.g. Abdullah" className="w-full bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-3 text-emerald-50 outline-none focus:border-amber-500 transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest px-2">Password</label>
              <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••••••" className="w-full bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-3 text-emerald-50 outline-none focus:border-amber-500 transition-all" />
            </div>
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2 animate-bounce">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs font-bold leading-tight">{loginError}</p>
              </div>
            )}
            <button type="submit" className="w-full py-4 bg-amber-500 text-emerald-950 font-black rounded-xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg active:scale-95">
              {authMode === 'register' ? <UserPlus size={20} /> : <Key size={20} />}
              {authMode === 'register' ? 'Join Globally' : 'Access Profile'}
            </button>
          </form>
        </div>
        <div className="flex flex-col items-center gap-4 py-8 border-t border-emerald-900/50 w-full max-w-md">
           <img src="https://placehold.co/120x120/022c22/fbbf24?text=AG&font=serif" alt="Atongko Group Logo" className="w-20 h-20 object-contain drop-shadow-[0_0_10px_rgba(251,191,36,0.3)] opacity-80" />
           <p className="text-amber-400 font-bold text-lg">Powered by Atongko Group</p>
        </div>
      </div>
    );
  }

  const currentStats = calculateStats(currentUser);

  return (
    <div className="max-w-6xl mx-auto pb-32 px-4 relative">
      {showReminder && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-lg animate-in fade-in slide-in-from-top-10 duration-500">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-emerald-950 p-4 sm:p-5 rounded-3xl flex items-center justify-between gap-4 shadow-2xl border-2 border-emerald-900/20">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-950 text-amber-500 p-2 rounded-2xl animate-bounce"><BellRing size={24} /></div>
              <p className="text-sm font-bold">আজকের আমলনামা কি পূর্ণ করেছেন? রিপোর্ট সাবমিট করুন।</p>
            </div>
            <button onClick={dismissReminder} className="p-2 hover:bg-emerald-950/10 rounded-full transition-colors"><X size={20} /></button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">{currentUser.name.charAt(0)}</div>
          <div className="flex flex-col">
            <span className="font-bold text-white leading-none">{currentUser.name}</span>
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold"><MapPin size={10} /> {locationOffset === 0 ? 'Chittagong' : `Local: ${locationOffset > 0 ? '+' : ''}${locationOffset}m`}</div>
               <div className={`flex items-center gap-1 text-[10px] ${isConnected ? 'text-emerald-500' : 'text-amber-500 sync-pulse'} font-bold`}>
                 {isConnected ? <CheckCircle size={10} /> : <Cloud size={10} />} {isConnected ? 'GLOBAL SYNC ACTIVE' : 'RECONNECTING...'}
               </div>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2.5 rounded-xl glass border-emerald-800 text-emerald-400 hover:text-white transition-all"><LogOut size={20} /></button>
      </div>

      <Header />

      {countdownInfo && (
        <div className="glass p-6 rounded-3xl border border-amber-500/20 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Timer size={100} className="text-amber-500" /></div>
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-amber-500 font-black uppercase tracking-[0.3em] text-[10px]">Current Status</h3>
            <p className="text-white text-2xl font-bold">Ramadan Day {currentRamadanDay}</p>
            <div className="flex gap-4 pt-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-emerald-500 font-bold uppercase">Seheri End</span>
                <span className="text-lg font-mono text-blue-300 font-bold">{countdownInfo.seheri.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-emerald-500 font-bold uppercase">Iftar Time</span>
                <span className="text-lg font-mono text-amber-500 font-bold">{countdownInfo.iftar.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
            <span className="text-emerald-400 font-black uppercase tracking-widest text-xs">{countdownInfo.label}</span>
            <div className="flex gap-2">
              {[ { val: countdownInfo.h, label: 'HRS' }, { val: countdownInfo.m, label: 'MIN' }, { val: countdownInfo.s, label: 'SEC' } ].map((t, idx) => (
                <div key={idx} className="flex flex-col items-center glass bg-emerald-950/80 px-4 py-3 rounded-2xl min-w-[70px] border border-amber-500/10">
                  <span className="text-3xl font-black text-amber-500 font-mono leading-none">{t.val.toString().padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="mt-8 space-y-8">
        <MotivationalSection />
        <div className="flex justify-center p-1.5 bg-emerald-950/90 glass rounded-2xl w-fit mx-auto sticky top-4 z-40 border border-amber-500/20 backdrop-blur-xl">
          <button onClick={() => { setActiveTab('dashboard'); setViewingUser(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeTab === 'dashboard' && !viewingUser ? 'bg-amber-500 text-emerald-950 font-black' : 'text-emerald-300 hover:text-white'}`}><LayoutDashboard size={20} /> <span className="hidden sm:inline">My Tracker</span></button>
          <button onClick={() => { setActiveTab('group'); setViewingUser(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeTab === 'group' || viewingUser ? 'bg-amber-500 text-emerald-950 font-black' : 'text-emerald-300 hover:text-white'}`}><Users size={20} /> <span className="hidden sm:inline">Leaderboard</span></button>
          <button onClick={() => { setActiveTab('schedule'); setViewingUser(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-amber-500 text-emerald-950 font-black' : 'text-emerald-300 hover:text-white'}`}><Clock size={20} /> <span className="hidden sm:inline">2026 Table</span></button>
        </div>

        {activeTab === 'dashboard' && !viewingUser && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Overall %', val: `${currentStats.overallProgress}%`, border: 'border-amber-500' },
                { label: 'Total Fasts', val: currentStats.totalFastings, border: 'border-blue-500' },
                { label: 'Prayers Done', val: currentStats.totalPrayers, border: 'border-emerald-500' },
                { label: 'Quran Pages', val: currentStats.totalPages, border: 'border-purple-500' }
              ].map((stat, i) => (
                <div key={i} className={`glass p-6 rounded-3xl border-b-4 ${stat.border}/30`}>
                  <span className="text-amber-500 text-[10px] font-black uppercase mb-2 block">{stat.label}</span>
                  <span className="text-4xl font-black text-white">{stat.val}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentUser.records.map(record => <DayCard key={record.day} record={record} onUpdate={updateRecord} />)}
            </div>
          </div>
        )}

        {activeTab === 'group' && !viewingUser && (
          <div className="glass rounded-3xl overflow-hidden border border-emerald-800/50 animate-in fade-in duration-500">
            <div className="p-6 bg-emerald-900/20 border-b border-emerald-800/50">
              <h2 className="text-xl font-black text-amber-400 flex items-center gap-2"><Trophy size={20} /> Global Leaders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-emerald-950/50 text-emerald-400 text-[10px] uppercase font-black">
                  <tr className="px-6 py-4">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4 text-center">Fasts</th>
                    <th className="px-6 py-4 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/50">
                  {sortedUsers.map(({ user, stats }, index) => (
                    <tr key={user.id} className="cursor-pointer hover:bg-emerald-900/30 transition-colors" onClick={() => setViewingUser(user)}>
                      <td className="px-6 py-5 font-black">#{index + 1}</td>
                      <td className="px-6 py-5 font-bold">{user.name}</td>
                      <td className="px-6 py-5 text-center">{stats.totalFastings}</td>
                      <td className="px-6 py-5 text-right font-black text-amber-500">{stats.overallProgress}%</td>
                    </tr>
                  ))}
                  {sortedUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-emerald-600 italic">No users found or table not yet active...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewingUser && (
          <div className="space-y-8 animate-in fade-in">
            <button onClick={() => setViewingUser(null)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-900/40 text-emerald-300 border border-emerald-800 transition-colors hover:text-amber-400"><ArrowLeft size={18} /> Back</button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {viewingUser.records.map(record => <DayCard key={record.day} record={record} onUpdate={() => {}} readOnly={true} />)}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="glass rounded-3xl overflow-hidden max-w-4xl mx-auto animate-in fade-in">
            <div className="p-8 bg-emerald-900/50 flex justify-between border-b border-amber-500/10">
              <h2 className="text-3xl font-black text-amber-400">Schedule</h2>
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
         <p className="text-emerald-700 text-[10px] font-bold uppercase mt-1">PostgreSQL + Supabase Realtime</p>
      </footer>
    </div>
  );
};

export default App;
