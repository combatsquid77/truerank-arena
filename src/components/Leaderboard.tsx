import React, { useState, useMemo } from 'react';
import { Fighter, Sport } from '../types';
import { Trophy, MapPin } from 'lucide-react';

interface LeaderboardProps {
  fighters: Fighter[];
  onSelectFighter?: (fighterId: string) => void;
}

export function getFighterActivityStatus(lastFightDateStr: string, totalFights: number) {
  const lastFight = new Date(lastFightDateStr);
  const now = new Date('2026-06-13T03:46:49-07:00');
  const msDiff = now.getTime() - lastFight.getTime();
  const monthsDiff = msDiff / (1000 * 60 * 60 * 24 * 30.44);

  if (monthsDiff > 12) {
    return {
      label: 'INACTIVE',
      className: 'bg-slate-950 text-slate-500 border border-slate-800 font-mono text-[9px] px-1.5 py-0.5 rounded-sm',
      status: 'INACTIVE',
    };
  }

  if (totalFights >= 3) {
    return {
      label: 'ELITE ✦',
      className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold font-mono tracking-wider text-[9px] px-1.5 py-0.5 rounded-sm',
      status: 'GOLD',
    };
  }

  return {
    label: 'ACTIVE',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[9px] px-1.5 py-0.5 rounded-sm',
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
      .sort((a, b) => b.elo - a.elo);
  }, [fighters, selectedSport, hideInactive, championIds]);

  return (
    <div id="true-leaderboard-container" className="space-y-6">
      
      {/* Sport Selector & Hide Inactive Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-slate-900 border border-slate-850">
        <div className="flex flex-wrap gap-1">
          {(['MMA', 'BJJ', 'MT', 'BOXING'] as Sport[]).map(sport => {
            const isActive = selectedSport === sport;
            return (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-5 py-2.5 text-xs font-display font-bold uppercase tracking-wider transition cursor-pointer ${
                  isActive
                    ? 'bg-rose-700 text-white rounded-sm border border-rose-500 shadow-sm'
                    : 'bg-[#1c1c20] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {sport === 'MT' ? 'MUAY THAI (MT)' : sport}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideInactive}
            onChange={(e) => setHideInactive(e.target.checked)}
            className="w-4 h-4 text-rose-700 bg-slate-950 border-slate-800 focus:ring-0 rounded-sm cursor-pointer"
          />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
            Hide Inactive Fighters
          </span>
        </label>
      </div>

      {/* --- STANDINGS GRID / ROW LIST --- */}
      <div className="space-y-2.5">
        
        {/* RANK 1: CHAMPION CARD OVERRIDE */}
        {rankedFighters[0] && (
          <div 
            onClick={() => onSelectFighter && onSelectFighter(rankedFighters[0].id)}
            className="relative bg-gradient-to-r from-[#431928] to-[#1d070b] border border-rose-900/40 p-6 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer hover:border-rose-700 transition duration-300 rounded"
          >
            <div className="flex items-center gap-6">
              <span className="font-mono text-base font-black text-rose-400 shrink-0">#1</span>

              {/* Hyper-realistic Championship Belt Badge */}
              <img 
                src="/championship_belt.png" 
                alt="UFC Belt" 
                className="h-14 w-20 object-contain shrink-0 filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] select-none"
              />

              {/* Fighter Details */}
              <div>
                <h3 className="font-display text-xl font-extrabold text-white uppercase tracking-wide leading-tight">
                  {rankedFighters[0].name}
                </h3>
                <div className="text-xs text-rose-350 flex items-center gap-1 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{rankedFighters[0].gym} • {rankedFighters[0].location}</span>
                </div>
              </div>
            </div>

            {/* Right: Medal Badge & ELO rating */}
            <div className="flex items-center gap-8 self-end md:self-center">
              {/* Hyper-realistic Gold Medal */}
              <img 
                src="/gold_standard.png" 
                alt="Gold Standard Medal" 
                className="h-14 w-14 object-contain shrink-0 filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] select-none"
              />

              <div className="text-right">
                <div className="text-[8.5px] font-mono uppercase tracking-widest text-rose-300">Elo Rating</div>
                <div className="text-2xl font-black font-mono text-amber-400 leading-none mt-1">
                  {rankedFighters[0].elo}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RANK 2+: CONTENDER DENSE ROW CARDS */}
        {rankedFighters.slice(1).map((fighter, index) => {
          const displayRank = index + 2;
          return (
            <div 
              key={fighter.id}
              onClick={() => onSelectFighter && onSelectFighter(fighter.id)}
              className="bg-[#151518] border border-slate-850/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-slate-850 hover:bg-[#1a1a20] transition rounded"
            >
              
              {/* Left Column: Rank, Avatar, Name & Pin */}
              <div className="flex items-center gap-4 min-w-[280px]">
                <span className="font-mono text-sm font-bold text-slate-500 w-6 text-center shrink-0">#{displayRank}</span>

                {/* Avatar Initials Circle */}
                <div className="w-9 h-9 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center font-display text-xs font-bold text-slate-400 select-none uppercase shrink-0">
                  {fighter.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>

                <div>
                  <div className="font-display text-sm font-bold uppercase text-slate-100 group-hover:text-rose-450 transition leading-tight">
                    {fighter.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                    <span className="truncate max-w-[190px]">{fighter.gym} • {fighter.location}</span>
                  </div>
                </div>
              </div>

              {/* Center Columns: Details */}
              <div className="grid grid-cols-3 gap-6 text-left flex-grow max-w-sm">
                <div>
                  <div className="text-[8.5px] font-mono uppercase tracking-widest text-slate-500 select-none">Gender & Age</div>
                  <div className="text-xs font-medium text-slate-300 font-mono mt-0.5">{fighter.gender} / {fighter.age}y</div>
                </div>
                <div>
                  <div className="text-[8.5px] font-mono uppercase tracking-widest text-slate-500 select-none">Age / Record</div>
                  <div className="text-xs font-bold text-slate-200 font-mono mt-0.5">{fighter.recordStr}</div>
                </div>
                <div>
                  <div className="text-[8.5px] font-mono uppercase tracking-widest text-slate-500 select-none">Weight Class</div>
                  <div className="text-xs font-semibold text-slate-300 font-mono mt-0.5">{fighter.weightClass}</div>
                </div>
              </div>

              {/* Right: Badges & ELO */}
              <div className="flex items-center gap-6 justify-between md:justify-end">
                <img 
                  src="/championship_belt.png" 
                  alt="Championship Belt" 
                  className="h-6 w-9 object-contain opacity-75 hover:opacity-100 transition shrink-0 select-none"
                />

                <img 
                  src="/gold_standard.png" 
                  alt="Gold Standard Medal" 
                  className="h-6 w-6 object-contain opacity-75 hover:opacity-100 transition shrink-0 select-none"
                />

                <div className="text-right w-20 shrink-0">
                  <div className="text-[8.5px] font-mono uppercase tracking-widest text-slate-550 select-none">Elo Rating</div>
                  <div className="text-sm font-black font-mono text-rose-400 mt-0.5">
                    {fighter.elo}
                  </div>
                </div>
              </div>

            </div>
          );
        })}

        {rankedFighters.length === 0 && (
          <div className="py-16 text-center font-mono text-xs text-slate-500 bg-[#151518] border border-slate-850 rounded">
            No rankings resolved for sport category.
          </div>
        )}

      </div>

    </div>
  );
}
