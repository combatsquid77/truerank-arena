import React, { useState, useEffect } from 'react';
import Leaderboard from './components/Leaderboard';
import FighterPipeline from './components/FighterPipeline';
import PromoterDashboard from './components/PromoterDashboard';
import JudgePanel from './components/JudgePanel';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Onboarding from './components/Onboarding';
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
  LogOut
} from 'lucide-react';

export default function App() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [bouts, setBouts] = useState<ScheduledBout[]>([]);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'fighter' | 'promoter' | 'judge'>('leaderboard');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600/30 selection:text-purple-200">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-700 flex items-center justify-center border border-purple-500 shadow-md shadow-purple-900/30">
              <Swords className="w-5 h-5 text-purple-50" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-100 font-sans uppercase">
                  True<span className="text-purple-500 text-sm">Rank</span>
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              </div>
              <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-mono">
                Prestige Matchmaking Core
              </span>
            </div>
          </div>

          {/* Role-Guarded Navigation */}
          <nav className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-900">
            {showLeaderboardTab && (
              <button
                onClick={() => setActiveTab('leaderboard')}
                id="tab-leaderboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'leaderboard'
                    ? 'bg-purple-700 text-purple-50 shadow-md border border-purple-500'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Public Leaderboard</span>
              </button>
            )}

            {showFighterTab && (
              <button
                onClick={() => setActiveTab('fighter')}
                id="tab-fighter"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'fighter'
                    ? 'bg-purple-700 text-purple-50 shadow-md border border-purple-500'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Fighter Passport</span>
              </button>
            )}

            {showPromoterTab && (
              <button
                onClick={() => setActiveTab('promoter')}
                id="tab-promoter"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'promoter'
                    ? 'bg-purple-700 text-purple-50 shadow-md border border-purple-500'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Promoter Cockpit</span>
              </button>
            )}

            {showJudgeTab && (
              <button
                onClick={() => setActiveTab('judge')}
                id="tab-judge"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'judge'
                    ? 'bg-amber-600 text-amber-50 shadow-md border border-amber-400'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Scoring Officials</span>
              </button>
            )}
          </nav>

          {/* User Widget */}
          <div className="flex items-center gap-4">
            
            {/* Theme Switcher */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center p-2 rounded-lg bg-slate-900/65 hover:bg-slate-900 border border-slate-800 text-purple-500 hover:text-purple-400 font-sans text-xs transition-all shadow-sm cursor-pointer"
              title="Toggle Theme"
              id="theme-switcher-toggle"
            >
              {theme === 'dark' ? (
                <div className="flex items-center gap-2 font-mono text-[9px] font-bold tracking-wider uppercase text-purple-400">
                  <Sun className="w-3 h-3" />
                  <span>DARK</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 font-mono text-[9px] font-bold tracking-wider uppercase text-purple-600">
                  <Moon className="w-3 h-3" />
                  <span>LIGHT</span>
                </div>
              )}
            </button>

            {/* Profile & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800/80">
              <div className="text-right">
                <span className="block text-xs font-bold text-slate-200">{currentUser.name}</span>
                <span className="block text-[8.5px] font-mono text-purple-400 uppercase tracking-widest">{currentUser.role}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-450 hover:text-white transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {loading && fighters.length === 0 && (
          <div className="py-24 text-center space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Syncing Arena State Engine...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-3 text-xs leading-relaxed max-w-2xl mx-auto shadow-md">
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
                    TrueRank Public Division Standings
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Display of decentralized fighter passports computed in real-time. #1 ranked athletes override cards with luxury champion flairs.
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
                  <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-purple-400" />
                    My Live Fighter Passport
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Review pending applications, active tournament placements, and locked card fights in compliance with cached circumvent pipelines.
                  </p>
                </div>
                {currentFighter ? (
                  <FighterPipeline 
                    fighter={currentFighter} 
                    events={events}
                    onRefreshFighters={loadAllData}
                  />
                ) : (
                  <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded-xl max-w-xl mx-auto space-y-3">
                    <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-350">Could not resolve authenticated TrueRank Fighter Profile.</p>
                    <button onClick={loadAllData} className="px-4 py-2 font-bold text-xs bg-purple-700 text-purple-50 rounded">Retry Authentication Sync</button>
                  </div>
                )}
              </div>
            )}

            {/* 3. PROMOTER COCKPIT & LIVE CARD BUILDER */}
            {activeTab === 'promoter' && showPromoterTab && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-400" />
                      TrueRank Creator Board
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage Arena layouts, organize fight rosters, execute batch imports, and print social running orders.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowEventForm(!showEventForm)}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-purple-500 flex items-center gap-2 transition-all shrink-0"
                  >
                    <PlusCircle className="w-4 h-4 text-purple-400" />
                    Generate New Tournament
                  </button>
                </div>

                {showEventForm && (
                  <form onSubmit={handleCreateEvent} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-xl space-y-4 animate-slideDown">
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
                  <div className="p-3.5 bg-purple-950/40 border border-purple-500/20 rounded-xl text-xs text-purple-300 max-w-xl">
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

          </div>
        ) : null}

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 py-10 border-t border-slate-900/60 mt-16 text-center text-xs font-mono text-slate-650">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 TrueRank Arena. Deep midnight performance frameworks.</p>
          <p className="text-[10px] text-slate-700 max-w-lg mx-auto leading-relaxed">
            All fighter passports are standalone in compliance with decentralized identity standards.
          </p>
        </div>
      </footer>
    </div>
  );
}
