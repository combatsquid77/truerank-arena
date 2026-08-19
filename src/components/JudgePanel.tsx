import React, { useState, useEffect } from 'react';
import { Event, ScheduledBout, Fighter } from '../types';
import { Swords, CheckCircle2, ShieldAlert, Users, Award, Star, Clock } from 'lucide-react';

interface JudgePanelProps {
  events: Event[];
  bouts: ScheduledBout[];
  fighters: Fighter[];
  onRefresh: () => void;
  inviteEventId: string | null;
}

export default function JudgePanel({ events, bouts, fighters, onRefresh, inviteEventId }: JudgePanelProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [winnerId, setWinnerId] = useState<string>('');
  const [method, setMethod] = useState<string>('Decision');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync selected event ID on load or when inviteEventId changes
  useEffect(() => {
    if (inviteEventId) {
      setSelectedEventId(inviteEventId);
    } else if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [inviteEventId, events]);

  const currentEvent = events.find((e) => e.id === selectedEventId);
  const currentEventBouts = bouts
    .filter((b) => b.eventId === selectedEventId)
    .sort((a, b) => a.boutOrder - b.boutOrder);

  // Find the first uncompleted bout in the running order
  const activeBout = currentEventBouts.find((b) => !b.completed);
  const completedBouts = currentEventBouts.filter((b) => b.completed);

  // Get details of Red and Blue fighters for the active bout
  const redFighter = activeBout ? fighters.find((f) => f.id === activeBout.fighterRedId) : null;
  const blueFighter = activeBout ? fighters.find((f) => f.id === activeBout.fighterBlueId) : null;

  const handleSubmitResult = async () => {
    if (!currentEvent || !activeBout || !winnerId) return;

    setSubmitting(true);
    setMsg(null);

    try {
      const token = localStorage.getItem('truerank_auth_token') || '';
      const res = await fetch(`/api/events/${currentEvent.id}/bouts/${activeBout.id}/result`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          winnerId,
          method,
        }),
      });

      if (res.ok) {
        setMsg({ type: 'success', text: 'Official scoring result submitted successfully! Rankings updated.' });
        setWinnerId('');
        onRefresh();
      } else {
        const errData = await res.json();
        setMsg({ type: 'error', text: errData.error || 'Failed to submit result.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Network error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getFighterName = (id: string) => fighters.find((f) => f.id === id)?.name || 'Unknown Fighter';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-500" />
            Official Scoring Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit verified fight night results. All Elo adjustments and walkout times recalculate immediately.
          </p>
        </div>

        {/* Dropdown Selector */}
        {!inviteEventId && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 px-3 rounded-lg font-mono text-xs max-w-sm">
            <span className="text-slate-500 font-bold uppercase shrink-0">Selected Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setWinnerId('');
                setMsg(null);
              }}
              className="bg-transparent border-none text-purple-400 font-bold focus:outline-none cursor-pointer focus:ring-transparent text-xs p-0 w-full"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id} className="bg-slate-950 text-slate-100">
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {currentEvent ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Scoring Cockpit */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Event status info card */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200">{currentEvent.name}</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  📍 {currentEvent.location} &bull; 📅 {new Date(currentEvent.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                {currentEvent.started ? (
                  <span className="px-2.5 py-1 text-[10px] font-bold font-mono tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full animate-pulse">
                    ⚡ FIGHT NIGHT LIVE
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-bold font-mono tracking-wider bg-slate-950 text-slate-500 border border-slate-850 rounded-full">
                    ⏳ NOT STARTED
                  </span>
                )}
              </div>
            </div>

            {/* If event hasn't started */}
            {!currentEvent.started ? (
              <div className="p-12 text-center bg-slate-900/30 border border-slate-850 rounded-2xl space-y-4">
                <div className="h-16 w-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-2xl shadow-inner">
                  ⏳
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-250 uppercase tracking-wide font-mono">
                    Scoring Controls Locked
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    This tournament card has not officially started. Once the promoter launches "Start Fight Night" from the Promoter Cockpit, scoring features will become active.
                  </p>
                </div>
              </div>
            ) : !activeBout ? (
              /* All bouts completed screen */
              <div className="p-12 text-center bg-slate-900/30 border border-slate-850 rounded-2xl space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-inner">
                  🏆
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-255 uppercase tracking-wide font-mono">
                    Event Completed
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    All scheduled bouts for this fight card have been officially scored. Final standings are updated and reflected on the global leaderboards.
                  </p>
                </div>
              </div>
            ) : (
              /* Active Bout Scoring Interface */
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                
                {/* Active Match Heading */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase">
                      Active Scoring Bracket
                    </span>
                    <h2 className="text-sm font-black text-slate-200 mt-1 uppercase tracking-tight">
                      Bout #{activeBout.boutOrder + 1} &mdash; {activeBout.sport} {activeBout.weightClass}
                    </h2>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-black font-mono tracking-wide ${
                    activeBout.cardType === 'TITLE' 
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.25)]' 
                      : activeBout.cardType === 'MAIN' 
                      ? 'bg-purple-900/40 text-purple-300 border border-purple-800/40' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {activeBout.cardType === 'TITLE' ? '👑 TITLE FIGHT' : activeBout.cardType === 'MAIN' ? '🏆 MAIN CARD' : 'UNDERCARD'}
                  </span>
                </div>

                {/* Tactile Winner buttons */}
                <div className="space-y-3">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono block">
                    Choose Winner
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    
                    {/* RED Corner Button */}
                    <button
                      onClick={() => setWinnerId(activeBout.fighterRedId)}
                      className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between relative overflow-hidden group cursor-pointer ${
                        winnerId === activeBout.fighterRedId
                          ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/30'
                          : 'bg-slate-950 border-slate-850 hover:border-red-500/50'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-[9.5px] font-mono font-bold text-red-400 uppercase tracking-widest">
                          Red Corner
                        </span>
                        {winnerId === activeBout.fighterRedId && (
                          <CheckCircle2 className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-bold text-slate-200">{redFighter?.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">🛡️ {redFighter?.gym || 'Independent'}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] border-t border-slate-900/60 pt-2 w-full text-slate-400">
                        <span>Current Rating:</span>
                        <span className="font-mono text-red-400 font-bold">
                          {activeBout.sport === 'MMA' ? redFighter?.mmaElo : activeBout.sport === 'BJJ' ? redFighter?.bjjElo : activeBout.sport === 'MT' ? redFighter?.mtElo : redFighter?.boxingElo} ELO
                        </span>
                      </div>
                    </button>

                    {/* BLUE Corner Button */}
                    <button
                      onClick={() => setWinnerId(activeBout.fighterBlueId)}
                      className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between relative overflow-hidden group cursor-pointer ${
                        winnerId === activeBout.fighterBlueId
                          ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
                          : 'bg-slate-950 border-slate-850 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-[9.5px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                          Blue Corner
                        </span>
                        {winnerId === activeBout.fighterBlueId && (
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-bold text-slate-200">{blueFighter?.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">🛡️ {blueFighter?.gym || 'Independent'}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] border-t border-slate-900/60 pt-2 w-full text-slate-400">
                        <span>Current Rating:</span>
                        <span className="font-mono text-blue-400 font-bold">
                          {activeBout.sport === 'MMA' ? blueFighter?.mmaElo : activeBout.sport === 'BJJ' ? blueFighter?.bjjElo : activeBout.sport === 'MT' ? blueFighter?.mtElo : blueFighter?.boxingElo} ELO
                        </span>
                      </div>
                    </button>

                  </div>

                  {/* Draw / No Contest option */}
                  <button
                    onClick={() => setWinnerId('DRAW')}
                    className={`w-full p-3.5 rounded-xl border text-center font-mono text-xs font-bold transition-all cursor-pointer mt-2 ${
                      winnerId === 'DRAW'
                        ? 'bg-slate-800 border-slate-650 text-slate-200 ring-2 ring-slate-700/50'
                        : 'bg-slate-950 border-slate-850 text-slate-450 hover:border-slate-750'
                    }`}
                  >
                    🤝 DRAW / NO CONTEST
                  </button>
                </div>

                {/* Method selector */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono block">
                    Scoring Outcome Method
                  </label>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Decision', 'KO / TKO', 'Submission', 'Disqualification'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold font-mono tracking-tight transition-all cursor-pointer ${
                          method === m
                            ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <p className="text-[10px] text-amber-500/80 leading-normal flex items-start gap-1 max-w-sm">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Warning: Once submitted, rankings updates are committed to the TrueRank database.
                  </p>
                  
                  <button
                    onClick={handleSubmitResult}
                    disabled={submitting || !winnerId}
                    className={`px-5 py-2.5 text-xs font-bold rounded-lg tracking-wide shadow-md transition-all shrink-0 cursor-pointer ${
                      !winnerId 
                        ? 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed'
                        : submitting 
                        ? 'bg-amber-600/50 text-slate-200 border border-amber-500/30 animate-pulse'
                        : 'bg-amber-500 text-slate-950 font-black border border-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    }`}
                  >
                    {submitting ? 'Submitting Result...' : 'Submit Official Result'}
                  </button>
                </div>

              </div>
            )}

            {/* Notification messages */}
            {msg && (
              <div className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs animate-fadeIn ${
                msg.type === 'success' 
                  ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
                  : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
              }`}>
                {msg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{msg.text}</span>
              </div>
            )}

          </div>

          {/* Running Order Status Column */}
          <div className="space-y-4">
            
            {/* Running order list */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-250 uppercase tracking-wider font-display border-b border-slate-800 pb-2">
                Running Order Status
              </h3>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {currentEventBouts.map((b, idx) => {
                  const redF = fighters.find((f) => f.id === b.fighterRedId);
                  const blueF = fighters.find((f) => f.id === b.fighterBlueId);
                  const isBoutActive = activeBout?.id === b.id;

                  return (
                    <div 
                      key={b.id} 
                      className={`p-3 rounded-xl border transition-all ${
                        isBoutActive
                          ? 'bg-slate-950 border-amber-500/40 shadow-sm relative'
                          : b.completed
                          ? 'bg-slate-950/50 border-slate-900 opacity-60'
                          : 'bg-slate-950/30 border-slate-900'
                      }`}
                    >
                      {/* Active crown banner */}
                      {isBoutActive && (
                        <span className="absolute top-2 right-2 text-[8px] font-mono font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">
                          LIVE BRACKET
                        </span>
                      )}

                      <div className="flex items-center gap-1 text-[8.5px] font-mono text-slate-500 uppercase font-semibold">
                        <span>Bout #{b.boutOrder + 1}</span>
                        <span>&bull;</span>
                        <span>{b.sport} {b.weightClass}</span>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-250 truncate max-w-[90px]">{redF?.name}</span>
                        <span className="text-[10px] text-slate-600 font-mono">vs</span>
                        <span className="font-bold text-slate-250 truncate max-w-[90px] text-right">{blueF?.name}</span>
                      </div>

                      {/* Display score outcome if completed */}
                      {b.completed ? (
                        <div className="mt-2 text-[9px] font-mono text-slate-400 bg-slate-900/60 p-1.5 px-2.5 rounded border border-slate-900 flex justify-between items-center gap-1">
                          <span className="font-semibold text-emerald-400">
                            Winner: {b.winnerId ? getFighterName(b.winnerId) : 'Draw'}
                          </span>
                          <span className="text-slate-500 font-bold uppercase text-[8px]">
                            {b.method}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 text-[9px] font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Status: Pending Official Scoring</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {currentEventBouts.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-10 font-mono">No bouts configured for this card.</p>
                )}
              </div>
            </div>

            {/* Live standings info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide font-mono flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                Live Standings Sync
              </h3>
              
              <div className="p-3 bg-purple-950/15 border border-purple-900/20 rounded-xl space-y-2">
                <span className="text-[9.5px] font-mono font-bold text-purple-300 block uppercase">
                  Current Ranked Pool ({fighters.length} Athletes)
                </span>
                <p className="text-[10.5px] text-slate-400 leading-normal">
                  All submitted scoring cards instantly trigger backend Elo adjustments. Standings update in real-time across the Leaderboards and Active Rosters.
                </p>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-800 rounded-2xl font-mono text-xs text-slate-500">
          No events available to display scoring officials panel.
        </div>
      )}
    </div>
  );
}
