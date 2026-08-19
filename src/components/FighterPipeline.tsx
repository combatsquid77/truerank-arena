import React, { useState, useEffect } from 'react';
import { Fighter, Event } from '../types';
import { Send, CheckCircle2, Swords, Calendar, MapPin, ChevronRight, AlertCircle, Sparkles, Clock, Trophy } from 'lucide-react';

interface FighterPipelineProps {
  fighter: Fighter;
  events: Event[];
  onRefreshFighters: () => void;
}

interface PipelineData {
  sentRequests: any[];
  eventRoster: any[];
  confirmedBouts: any[];
}

export default function FighterPipeline({ fighter, events, onRefreshFighters }: FighterPipelineProps) {
  const [pipeline, setPipeline] = useState<PipelineData>({
    sentRequests: [],
    eventRoster: [],
    confirmedBouts: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bypassingId, setBypassingId] = useState<string | null>(null);

  // Fetch the Live Fighter Pipeline with no-store/cache bypassing
  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('truerank_auth_token') || '';
      const res = await fetch(`/api/fighter/pipeline?fighterId=${fighter.id}&t=${Date.now()}`, {
        headers: { 'Authorization': token }
      });
      if (!res.ok) throw new Error('Failed to retrieve live fighter pipeline');
      const data = await res.json();
      setPipeline(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Pipeline retrieve error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, [fighter.id, events]);

  // Request entry application normally (PENDING)
  const handleRequestSignUp = async (eventId: string) => {
    try {
      const token = localStorage.getItem('truerank_auth_token') || '';
      const res = await fetch(`/api/events/${eventId}/request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ fighterId: fighter.id }),
      });
      if (res.ok) {
        await fetchPipeline();
        onRefreshFighters();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // VIP Quicklink Bypass: instantly join active roster bypassing application request forms
  const handleVipBypass = async (eventId: string) => {
    setBypassingId(eventId);
    try {
      const token = localStorage.getItem('truerank_auth_token') || '';
      const res = await fetch(`/api/invite/${eventId}/accept`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ fighterId: fighter.id }),
      });
      if (res.ok) {
        await fetchPipeline();
        onRefreshFighters();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBypassingId(null);
    }
  };

  // Safe Date string formatter
  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Fast Time formatter
  const formatTime = (isoStr: string) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLocalTime = (isoString?: string) => {
    if (!isoString) return 'TBA';
    try {
      const dateObj = new Date(isoString);
      if (isNaN(dateObj.getTime())) return isoString;
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'TBA';
    }
  };

  // Filter events that the fighter is not currently connected with
  const availableEvents = events.filter(ev => {
    const isJoined = ev.fighterIds.includes(fighter.id);
    const hasRequest = pipeline.sentRequests.some(r => r.eventId === ev.id);
    return !isJoined && !hasRequest;
  });

  return (
    <div className="space-y-8" id="fighter-pipeline-container">
      {/* Header Profile Dashboard Overview */}
      <div className="bg-gradient-to-r from-slate-900 to-purple-950/40 p-6 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest bg-purple-700/20 text-purple-400 font-bold px-3 py-1 rounded-full border border-purple-800">
              Fighter Passport Verified
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {fighter.id}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{fighter.name}</h2>
          <p className="text-xs text-slate-300">
            🥊 Training Club: <strong className="text-purple-400">{fighter.gym}</strong> {fighter.location && `(${fighter.location})`} &bull; Size profile: {fighter.gender} / {fighter.age} years / {fighter.weightClass}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="text-center px-4 py-2 bg-slate-950/80 rounded-xl border border-slate-800 min-w-20">
            <span className="block text-[10px] text-slate-500 uppercase">MMA</span>
            <span className="text-sm font-bold font-mono text-purple-400">{fighter.mmaElo}</span>
          </div>
          <div className="text-center px-4 py-2 bg-slate-950/80 rounded-xl border border-slate-800 min-w-20">
            <span className="block text-[10px] text-slate-500 uppercase">BJJ</span>
            <span className="text-sm font-bold font-mono text-purple-400">{fighter.bjjElo}</span>
          </div>
          <div className="text-center px-4 py-2 bg-slate-950/80 rounded-xl border border-slate-800 min-w-20">
            <span className="block text-[10px] text-slate-500 uppercase">Boxing</span>
            <span className="text-sm font-bold font-mono text-purple-400">{fighter.boxingElo}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error pipeline synchronization: {error}</span>
          <button onClick={fetchPipeline} className="underline font-bold ml-auto">Retry</button>
        </div>
      )}

      {/* Main 3 Strict Columns Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="three-column-pipeline">
        
        {/* Column 1: Sent Requests */}
        <div className="space-y-4 flex flex-col bg-slate-950/40 p-5 rounded-2xl border border-slate-900/60" id="col-sent-requests">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Send className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold tracking-tight text-slate-200">Sent Requests</h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 px-2 bg-slate-950 rounded">
              {pipeline.sentRequests.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1">
            {pipeline.sentRequests.map((req) => (
              <div key={req.requestId} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{req.eventName}</h4>
                  <p className="text-[10.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                    {req.eventLocation}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {formatDate(req.eventDate)}
                  </span>
                  <span className="px-2 py-0.5 rounded font-bold tracking-wider font-mono bg-purple-950/60 text-purple-400 border border-purple-800/50">
                    PENDING APPROVAL
                  </span>
                </div>
              </div>
            ))}

            {pipeline.sentRequests.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-10">No pending event enrollment forms.</p>
            )}
          </div>
        </div>

        {/* Column 2: Event Roster */}
        <div className="space-y-4 flex flex-col bg-slate-950/40 p-5 rounded-2xl border border-slate-900/60" id="col-event-roster">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold tracking-tight text-slate-200">Event Roster</h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 px-2 bg-slate-950 rounded">
              {pipeline.eventRoster.length}
            </span>
          </div>

          <p className="text-[11px] text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg">
            ✓ Approved in tournament roster. Awaiting matchmaker to release scheduled fights.
          </p>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-1">
            {pipeline.eventRoster.map((ev) => (
              <div key={ev.eventId} className="p-3.5 rounded-xl bg-slate-900/60 border border-emerald-500/20 space-y-2.5 shadow-[0_0_12px_rgba(16,185,129,0.02)]">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{ev.eventName}</h4>
                  <p className="text-[10.5px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                    {ev.eventLocation}
                  </p>
                </div>

                <div className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3 shrink-0 text-emerald-400" />
                  {formatDate(ev.eventDate)} &bull; {formatTime(ev.eventDate)}
                </div>
              </div>
            ))}

            {pipeline.eventRoster.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-10">You are not placed on active waiting rosters currently.</p>
            )}
          </div>
        </div>

        {/* Column 3: Confirmed Bouts */}
        <div className="space-y-4 flex flex-col bg-slate-950/40 p-5 rounded-2xl border border-slate-900/60" id="col-confirmed-bouts">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Swords className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold tracking-tight text-slate-200">Confirmed Bouts</h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 px-2 bg-slate-950 rounded">
              {pipeline.confirmedBouts.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1">
            {(() => {
              const sortedBouts = [...pipeline.confirmedBouts].sort((a, b) => a.boutOrder - b.boutOrder);
              const nextActive = sortedBouts.find(b => !b.completed);

              return sortedBouts.map((bout) => {
                const isMainCard = bout.cardType === 'MAIN';
                const isTitleFight = bout.cardType === 'TITLE';
                const isActive = nextActive && nextActive.boutId === bout.boutId;

                return (
                  <div 
                    key={bout.boutId} 
                    className={`p-4 rounded-xl bg-slate-950 border-l-4 space-y-3.5 shadow-md relative overflow-hidden transition-all ${
                      bout.completed 
                        ? 'border-slate-800 opacity-60' 
                        : isActive 
                        ? 'border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.1)]' 
                        : 'border-purple-600'
                    }`}
                  >
                    {/* Card Placement Division Header */}
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded border border-purple-700/30 font-bold uppercase">
                          {bout.sport} &mdash; {bout.weightClass}
                        </span>
                        {bout.published && (
                          isTitleFight ? (
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-black font-mono tracking-widest bg-amber-500 text-slate-950 border border-amber-400">
                              👑 TITLE FIGHT
                            </span>
                          ) : isMainCard ? (
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold font-mono tracking-wide bg-purple-900/40 text-purple-300 border border-purple-800/40">
                              🏆 MAIN CARD
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-medium font-mono tracking-wide bg-slate-900 text-slate-400 border border-slate-800">
                              UNDERCARD
                            </span>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {bout.completed ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono text-[8px]">
                            🏁 COMPLETED
                          </span>
                        ) : isActive ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono text-[8px] animate-pulse">
                            ⚡ LIVE NOW
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[9px]">Bout #{bout.boutOrder + 1}</span>
                        )}
                      </div>
                    </div>

                    {/* Opponent Card Block */}
                    <div className="border-y border-slate-900 py-2.5 space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold font-mono">opponent</span>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{bout.opponent?.name}</h4>
                          <p className="text-[10px] text-slate-400">🛡️ {bout.opponent?.gym}</p>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] text-slate-500 font-mono">Record</span>
                          <span className="text-[11px] font-bold font-mono text-slate-300">
                            {bout.opponent?.wins ?? 0}W - {bout.opponent?.losses ?? 0}L - {bout.opponent?.draws ?? 0}D
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="text-slate-500">TrueRank Skill Level:</span>
                        <span className="font-mono text-purple-400 font-semibold">{bout.opponent?.elo ?? 1200} Elo</span>
                      </div>
                    </div>

                    {/* Event details */}
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-200">{bout.eventName}</p>
                      <p className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-400" />
                        {formatDate(bout.eventDate)} &bull; {formatTime(bout.eventDate)}
                      </p>
                      {bout.published && bout.eventLocation && (
                        <p className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-purple-400" />
                          {bout.eventLocation}
                        </p>
                      )}
                    </div>

                    {/* Published Details vs Unpublished Lock Screen */}
                    {bout.published ? (
                      <div className="pt-2.5 border-t border-slate-900 space-y-3">
                        
                        {/* Weight & Walkout time details */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-900/30 p-2.5 rounded-lg border border-slate-900">
                          <div>
                            <span className="block text-[8.5px] uppercase font-bold text-slate-500 tracking-wide font-mono">Target Weight</span>
                            <span className="text-xs font-bold text-amber-400 font-mono">{bout.confirmedWeight || 'TBA'}</span>
                          </div>
                          <div>
                            <span className="block text-[8.5px] uppercase font-bold text-slate-500 tracking-wide font-mono">
                              {bout.completed ? 'Completed At' : 'Expected Walkout'}
                            </span>
                            <span className="text-xs font-bold text-purple-400 font-mono flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatLocalTime(bout.walkoutTime)}
                            </span>
                          </div>
                        </div>

                        {/* Display winner if completed */}
                        {bout.completed && (
                          <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl space-y-1">
                            <span className="block text-[8.5px] uppercase font-bold text-emerald-400 tracking-wide font-mono">
                              Official Fight Result
                            </span>
                            <p className="text-xs font-bold text-slate-200">
                              Winner: {bout.winnerId ? (bout.winnerId === fighter.id ? 'You (Win)' : bout.opponent?.name) : 'Draw'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Method: {bout.method || 'Decision'}
                            </p>
                          </div>
                        )}

                        {/* Weigh-in parameters */}
                        <div className="space-y-1">
                          <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wide font-mono">Official Weigh-In Schedule</span>
                          {bout.weighInDate ? (
                            <p className="text-[11px] text-slate-350 font-medium">
                              🗓️ {formatDate(bout.weighInDate)} at <span className="font-mono text-purple-400 font-bold">{bout.weighInTime || 'TBA'}</span>
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500 italic">No weigh-in date scheduled yet.</p>
                          )}
                        </div>

                        {/* Required promo events */}
                        {bout.promoEvents && (
                          <div className="space-y-1 p-2.5 bg-purple-950/15 border border-purple-900/20 rounded-lg">
                            <span className="block text-[9px] uppercase font-bold text-purple-400 tracking-wide font-mono flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              Mandatory Promotional Appearances
                            </span>
                            <p className="text-[10.5px] text-slate-350 leading-relaxed font-mono">
                              {bout.promoEvents}
                            </p>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="pt-2.5 border-t border-slate-900">
                        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 text-center space-y-1.5">
                          <p className="text-[10.5px] font-bold text-amber-500/90 flex items-center justify-center gap-1.5 font-sans">
                            ⏳ Logistics Pending Publication
                          </p>
                          <p className="text-[9.5px] text-slate-500 leading-normal">
                            Weigh-in schedule, confirmed fight weight, and required promotional events are currently being finalized by the promoter.
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                );
              });
            })()}

            {pipeline.confirmedBouts.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-10">No matches published on flight cards yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Available Sign Ups Panel with VIP Quicklink Shortcuts */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Arena Event Registry & VIP Shortcuts
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Check in, apply for open roster allocations, or use the tokenized <strong className="text-purple-400">VIP Quicklink Bypass</strong> to append your passport directly onto the roster list, skipping application queue files entirely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableEvents.map(ev => (
            <div key={ev.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-block text-[9px] font-bold font-mono text-purple-400 bg-purple-950/40 px-2 py-0.2 rounded border border-purple-800/30">
                  OPEN ENROLLMENT
                </span>
                <h4 className="text-xs font-bold text-slate-200">{ev.name}</h4>
                <p className="text-[10.5px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  {ev.location}
                </p>
                <p className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  {formatDate(ev.date)} &bull; {formatTime(ev.date)}
                </p>
              </div>

              {/* Action buttons including standard request & VIP Bypass */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => handleRequestSignUp(ev.id)}
                  className="px-3 py-2 text-xs font-semibold rounded bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                >
                  Standard Application
                </button>
                <button
                  onClick={() => handleVipBypass(ev.id)}
                  disabled={bypassingId === ev.id}
                  className="px-3 py-2 text-xs font-semibold rounded bg-purple-700 hover:bg-purple-600 text-white shadow-lg shadow-purple-950/20 border border-purple-500 transition-all flex items-center justify-center gap-1"
                >
                  {bypassingId === ev.id ? 'Bypassing...' : 'VIP Quicklink Join ✦'}
                </button>
              </div>
            </div>
          ))}

          {availableEvents.length === 0 && (
            <div className="col-span-full p-6 text-center text-xs text-slate-500 font-medium">
              You are currently registered or in application review for all active events.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
