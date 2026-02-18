
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MotivationalSection from './components/MotivationalSection';
import DayCard from './components/DayCard';
import { DayRecord, UserProfile } from './types';
import { generateInitialRecords, RAMADAN_SCHEDULE } from './constants';
import { Calendar, Users, LayoutDashboard, Clock, Info, BellRing, LogOut, UserPlus, Key, ArrowLeft, Eye } from 'lucide-react';

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
  
  // Detailed view state for Group Report
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);

  const [showReminder, setShowReminder] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('ramadan_all_users', JSON.stringify(allUsers));
    if (currentUser) {
      localStorage.setItem('ramadan_current_user_id', currentUser.id);
    } else {
      localStorage.removeItem('ramadan_current_user_id');
    }
  }, [allUsers, currentUser]);

  // Reminder Logic
  useEffect(() => {
    const checkReminder = () => {
      const now = new Date();
      if (now.getHours() >= 23 || (now.getHours() === 22 && now.getMinutes() >= 55)) {
        setShowReminder(true);
      }
    };
    checkReminder();
    const timer = setInterval(checkReminder, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !passwordInput.trim()) return;

    // Check if user already exists
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
      u.name.toLowerCase() === nameInput.toLowerCase() && 
      u.password === passwordInput
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
    return { totalFastings, totalPages, totalPrayers };
  };

  // Auth Screen
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 min-h-screen flex flex-col items-center justify-center space-y-12">
        <Header />
        <div className="w-full max-w-md glass p-8 rounded-3xl border border-amber-500/30 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="flex bg-emerald-950/50 p-1 rounded-xl mb-6">
            <button 
              onClick={() => { setAuthMode('register'); setLoginError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'register' ? 'bg-amber-500 text-emerald-950 shadow-lg' : 'text-emerald-400'}`}
            >
              Create Account
            </button>
            <button 
              onClick={() => { setAuthMode('login'); setLoginError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'login' ? 'bg-amber-500 text-emerald-950 shadow-lg' : 'text-emerald-400'}`}
            >
              Log In
            </button>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-amber-400">
              {authMode === 'register' ? 'Join the Group' : 'Welcome Back'}
            </h2>
            <p className="text-emerald-300/70 text-sm">
              {authMode === 'register' ? 'Secure your deeds with a name and password.' : 'Enter your credentials to access your dashboard.'}
            </p>
          </div>

          <form onSubmit={authMode === 'register' ? handleCreateProfile : handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">User Name</label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Arif Ahmed"
                className="w-full bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-3 text-emerald-50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-emerald-950/50 border border-emerald-800 rounded-xl pl-11 pr-4 py-3 text-emerald-50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                />
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
              </div>
            </div>

            {loginError && <p className="text-red-400 text-xs font-medium text-center">{loginError}</p>}

            <button
              type="submit"
              className="w-full py-4 bg-amber-500 text-emerald-950 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
            >
              {authMode === 'register' ? <UserPlus size={20} /> : <Key size={20} />}
              {authMode === 'register' ? 'Start My Journey' : 'Access My Tracker'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentStats = calculateStats(currentUser);

  return (
    <div className="max-w-6xl mx-auto pb-32 px-4 relative">
      <div className="flex justify-between items-center pt-4">
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-emerald-950 flex items-center justify-center font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <span className="font-semibold">{currentUser.name}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass border-emerald-800 text-emerald-300 hover:text-white hover:border-amber-500/50 transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      <Header />
      
      {showReminder && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce cursor-pointer" onClick={() => setShowReminder(false)}>
          <div className="bg-amber-500 text-emerald-950 px-6 py-3 rounded-full flex items-center gap-3 font-bold shadow-2xl border-2 border-emerald-900">
            <BellRing size={20} />
            নিশীথ ঘন্টা (11:00 PM): আজকের আমলনামা পূর্ণ করেছেন কি?
          </div>
        </div>
      )}

      <main className="mt-8 space-y-8">
        <MotivationalSection />

        <div className="flex justify-center p-1 bg-emerald-950/80 glass rounded-2xl w-fit mx-auto sticky top-4 z-40 border border-amber-500/20 shadow-2xl">
          <button 
            onClick={() => { setActiveTab('dashboard'); setViewingUser(null); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${activeTab === 'dashboard' && !viewingUser ? 'bg-amber-500 text-emerald-950 font-bold shadow-lg' : 'text-emerald-300 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span className="hidden sm:inline">My Dashboard</span>
          </button>
          <button 
            onClick={() => { setActiveTab('group'); setViewingUser(null); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${activeTab === 'group' || viewingUser ? 'bg-amber-500 text-emerald-950 font-bold shadow-lg' : 'text-emerald-300 hover:text-white'}`}
          >
            <Users size={20} />
            <span className="hidden sm:inline">Group Report</span>
          </button>
          <button 
            onClick={() => { setActiveTab('schedule'); setViewingUser(null); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-amber-500 text-emerald-950 font-bold shadow-lg' : 'text-emerald-300 hover:text-white'}`}
          >
            <Clock size={20} />
            <span className="hidden sm:inline">2026 Schedule</span>
          </button>
        </div>

        {activeTab === 'dashboard' && !viewingUser && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass p-6 rounded-2xl border-b-2 border-amber-500/30 flex flex-col items-center">
                <span className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">Total Fastings</span>
                <span className="text-4xl font-bold text-white">{currentStats.totalFastings}</span>
              </div>
              <div className="glass p-6 rounded-2xl border-b-2 border-emerald-500/30 flex flex-col items-center">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Total Prayers</span>
                <span className="text-4xl font-bold text-white">{currentStats.totalPrayers}</span>
              </div>
              <div className="glass p-6 rounded-2xl border-b-2 border-blue-500/30 flex flex-col items-center">
                <span className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Quran Pages</span>
                <span className="text-4xl font-bold text-white">{currentStats.totalPages}</span>
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
                <h2 className="text-xl font-bold text-amber-400">Accountability Wall</h2>
                <p className="text-sm text-emerald-400">Click on a member's name to see their detailed daily report.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-emerald-950/50 text-emerald-300 text-xs uppercase tracking-tighter">
                      <th className="px-6 py-4">Participant</th>
                      <th className="px-6 py-4 text-center">Total Fasts</th>
                      <th className="px-6 py-4 text-center">Total Prayers</th>
                      <th className="px-6 py-4 text-center">Quran (Total)</th>
                      <th className="px-6 py-4 text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/50">
                    {allUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-emerald-500/50 italic">No members yet...</td>
                      </tr>
                    ) : (
                      allUsers.map((user) => {
                        const userStats = calculateStats(user);
                        const progress = Math.round((userStats.totalFastings / 30) * 100);
                        return (
                          <tr 
                            key={user.id} 
                            className={`group cursor-pointer ${user.id === currentUser.id ? 'bg-amber-500/10' : ''} hover:bg-emerald-900/30 transition-colors`}
                            onClick={() => setViewingUser(user)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${user.id === currentUser.id ? 'bg-amber-500 text-emerald-950' : 'bg-emerald-800 text-emerald-100'}`}>
                                  {user.name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-emerald-100 group-hover:text-amber-400 transition-colors">
                                    {user.name} 
                                    {user.id === currentUser.id && <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-500 ml-1">YOU</span>}
                                  </span>
                                  <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                                    <Eye size={10} /> View Report
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center text-emerald-50 font-medium">
                              {userStats.totalFastings}
                            </td>
                            <td className="px-6 py-4 text-center text-emerald-300">
                              {userStats.totalPrayers}
                            </td>
                            <td className="px-6 py-4 text-center text-blue-300">
                              {userStats.totalPages} <span className="text-[10px] text-emerald-500">pages</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex flex-col items-end gap-1">
                                <div className="w-24 h-1.5 bg-emerald-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-amber-500">{progress}% Done</span>
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
            <div className="mt-8 flex items-center gap-3 p-4 bg-emerald-900/30 border border-emerald-500/20 rounded-2xl text-emerald-300 text-sm italic">
              <Info size={18} className="text-amber-500" />
              Note: This is an accountability group. You can only edit your own dashboard records.
            </div>
          </div>
        )}

        {/* Detailed Viewing State */}
        {viewingUser && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setViewingUser(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-900/40 text-emerald-300 hover:text-amber-400 transition-all border border-emerald-800"
              >
                <ArrowLeft size={18} />
                Back to List
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-amber-400">{viewingUser.name}'s Report</h2>
                <p className="text-xs text-emerald-500 uppercase font-bold tracking-widest">Read-Only View</p>
              </div>
              <div className="w-24"></div> {/* Spacer */}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(() => {
                const stats = calculateStats(viewingUser);
                return (
                  <>
                    <div className="glass p-4 rounded-2xl border-b-2 border-amber-500/30 flex flex-col items-center">
                      <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest">Fasts</span>
                      <span className="text-2xl font-bold text-white">{stats.totalFastings}</span>
                    </div>
                    <div className="glass p-4 rounded-2xl border-b-2 border-emerald-500/30 flex flex-col items-center">
                      <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Prayers</span>
                      <span className="text-2xl font-bold text-white">{stats.totalPrayers}</span>
                    </div>
                    <div className="glass p-4 rounded-2xl border-b-2 border-blue-500/30 flex flex-col items-center">
                      <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Quran</span>
                      <span className="text-2xl font-bold text-white">{stats.totalPages}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {viewingUser.records.map(record => (
                <DayCard 
                  key={record.day} 
                  record={record} 
                  onUpdate={() => {}} // No update for read-only
                  readOnly={true} 
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && !viewingUser && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <div className="glass rounded-3xl overflow-hidden border border-amber-500/20">
              <div className="p-8 bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 flex items-center justify-between border-b border-amber-500/20">
                <div>
                  <h2 className="text-3xl font-bold text-amber-400">Ramadan 2026</h2>
                  <p className="text-emerald-300">Timings for Dhaka, Bangladesh & surrounding areas</p>
                </div>
                <Calendar className="text-amber-400/20" size={60} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-emerald-950 text-amber-400/80 text-xs font-bold uppercase tracking-widest">
                      <th className="px-8 py-4">Ramadan</th>
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4 bg-emerald-900/20 text-center">Seheri (Last Time)</th>
                      <th className="px-8 py-4 bg-amber-500/10 text-center">Iftar (Start Time)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-800/50">
                    {RAMADAN_SCHEDULE.map((item) => (
                      <tr key={item.day} className="hover:bg-emerald-900/20 transition-colors">
                        <td className="px-8 py-5 font-bold text-emerald-100">Day {item.day}</td>
                        <td className="px-8 py-5 text-emerald-300/80">{item.date}</td>
                        <td className="px-8 py-5 bg-emerald-900/10 text-center text-lg font-mono font-bold text-blue-300">
                          {item.seheri}
                        </td>
                        <td className="px-8 py-5 bg-amber-500/5 text-center text-lg font-mono font-bold text-amber-400">
                          {item.iftar}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 pt-10 border-t border-emerald-900/50 text-center text-emerald-500 text-sm space-y-4">
        <div className="flex justify-center gap-6">
          <div className="flex flex-col items-center">
             <span className="text-amber-500 font-bold text-lg">2026</span>
             <span className="uppercase text-[10px] tracking-widest">Year of Barakah</span>
          </div>
        </div>
        <p className="max-w-md mx-auto opacity-60">
          This digital tracker is built to help you stay consistent with your Ibadah. 
          Only you can edit your personal data. Keep your password safe.
        </p>
        <div className="pb-10 font-arabic text-xl text-amber-500/40">رمضان مبارক</div>
      </footer>
    </div>
  );
};

export default App;
