import React, { useState, useEffect } from 'react';
import Leaderboard from './components/Leaderboard';
import FighterPipeline from './components/FighterPipeline';
import PromoterDashboard from './components/PromoterDashboard';
import JudgePanel from './components/JudgePanel';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Onboarding from './components/Onboarding';
import AdminDashboard from './components/AdminDashboard';
import SettingsPanel from './components/SettingsPanel';
import { Fighter, Event, ScheduledBout, User } from './types';
import { 
  Trophy, 
  Swords, 
  User as UserIcon, 
  Sparkles, 
  ShieldAlert, 
  PlusCircle, 
  Layers,
  Sun,
  Moon,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';

export default function App() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [bouts, setBouts] = useState<ScheduledBout[]>([]);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'fighter' | 'promoter' | 'judge' | 'admin' | 'settings'>('leaderboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [judgeEventId, setJudgeEventId] = useState<string | null>(null);

  // Authentication State
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('truerank_auth_token');
    }
    return null;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentFighter, setCurrentFighter] = useState<Fighter | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return (localStorage.getItem('truerank_theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('truerank_theme', theme);
    }
  }, [theme]);

  // Promoter event creation states
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [newEventName, setNewEventName] = useState<string>('');
  const [newEventDate, setNewEventDate] = useState<string>('');
  const [newEventLocation, setNewEventLocation] = useState<string>('');
  const [eventCreateMsg, setEventCreateMsg] = useState<string | null>(null);

  // Fetch session data
  const fetchAuthMe = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': authToken }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setCurrentFighter(data.fighter);
        
        // Auto-switch tabs to their primary persona view on boot
        if (data.user.onboarded) {
          if (data.user.role === 'JUDGE') {
            setActiveTab('judge');
          } else if (data.user.role === 'PROMOTER') {
            setActiveTab('promoter');
          } else if (data.user.role === 'FIGHTER') {
            setActiveTab('fighter');
          } else {
            setActiveTab('leaderboard');
          }
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Session sync error:', err);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch all fighters
      const fightersRes = await fetch(`/api/fighters?t=${Date.now()}`);
      if (fightersRes.ok) {
        const fData = await fightersRes.json();
        setFighters(fData);
      }

      // Fetch all events & running orders
      const eventsRes = await fetch(`/api/events?t=${Date.now()}`);
      if (eventsRes.ok) {
        const evData = await eventsRes.json();
        setEvents(evData);

        const allBouts: ScheduledBout[] = [];
        for (const ev of evData) {
          const detailRes = await fetch(`/api/events/${ev.id}?t=${Date.now()}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            allBouts.push(...(detailData.bouts || []));
          }
        }
        setBouts(allBouts);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error synchronizing with TrueRank DB');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    if (token) {
      fetchAuthMe(token);
    }
    
    // Parse invite link scenarios
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const invite = params.get('invite');
      const eventId = params.get('eventId');
      if (invite === 'judge' && eventId) {
        setJudgeEventId(eventId);
        setAuthModalMode('login'); // Ask them to login or register first
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [token]);

  const handleAuthSuccess = (newToken: string, authenticatedUser: any) => {
    setToken(newToken);
    setCurrentUser(authenticatedUser);
    setAuthModalMode(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('truerank_auth_token', newToken);
    }
    if (authenticatedUser.onboarded) {
      fetchAuthMe(newToken);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setCurrentFighter(null);
    setActiveTab('leaderboard');
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('truerank_auth_token');
    }
  };

  const handleOnboardingComplete = (userObj: any, fighterObj: any) => {
    setCurrentUser(userObj);
    setCurrentFighter(fighterObj);
    loadAllData();
    if (userObj.role === 'JUDGE') {
      setActiveTab('judge');
    } else if (userObj.role === 'PROMOTER') {
      setActiveTab('promoter');
    } else {
      setActiveTab('fighter');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName || !newEventDate || !newEventLocation) return;

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEventName,
          date: newEventDate,
          location: newEventLocation,
          promoterId: currentUser?.id || 'u-1',
        }),
      });

      if (res.ok) {
        setEventCreateMsg('✓ Event generated following Global Date Standardization rules!');
        setNewEventName('');
        setNewEventDate('');
        setNewEventLocation('');
        setShowEventForm(false);
        await loadAllData();
        setTimeout(() => setEventCreateMsg(null), 4000);
      } else {
        const err = await res.json();
        setEventCreateMsg(`Error: ${err.error}`);
      }
    } catch (err: any) {
      setEventCreateMsg(`Network Error: ${err.message}`);
    }
  };

  // View Guards
  const showLeaderboardTab = currentUser?.role !== 'JUDGE';
  const showFighterTab = currentUser?.role === 'FIGHTER' || currentUser?.role === 'ADMIN';
  const showPromoterTab = currentUser?.role === 'PROMOTER' || currentUser?.role === 'ADMIN';
  const showJudgeTab = currentUser?.role === 'JUDGE' || currentUser?.role === 'ADMIN';
  const showAdminTab = currentUser?.role === 'ADMIN';

  // 1. If not authenticated, render the Landing Page
  if (!token) {
    return (
      <>
        <LandingPage onOpenAuth={setAuthModalMode} />
        {authModalMode && (
          <AuthModal 
            initialMode={authModalMode}
            onClose={() => setAuthModalMode(null)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </>
    );
  }

  // 2. If authenticated but profile is not loaded yet
  if (token && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Syncing User Credentials...</p>
      </div>
    );
  }

  // 3. If authenticated but has not onboarded their persona yet
  if (currentUser && !currentUser.onboarded) {
    return (
      <Onboarding 
        token={token}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // 4. Fully Authenticated and Onboarded - Render Dashboard Shell
  return (
    <div className="min-h-screen bg-[#1c1b21] text-slate-100 flex font-sans selection:bg-rose-900/30 selection:text-rose-200">
      
      {/* Fixed Left Vertical Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-[#131316] border-r border-[#1c1c22] flex flex-col z-30">
        {/* Brand Section inside Sidebar */}
        <div className="h-20 flex items-center px-6 border-b border-[#1c1c22] select-none bg-[#131316]">
          <div className="flex items-center gap-3">
            {/* TR Logo crimson box */}
            <div className="h-9 w-9 bg-rose-800 flex items-center justify-center border border-rose-600 rounded-lg shadow-md shrink-0">
              <Swords className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1 leading-none">
                <span className="font-extrabold text-sm tracking-wider text-white font-sans uppercase">
                  True<span className="text-rose-500">Rank</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider mt-1">
                Prestige Matchmaking Core
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {showLeaderboardTab && (
            <button
              onClick={() => setActiveTab('leaderboard')}
              id="tab-leaderboard"
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded text-xs font-bold tracking-wider transition uppercase text-left cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-[#431928] text-white border-l-2 border-rose-500 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
              }`}
            >
              <Trophy className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              <span>Public Leaderboard</span>
            </button>
          )}

          {showFighterTab && (
            <button
              onClick={() => setActiveTab('fighter')}
              id="tab-fighter"
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded text-xs font-bold tracking-wider transition uppercase text-left cursor-pointer ${
                activeTab === 'fighter'
                  ? 'bg-[#431928] text-white border-l-2 border-rose-500 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
              }`}
            >
              <UserIcon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              <span>Fighter Passport</span>
            </button>
          )}

          {showPromoterTab && (
            <button
              onClick={() => setActiveTab('promoter')}
              id="tab-promoter"
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded text-xs font-bold tracking-wider transition uppercase text-left cursor-pointer ${
                activeTab === 'promoter'
                  ? 'bg-[#431928] text-white border-l-2 border-rose-500 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              <span>Promoter Cockpit</span>
            </button>
          )}

          {showJudgeTab && (
            <button
              onClick={() => setActiveTab('judge')}
              id="tab-judge"
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded text-xs font-bold tracking-wider transition uppercase text-left cursor-pointer ${
                activeTab === 'judge'
                  ? 'bg-[#431928] text-white border-l-2 border-rose-500 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
              }`}
            >
              <Swords className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              <span>Scoring Officials</span>
            </button>
          )}

          {showAdminTab && (
            <button
              onClick={() => setActiveTab('admin')}
              id="tab-admin"
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded text-xs font-bold tracking-wider transition uppercase text-left cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#431928] text-white border-l-2 border-rose-500 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              <span>Admin Cockpit</span>
            </button>
          )}
        </nav>

        {/* User profile details at bottom of sidebar */}
        <div className="relative border-t border-[#1c1c22] bg-[#131316]/55 select-none shrink-0">
          {/* Dropdown Menu Overlay */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1c1b21] border border-[#2a2930] p-1.5 shadow-xl space-y-1 z-40 rounded">
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setShowProfileMenu(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold rounded cursor-pointer transition ${
                  activeTab === 'settings' 
                    ? 'bg-[#431928] text-white' 
                    : 'text-slate-350 hover:bg-slate-900/60 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Account Settings</span>
              </button>
              
              <button
                onClick={() => {
                  handleLogout();
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold rounded cursor-pointer transition text-rose-400 hover:bg-rose-950/20 hover:text-rose-300"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400/80" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Profile Clickable Row */}
          <div 
            onClick={() => setShowProfileMenu(prev => !prev)}
            className="p-4 flex items-center justify-between hover:bg-[#1a1a20] transition cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              {/* Avatar circle */}
              <div className="w-8 h-8 rounded-full bg-rose-950/40 border border-rose-800 flex items-center justify-center font-display text-xs font-bold text-rose-450 uppercase shrink-0">
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="text-left leading-none">
                <span className="block text-xs font-bold text-white">Profile</span>
                <span className="block text-[8.5px] font-mono text-slate-550 uppercase tracking-wider mt-1">
                  {currentUser.role === 'ADMIN' ? 'Chief Commissioner' : currentUser.role}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-550 shrink-0 transform transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-grow pl-64 flex flex-col min-h-screen">
        
        {/* Minimalist Top Header */}
        <header className="sticky top-0 z-20 h-20 flex items-center justify-end px-8 select-none bg-[#1c1b21]/80 backdrop-blur-md">
          {/* Header Widgets on Right */}
          <div className="flex items-center gap-3.5">
            {/* Arena Live Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-950/20 border border-red-500/20 text-red-400 font-mono text-[9px] font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Arena Live</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow px-8 pb-12 max-w-6xl w-full mx-auto space-y-6">
          
          {loading && fighters.length === 0 && (
            <div className="py-24 text-center space-y-4">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Syncing Arena State Engine...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-3 text-xs leading-relaxed max-w-2xl mx-auto shadow-md">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
              <div>
                <strong className="block font-semibold">Decentralized ID Synchronization Fail</strong>
                <span>Check that the backend tsx environment has completed booting.</span>
              </div>
            </div>
          )}

          {!loading || fighters.length > 0 ? (
            <div className="animate-fadeIn">
              
              {/* 1. PUBLIC LEADERBOARD VIEW */}
              {activeTab === 'leaderboard' && showLeaderboardTab && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-purple-400" />
                      TrueRank Standings Ticker
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Real-time Stock Ticker interface for decentralized fighter ELO standings.
                    </p>
                  </div>
                  <Leaderboard
                    fighters={fighters}
                    onSelectFighter={(fid) => {
                      const selected = fighters.find(f => f.id === fid);
                      if (selected && showFighterTab) {
                        setActiveTab('fighter');
                      }
                    }}
                  />
                </div>
              )}

              {/* 2. MY FIGHTER PASSPORT */}
              {activeTab === 'fighter' && showFighterTab && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-purple-400" />
                      <span>Fighter Identity Passport</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Decentralized credentials with multi-sport ELO records.
                    </p>
                  </div>
                  {currentFighter ? (
                    <FighterPipeline 
                      fighter={currentFighter} 
                      events={events}
                      onRefreshFighters={loadAllData}
                    />
                  ) : (
                    <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded max-w-xl mx-auto space-y-3 animate-fadeIn">
                      <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-350 font-mono">Could not resolve authenticated TrueRank Fighter Profile.</p>
                      <button onClick={loadAllData} className="px-4 py-2 font-bold text-xs bg-purple-700 text-purple-50 rounded cursor-pointer">Retry Authentication Sync</button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. PROMOTER DASHBOARD PANEL */}
              {activeTab === 'promoter' && showPromoterTab && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-purple-400" />
                        <span>Promoter Cockpit</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Sanction official events, manage tournament brackets, and submit results.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowEventForm(prev => !prev)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-655 hover:to-indigo-650 text-xs font-bold text-white shadow flex items-center gap-1.5 cursor-pointer rounded"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Configure Card</span>
                    </button>
                  </div>

                  {showEventForm && (
                    <form onSubmit={handleCreateEvent} className="bg-slate-900 border border-slate-800 p-6 rounded space-y-4 max-w-2xl animate-fadeIn">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-purple-400">Configure Event Card</h3>
                      <span className="text-[10px] font-bold font-mono text-purple-400 uppercase tracking-widest block">
                        Global Date Standardization Rule Enforced
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-mono">Event Name</label>
                          <input
                            type="text"
                            required
                            value={newEventName}
                            onChange={(e) => setNewEventName(e.target.value)}
                            placeholder="TrueRank Arena: Fight Night"
                            className="w-full text-xs p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 animate-fadeIn"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-mono">Location / Gym</label>
                          <input
                            type="text"
                            required
                            value={newEventLocation}
                            onChange={(e) => setNewEventLocation(e.target.value)}
                            placeholder="Las Vegas, NV"
                            className="w-full text-xs p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 animate-fadeIn"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold font-mono">Date & Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className="w-full text-xs p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-mono animate-fadeIn"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowEventForm(false)}
                          className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold rounded bg-purple-700 text-white shadow-md hover:bg-purple-650"
                        >
                          Publish Event
                        </button>
                      </div>
                    </form>
                  )}

                  {eventCreateMsg && (
                    <div className="p-3.5 bg-purple-950/40 border border-purple-500/20 rounded text-xs text-purple-300 max-w-xl">
                      {eventCreateMsg}
                    </div>
                  )}

                  <PromoterDashboard
                    events={events}
                    fighters={fighters}
                    bouts={bouts}
                    onRefreshData={loadAllData}
                  />
                </div>
              )}

              {/* 4. SCORING OFFICIALS PANEL */}
              {activeTab === 'judge' && showJudgeTab && (
                <JudgePanel
                  events={events}
                  bouts={bouts}
                  fighters={fighters}
                  onRefresh={loadAllData}
                  inviteEventId={judgeEventId}
                />
              )}

              {/* 5. ADMIN COCKPIT */}
              {activeTab === 'admin' && showAdminTab && (
                <AdminDashboard onRefreshData={loadAllData} />
              )}

              {/* 6. ACCOUNT SETTINGS */}
              {activeTab === 'settings' && (
                <SettingsPanel currentUser={currentUser} />
              )}

            </div>
          ) : null}

        </main>

        {/* Footer */}
        <footer className="bg-slate-950 py-8 border-t border-slate-900 mt-16 text-center text-xs font-mono text-slate-650 select-none">
          <div className="max-w-6xl mx-auto px-4 space-y-2">
            <p>© 2026 TrueRank Arena. Deep midnight performance frameworks.</p>
            <p className="text-[10px] text-slate-700 max-w-lg mx-auto leading-relaxed">
              All fighter passports are standalone in compliance with decentralized identity standards.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
