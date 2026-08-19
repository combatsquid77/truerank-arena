import React, { useState, useEffect } from 'react';
import { Event, Fighter, ScheduledBout, MatchmakingResult } from '../types';
import CsvUploader from './CsvUploader';
import TrueRankPoster from './TrueRankPoster';
import { Swords, Users, ClipboardList, Sparkles, Check, X, ShieldAlert, Award, Calendar, Clock } from 'lucide-react';

interface PromoterDashboardProps {
  events: Event[];
  fighters: Fighter[];
  bouts: ScheduledBout[];
  onRefreshData: () => void;
}

export default function PromoterDashboard({ events, fighters, bouts, onRefreshData }: PromoterDashboardProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('e-1');
  const [selectedSport, setSelectedSport] = useState<'MMA' | 'BJJ' | 'MT' | 'BOXING'>('MMA');
  const [matchmakingResult, setMatchmakingResult] = useState<MatchmakingResult | null>(null);
  const [previewingMatches, setPreviewingMatches] = useState<boolean>(false);
  const [loadingMatchmaker, setLoadingMatchmaker] = useState<boolean>(false);
  const [submittingCard, setSubmittingCard] = useState<boolean>(false);

  // Active event detail
  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];
  const [eventRoster, setEventRoster] = useState<Fighter[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  // Logistics & Publication States
  const [weighInDate, setWeighInDate] = useState<string>('');
  const [weighInTime, setWeighInTime] = useState<string>('');
  const [promoEvents, setPromoEvents] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [boutsConfig, setBoutsConfig] = useState<Record<string, { confirmedWeight: string, cardType: 'TITLE' | 'MAIN' | 'UNDER' }>>({});
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Sync state whenever selected event or bouts change
  useEffect(() => {
    if (currentEvent) {
      setWeighInDate(currentEvent.weighInDate || '');
      setWeighInTime(currentEvent.weighInTime || '');
      setPromoEvents(currentEvent.promoEvents || '');
      setIsPublished(currentEvent.published || false);

      const config: Record<string, { confirmedWeight: string, cardType: 'TITLE' | 'MAIN' | 'UNDER' }> = {};
      const eventBouts = bouts.filter(b => b.eventId === currentEvent.id);
      eventBouts.forEach(b => {
        config[b.id] = {
          confirmedWeight: b.confirmedWeight || '',
          cardType: b.cardType as 'TITLE' | 'MAIN' | 'UNDER' || 'UNDER',
        };
      });
      setBoutsConfig(config);
    }
  }, [selectedEventId, bouts, currentEvent]);

  const handleSaveSettings = async (publishStatus: boolean) => {
    if (!currentEvent) return;
    setSavingSettings(true);
    setSettingsMsg(null);

    const boutsConfigArray = Object.entries(boutsConfig).map(([boutId, config]: [string, any]) => ({
      boutId,
      confirmedWeight: config.confirmedWeight,
      cardType: config.cardType,
    }));

    try {
      const token = localStorage.getItem('truerank_auth_token') || '';
      const res = await fetch(`/api/events/${currentEvent.id}/publish-settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          weighInDate,
          weighInTime,
          promoEvents,
          published: publishStatus,
          boutsConfig: boutsConfigArray,
        }),
      });

      if (res.ok) {
        setIsPublished(publishStatus);
        setSettingsMsg({
          type: 'success',
          text: publishStatus 
            ? '✓ Logistics and bout configurations successfully published to fighters!'
            : '✓ Draft details successfully saved (hidden from fighters).',
        });
        onRefreshData();
        setTimeout(() => setSettingsMsg(null), 4000);
      } else {
        const err = await res.json();
        setSettingsMsg({ type: 'error', text: `Error: ${err.error || 'Failed to save settings'}` });
      }
    } catch (err: any) {
      setSettingsMsg({ type: 'error', text: `Network Error: ${err.message}` });
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchEventRosterAndRequests = async () => {
    if (!currentEvent) {
      console.log('fetchEventRosterAndRequests: currentEvent is null/undefined');
      return;
    }
    console.log(`fetchEventRosterAndRequests starting: currentEvent.id = "${currentEvent.id}"`, currentEvent);
    try {
      let res;
      try {
        const origin = typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' 
          ? window.location.origin 
          : '';
        const url = `${origin}/api/events/${currentEvent.id}`;
        console.log(`fetchEventRosterAndRequests: fetching URL "${url}"`);
        const token = localStorage.getItem('truerank_auth_token') || '';
        res = await fetch(url, {
          headers: { 'Authorization': token }
        });
      } catch (err: any) {
        console.error('fetchEventRosterAndRequests: Failed during fetch call:', err, err?.stack);
        throw err;
      }

      if (res && res.ok) {
        let data;
        try {
          data = await res.json();
          console.log('fetchEventRosterAndRequests: successfully parsed event JSON', data);
        } catch (err: any) {
          console.error('fetchEventRosterAndRequests: Failed during res.json():', err, err?.stack);
          throw err;
        }

        try {
          setEventRoster(data.roster || []);
        } catch (err: any) {
          console.error('fetchEventRosterAndRequests: Failed during setEventRoster:', err, err?.stack);
          throw err;
        }
        
        let enriched = [];
        try {
          const requestsList = data.requests || [];
          enriched = requestsList.map((r: any) => {
            const f = fighters.find(f => f.id === r.fighterId);
            return {
              ...r,
              fighterName: f?.name || 'Unknown Competitor',
              gym: f?.gym || 'Independent',
              location: f?.location || 'Unknown',
              age: f?.age || 25,
              gender: f?.gender || 'MALE',
              weightClass: f?.weightClass || '-73kg',
            };
          });
        } catch (err: any) {
          console.error('fetchEventRosterAndRequests: Failed during enriched mapping:', err, err?.stack);
          throw err;
        }

        try {
          setPendingRequests(enriched);
        } catch (err: any) {
          console.error('fetchEventRosterAndRequests: Failed during setPendingRequests:', err, err?.stack);
          throw err;
        }
      } else {
        console.warn(`fetchEventRosterAndRequests response is not ok (status: ${res?.status})`);
      }
    } catch (err) {
      console.error('Error fetching roster details:', err);
    }
  };

  useEffect(() => {
    fetchEventRosterAndRequests();
    setMatchmakingResult(null);
    setPreviewingMatches(false);
  }, [selectedEventId, fighters, events]);

  const handleApproveRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('truerank_auth_token') || '';
      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (res.ok) {
        fetchEventRosterAndRequests();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('truerank_auth_token') || '';
      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ status: 'REJECTED' }),
      });
      if (res.ok) {
        fetchEventRosterAndRequests();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run the matchmaker engine algorithm
  const handleRunMatchmaker = async () => {
    if (!currentEvent) return;
    setLoadingMatchmaker(true);
    setMatchmakingResult(null);
    try {
      const token = localStorage.getItem('truerank_auth_token') || '';
      const res = await fetch(`/api/events/${currentEvent.id}/matchmaker`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ eventId: currentEvent.id, sport: selectedSport }),
      });
      if (res.ok) {
        const data = await res.json();
        setMatchmakingResult(data);
        setPreviewingMatches(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatchmaker(false);
    }
  };

  // Commit matches, assigning Smart Corners asymmetric lockerrooms
  const handleCommitCard = async () => {
    if (!currentEvent || !matchmakingResult) return;
    setSubmittingCard(true);
    try {
      const token = localStorage.getItem('truerank_auth_token') || '';
      const res = await fetch(`/api/events/${currentEvent.id}/commit-card`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ matches: matchmakingResult.matches, sport: selectedSport }),
      });
      if (res.ok) {
        setPreviewingMatches(false);
        setMatchmakingResult(null);
        await fetchEventRosterAndRequests();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingCard(false);
    }
  };

  const currentEventBouts = bouts.filter(b => b.eventId === currentEvent?.id);

  return (
    <div className="space-y-8" id="promoter-dashboard-container">
      
      {/* Event Selection Grid Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Promoted Arena Tournament Selection
          </label>
          <div className="flex flex-wrap gap-2">
            {events.map(ev => (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  selectedEventId === ev.id
                    ? 'bg-purple-700 font-bold border border-purple-500 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
                }`}
              >
                {ev.name}
              </button>
            ))}
          </div>
        </div>

        {currentEvent && (
          <div className="text-right text-xs font-mono text-slate-400">
            📍 Location: {currentEvent.location}
          </div>
        )}
      </div>

      {currentEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANELS: Roster, CSV Intake, Applications */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Competitor CSV Batch parser */}
            <CsvUploader onUploadSuccess={() => { onRefreshData(); fetchEventRosterAndRequests(); }} />

            {/* Applications review board */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-purple-400" />
                Enrollment Backlog ({pendingRequests.length})
              </h3>
              
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {pendingRequests.map(req => {
                  if (req.status !== 'PENDING') return null;
                  return (
                    <div key={req.id} className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-2 flex items-center justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-200">{req.fighterName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          🛡️ {req.gym} {req.location && `(${req.location})`} &bull; {req.weightClass}
                        </p>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          className="p-1 px-1.5 text-[10px] bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded text-emerald-400 flex items-center gap-0.5"
                        >
                          <Check className="w-3 h-3" /> Appr
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="p-1 px-1.5 text-[10px] bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded text-rose-400 flex items-center gap-0.5"
                        >
                          <X className="w-3 h-3" /> Rej
                        </button>
                      </div>
                    </div>
                  );
                })}

                {pendingRequests.filter(r => r.status === 'PENDING').length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">No pending fighter entry applications.</p>
                )}
              </div>
            </div>

            {/* Current Event Arena Roster */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Active Roster ({eventRoster.length})
              </h3>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {eventRoster.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-slate-850 text-xs text-slate-300">
                    <div>
                      <span className="font-bold text-slate-200">{f.name}</span>
                      <p className="text-[10px] text-slate-400">Gym: {f.gym} {f.location && `(${f.location})`} &bull; {f.gender}</p>
                    </div>
                    <span className="font-mono text-[10.5px] text-slate-400">{f.weightClass}</span>
                  </div>
                ))}
                {eventRoster.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">Roster is empty. Apply or add competitors.</p>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT PANELS: Matchmaker engine & TrueRank digital Poster preview */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* MATCHMAKER COCKPIT */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Swords className="w-4 h-4 text-purple-400 animate-pulse" />
                    Interactive Arena Matchmaker Engine
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Triggers tournament automated pairing using sport Elo thresholds, weight separation, belt handicaps (+50 per rank for BJJ), and physical blocks (Gym conflicts, &gt;10yr age difference).
                  </p>
                </div>

                <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['MMA', 'BJJ', 'MT', 'BOXING'] as const).map(sport => (
                    <button
                      key={sport}
                      onClick={() => setSelectedSport(sport)}
                      className={`px-2 py-1 text-[10px] font-bold rounded uppercase transition-colors ${
                        selectedSport === sport
                          ? 'bg-purple-700 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>

              {/* Run matchmaker block */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRunMatchmaker}
                  disabled={loadingMatchmaker || eventRoster.length < 2}
                  className="px-6 py-2.5 text-xs font-black rounded-lg text-white bg-purple-700 hover:bg-purple-600 border border-purple-500 shadow-md shadow-purple-950/20 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  {loadingMatchmaker ? 'Processing Elo Pairings...' : `Generate ${selectedSport} Matchups`}
                </button>

                {eventRoster.length < 2 && (
                  <span className="text-xs text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" /> At least 2 active competitors required in roster
                  </span>
                )}
              </div>

              {/* Matchmaker Interactive Pairings Preview */}
              {previewingMatches && matchmakingResult && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-950 border border-purple-900/30 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <h4 className="text-xs font-bold text-slate-200">
                      Proposed Arena Matchups ({matchmakingResult.matches.length})
                    </h4>
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-black">
                      STRICT SAFETY CRITERIA SATISFIED
                    </span>
                  </div>

                  {/* Matches List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {matchmakingResult.matches.map((match, idx) => (
                      <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                          <span className="text-purple-400 font-bold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/30">
                            {match.weightClass}
                          </span>
                          <span>Skill Diff: {match.eloDiff} Elo</span>
                        </div>

                        <div className="text-xs space-y-1">
                          <div className="flex justify-between items-center bg-slate-950 p-1.5 rounded text-[11px]">
                            <span className="font-bold text-slate-200">{match.fighterRed.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{match.fighterRed.gym}</span>
                          </div>
                          
                          <div className="text-center text-[10px] font-bold text-purple-500 font-mono">VS</div>

                          <div className="flex justify-between items-center bg-slate-950 p-1.5 rounded text-[11px]">
                            <span className="font-bold text-slate-200">{match.fighterBlue.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{match.fighterBlue.gym}</span>
                          </div>
                        </div>

                        {/* BJJ Belt Rank Handicaps info */}
                        {match.beltDiffPenalty !== undefined && (
                          <div className="p-1 px-2 rounded bg-indigo-950/20 border border-indigo-900/40 text-[9.5px] text-indigo-300 font-mono">
                            ✦ BJJ Rank handicap applied: {match.beltDiffPenalty} Elo modification
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Unmatched list with explanations */}
                  {matchmakingResult.unmatched.length > 0 && (
                    <div className="p-3.5 bg-slate-900/60 rounded-xl space-y-2.5 border border-slate-850">
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                        ⚠️ High-Safety Guarded Mismatches ({matchmakingResult.unmatched.length})
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-36 overflow-y-auto pr-1">
                        {matchmakingResult.unmatched.map((un, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-950 rounded-lg space-y-1">
                            <span className="text-xs font-bold text-slate-300">{un.fighterName}</span>
                            <div className="space-y-0.5 pl-2 border-l border-amber-500/40">
                              {un.reasons.map((r, rIdx) => (
                                <p key={rIdx} className="text-[9.5px] text-amber-500/80 font-mono leading-tight">
                                  &bull; {r}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Commit proposal triggers Smart Corner Logic */}
                  <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
                    <p className="text-[11px] text-amber-400 bg-amber-400/5 px-2.5 py-1.5 rounded border border-amber-500/15">
                      💡 Click Commit to write and publish this running order, auto-sorting changing corners.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setPreviewingMatches(false); setMatchmakingResult(null); }}
                        className="px-3.5 py-2 text-xs font-medium rounded text-slate-400 hover:text-white"
                      >
                        Decline Card
                      </button>
                      <button
                        onClick={handleCommitCard}
                        disabled={submittingCard}
                        className="px-5 py-2 text-xs font-bold rounded bg-purple-700 hover:bg-purple-600 text-white shadow-lg border border-purple-500 transition-all"
                      >
                        {submittingCard ? 'Publishing running order...' : 'Commit & Publish Running Order'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* EVENT LOGISTICS & PUBLICATION CONFIGURATOR */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5" id="event-logistics-settings">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-purple-400" />
                    Athlete Logistics & Weigh-In Configuration
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Define weigh-in parameters, mandatory promo events, and individual bout weights/placements.
                  </p>
                </div>
                
                {/* Publication Status Badge */}
                <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-full border ${
                  isPublished 
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' 
                    : 'bg-slate-950/40 text-slate-400 border-slate-800'
                }`}>
                  {isPublished ? '● Published to Fighters' : '○ Draft Mode (Hidden)'}
                </span>
              </div>

              {/* Weigh-in details & Promos Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    Weigh-In Date
                  </label>
                  <input
                    type="date"
                    value={weighInDate}
                    onChange={(e) => setWeighInDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    Weigh-In Time
                  </label>
                  <input
                    type="time"
                    value={weighInTime}
                    onChange={(e) => setWeighInTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono block">
                  Mandatory Promo Schedule / Requirements
                </label>
                <textarea
                  rows={2}
                  value={promoEvents}
                  onChange={(e) => setPromoEvents(e.target.value)}
                  placeholder="e.g. Press Conference (14:00), Media Face-offs (16:30), Athlete Rules Briefing (18:00)"
                  className="w-full text-xs p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 placeholder-slate-700 leading-relaxed"
                />
              </div>

              {/* Bout-Level Details Editor */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                  Bout Specifics ({currentEventBouts.length})
                </h4>
                
                {currentEventBouts.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-950/40 p-4 rounded-xl text-center border border-slate-850">
                    No bouts committed to this event's running order yet. Run the Matchmaker and commit matchups first.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {currentEventBouts.map((b) => {
                      const redFighter = fighters.find(f => f.id === b.fighterRedId);
                      const blueFighter = fighters.find(f => f.id === b.fighterBlueId);
                      const config = boutsConfig[b.id] || { confirmedWeight: '', cardType: 'UNDER' };

                      return (
                        <div key={b.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono text-purple-400 font-bold bg-purple-950/30 px-2 py-0.5 rounded border border-purple-900/30">
                              Bout #{b.boutOrder + 1} &mdash; {b.sport} {b.weightClass}
                            </span>
                            <span className="text-slate-400">
                              {redFighter?.name || 'TBA'} vs {blueFighter?.name || 'TBA'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block font-mono">
                                Confirmed target weight
                              </label>
                              <input
                                type="text"
                                value={config.confirmedWeight}
                                placeholder={`e.g. ${b.weightClass.replace('-', '')} max`}
                                onChange={(e) => setBoutsConfig({
                                  ...boutsConfig,
                                  [b.id]: { ...config, confirmedWeight: e.target.value }
                                })}
                                className="w-full text-[11px] p-2 rounded bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block font-mono">
                                Card placement
                              </label>
                              <select
                                value={config.cardType}
                                onChange={(e) => setBoutsConfig({
                                  ...boutsConfig,
                                  [b.id]: { ...config, cardType: e.target.value as 'TITLE' | 'MAIN' | 'UNDER' }
                                })}
                                className="w-full text-[11px] p-2 rounded bg-slate-900 border border-slate-800 text-slate-350 focus:outline-none focus:border-purple-500 font-mono"
                              >
                                <option value="UNDER">Undercard Fight</option>
                                <option value="MAIN">Main Card Fight</option>
                                <option value="TITLE">Title Fight</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Fight Night Controls & Official Judge Invite Link */}
              {currentEvent && (
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
                        <Swords className="w-3.5 h-3.5 text-amber-500" />
                        Fight Night Card Controls
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Manage official score cards and invite ring judges.
                      </p>
                    </div>
                    {currentEvent.started ? (
                      <span className="px-2 py-0.5 rounded text-[8.5px] font-black font-mono tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                        ⚡ LIVE BRACKETS ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[8.5px] font-black font-mono tracking-widest bg-slate-900 text-slate-500 border border-slate-800">
                        PRE-EVENT DRAFT
                      </span>
                    )}
                  </div>

                  {currentEvent.started ? (
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider font-mono block">
                        Official Judge Invite Link
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?invite=judge&eventId=${currentEvent.id}`}
                          className="w-full text-[11px] p-2 rounded bg-slate-900 border border-slate-850 text-purple-400 focus:outline-none font-mono select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/?invite=judge&eventId=${currentEvent.id}`;
                            navigator.clipboard.writeText(url);
                            alert('Copied Judge invite link to clipboard!');
                          }}
                          className="px-3.5 py-2 text-xs font-bold rounded bg-purple-900/30 text-purple-400 border border-purple-700/30 hover:bg-purple-900/50 transition-all font-mono whitespace-nowrap"
                        >
                          📋 Copy Link
                        </button>
                      </div>
                      <p className="text-[9.5px] text-slate-500 leading-normal">
                        Share this unique link with scoring officials to grant them scoring dashboard access for this card.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-900">
                      <p className="text-[10px] text-slate-400 leading-normal max-w-md">
                        Once fight matchups are finalized, click Start to initiate Fight Night, lock brackets, and enable real-time official scoring.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('truerank_auth_token') || '';
                            const res = await fetch(`/api/events/${currentEvent.id}/start`, { 
                              method: 'POST',
                              headers: { 'Authorization': token }
                            });
                            if (res.ok) {
                              onRefreshData();
                            } else {
                              alert('Failed to start Fight Night.');
                            }
                          } catch (err) {
                            alert('Network error initiating card.');
                          }
                        }}
                        className="px-4 py-2 text-xs font-black rounded-lg bg-amber-500 text-slate-950 border border-amber-400 hover:shadow-[0_0_10px_rgba(245,158,11,0.25)] transition-all font-mono tracking-wide whitespace-nowrap cursor-pointer"
                      >
                        🚀 Start Fight Night
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Status Message */}
              {settingsMsg && (
                <div className={`p-3 rounded-lg border text-xs ${
                  settingsMsg.type === 'success' 
                    ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300' 
                    : 'bg-rose-950/40 border-rose-500/20 text-rose-300'
                }`}>
                  {settingsMsg.text}
                </div>
              )}

              {/* Save / Publish Action Toolbar */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-850">
                <button
                  onClick={() => handleSaveSettings(false)}
                  disabled={savingSettings || currentEventBouts.length === 0}
                  className="px-4 py-2 text-xs font-semibold rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save as Draft (Hide)
                </button>
                
                <button
                  onClick={() => handleSaveSettings(true)}
                  disabled={savingSettings || currentEventBouts.length === 0}
                  className="px-5 py-2 text-xs font-bold rounded bg-purple-700 hover:bg-purple-650 text-white shadow-md border border-purple-500 flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-sans"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  {isPublished ? 'Update & Re-Publish' : 'Publish Details to Fighters'}
                </button>
              </div>
            </div>

            {/* TRUERANK RUNNING ORDER PUBLIC POSTER WRAPPER */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  TrueRank Digital Running Order Poster Configurator
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust walkout metrics, first bell times, and render high-res digital PNG assets optimized for social campaigns and changing room posters.
                </p>
              </div>

              <TrueRankPoster
                event={currentEvent}
                bouts={currentEventBouts}
                fighters={fighters}
              />
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
