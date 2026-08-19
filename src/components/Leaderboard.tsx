import React, { useState, useMemo } from 'react';
import { Fighter, Sport } from '../types';
import { Award, ShieldAlert, Zap, Trophy, User as UserIcon } from 'lucide-react';

interface LeaderboardProps {
  fighters: Fighter[];
  onSelectFighter?: (fighterId: string) => void;
}

export function getFighterActivityStatus(lastFightDateStr: string, totalFights: number) {
  const lastFight = new Date(lastFightDateStr);
  const now = new Date('2026-06-13T03:46:49-07:00'); // Consistent with system time
  const msDiff = now.getTime() - lastFight.getTime();
  const monthsDiff = msDiff / (1000 * 60 * 60 * 24 * 30.44);

  if (monthsDiff > 12) {
    return {
      label: 'Inactive / At-Risk',
      className: 'bg-slate-800 text-slate-400 border border-slate-700 font-mono text-[10px] px-2 py-0.5 rounded shadow-sm',
      status: 'INACTIVE',
    };
  }

  // If fighter has at least 3 fights total and has fought recently, they are Gold Standard
  if (totalFights >= 3) {
    return {
      label: 'Gold Standard ✦',
      className: 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold font-mono tracking-wider text-[10px] px-2.5 py-0.5 rounded shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse',
      status: 'GOLD',
    };
  }

  return {
    label: 'Standard Active',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] px-2 py-0.5 rounded shadow-sm',
    status: 'ACTIVE',
  };
}

export default function Leaderboard({ fighters, onSelectFighter }: LeaderboardProps) {
  const [selectedSport, setSelectedSport] = useState<Sport>('MMA');
  const [hideInactive, setHideInactive] = useState<boolean>(true);

  // Helper to retrieve score for the selected sport
  const getFighterElo = (fighter: Fighter, sport: Sport) => {
    switch (sport) {
      case 'MMA': return fighter.mmaElo;
      case 'BJJ': return fighter.bjjElo;
      case 'MT': return fighter.mtElo;
      case 'BOXING': return fighter.boxingElo;
    }
  };

  const getFighterRecordStr = (fighter: Fighter, sport: Sport) => {
    switch (sport) {
      case 'MMA': return `${fighter.mmaWins}-${fighter.mmaLosses}-${fighter.mmaDraws}`;
      case 'BJJ': return `${fighter.bjjWins}-${fighter.bjjLosses}-${fighter.bjjDraws}`;
      case 'MT': return `${fighter.mtWins}-${fighter.mtLosses}-${fighter.mtDraws}`;
      case 'BOXING': return `${fighter.boxingWins}-${fighter.boxingLosses}-${fighter.boxingDraws}`;
    }
  };

  const getFighterTotalFights = (fighter: Fighter, sport: Sport) => {
    switch (sport) {
      case 'MMA': return fighter.mmaWins + fighter.mmaLosses + fighter.mmaDraws;
      case 'BJJ': return fighter.bjjWins + fighter.bjjLosses + fighter.bjjDraws;
      case 'MT': return fighter.mtWins + fighter.mtLosses + fighter.mtDraws;
      case 'BOXING': return fighter.boxingWins + fighter.boxingLosses + fighter.boxingDraws;
    }
  };

  // Determine top champions. A fighter is Champion (#1 Elo) in their specific Gender + Weight Class + Sport
  const championIds = useMemo(() => {
    const champSet = new Set<string>();
    
    // Group fighters by Gender + WeightClass
    const groups: Record<string, Fighter[]> = {};
    fighters.forEach(f => {
      const gKey = `${f.gender}_${f.weightClass}`;
      if (!groups[gKey]) groups[gKey] = [];
      groups[gKey].push(f);
    });

    Object.values(groups).forEach(groupFighters => {
      if (groupFighters.length === 0) return;
      // Find maximum Elo inside group
      let maxElo = -1;
      let candidates: Fighter[] = [];

      groupFighters.forEach(f => {
        const elo = getFighterElo(f, selectedSport);
        if (elo > maxElo) {
          maxElo = elo;
          candidates = [f];
        } else if (elo === maxElo) {
          candidates.push(f);
        }
      });

      // Award Champion style to #1 Elo holders
      candidates.forEach(f => {
        champSet.add(f.id);
      });
    });

    return champSet;
  }, [fighters, selectedSport]);

  // Filter and sort the fighters
  const rankedFighters = useMemo(() => {
    return fighters
      .map(f => {
        const elo = getFighterElo(f, selectedSport);
        const recordStr = getFighterRecordStr(f, selectedSport);
        const totalFights = getFighterTotalFights(f, selectedSport);
        const activity = getFighterActivityStatus(f.lastFightDate, totalFights);
        const isChamp = championIds.has(f.id);

        return {
          ...f,
          elo,
          recordStr,
          totalFights,
          activity,
          isChamp,
        };
      })
      .filter(f => {
        if (hideInactive && f.activity.status === 'INACTIVE') {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.elo - a.elo); // Sort descending by Elo rating
  }, [fighters, selectedSport, hideInactive, championIds]);

  return (
    <div id="true-leaderboard-container" className="space-y-6">
      {/* Sport Selector & Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap gap-2">
          {(['MMA', 'BJJ', 'MT', 'BOXING'] as Sport[]).map(sport => {
            const isActive = selectedSport === sport;
            return (
              <button
                key={sport}
                id={`btn-sport-${sport}`}
                onClick={() => setSelectedSport(sport)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-lg shadow-purple-900/30 border border-purple-500'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-850'
                }`}
              >
                {sport === 'MT' ? 'MUAY THAI (MT)' : sport}
              </button>
            );
          })}
        </div>

        {/* Hide Inactive Filter */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            id="checkbox-hide-inactive"
            checked={hideInactive}
            onChange={(e) => setHideInactive(e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-700 focus:ring-purple-500 focus:ring-offset-slate-900"
          />
          <span className="text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors">
            Hide Inactive Fighters
          </span>
        </label>
      </div>

      {/* Fighters Grid / Listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="leaderboard-grid">
        {rankedFighters.map((fighter, index) => {
          const isGold = fighter.activity.status === 'GOLD';
          const isInactive = fighter.activity.status === 'INACTIVE';
          
          return (
            <div
              key={fighter.id}
              id={`fighter-card-${fighter.id}`}
              onClick={() => onSelectFighter && onSelectFighter(fighter.id)}
              className={`relative cursor-pointer group flex flex-col p-5 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                fighter.isChamp
                  ? 'bg-slate-950 border-2 border-amber-500/50 shadow-[0_4px_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                  : 'bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 shadow-md hover:shadow-purple-950/20 hover:border-purple-800/50'
              }`}
            >
              {/* Champion Profile Banner Overrides */}
              {fighter.isChamp && (
                <div className="absolute -top-3 left-4 bg-amber-500 text-slate-950 px-3 py-0.5 text-[9px] font-bold uppercase rounded-full shadow-md tracking-widest flex items-center gap-1 z-10 animate-bounce">
                  <Trophy className="w-2.5 h-2.5 fill-slate-900" />
                  👑 {selectedSport} CHAMPION
                </div>
              )}

              {/* Rank & Rating Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-slate-400">
                  RANK #{index + 1}
                </span>
                
                {/* Activity Badge */}
                <span className={fighter.activity.className}>
                  {fighter.activity.label}
                </span>
              </div>

              {/* Fighter Core Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className={`text-base font-bold tracking-tight transition-colors duration-200 ${
                    fighter.isChamp ? 'text-amber-400 group-hover:text-amber-300' : 'text-slate-100 group-hover:text-purple-400'
                  }`}>
                    {fighter.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    📍 {fighter.gym} {fighter.location && `• ${fighter.location}`}
                  </p>
                </div>

                {/* Grid Attributes */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/40">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500">Gender & Age</span>
                    <span className="text-xs font-medium text-slate-300">{fighter.gender} / {fighter.age}y</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500">Weight Class</span>
                    <span className="text-xs font-medium text-slate-200 font-mono">{fighter.weightClass}</span>
                  </div>
                </div>

                {/* Belt display if BJJ */}
                {selectedSport === 'BJJ' && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">BJJ Belt:</span>
                    <span className={`px-2 py-0.5 font-mono font-bold text-[10px] rounded border ${
                      fighter.bjjBelt === 'BLACK' ? 'bg-slate-950 text-white border-white/40' :
                      fighter.bjjBelt === 'BROWN' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                      fighter.bjjBelt === 'PURPLE' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
                      fighter.bjjBelt === 'BLUE' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                      'bg-slate-200 text-slate-800 border-slate-400'
                    }`}>
                      {fighter.bjjBelt}
                    </span>
                  </div>
                )}
              </div>

              {/* Record Summary Footer & Elo Badge */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/50">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500">Record ({selectedSport})</span>
                  <span className="text-xs font-bold font-mono text-slate-300 tracking-wide">{fighter.recordStr}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-500">Elo Rating</span>
                  <span className={`text-base font-black font-mono tracking-tighter ${
                    fighter.isChamp ? 'text-amber-400' : 'text-purple-400'
                  }`}>
                    {fighter.elo}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {rankedFighters.length === 0 && (
          <div className="col-span-full py-16 text-center space-y-3 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
            <UserIcon className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-400 font-medium text-sm">No fighters matching criteria are currently registered.</p>
            {hideInactive && (
              <button
                onClick={() => setHideInactive(false)}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 underline"
              >
                Show inactive profiles
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
