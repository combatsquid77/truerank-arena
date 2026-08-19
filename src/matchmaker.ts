import { Fighter, Sport, WeightClass, MatchmakingResult, BjjBelt, MismatchReason } from './types';

// BJJ Belt numerical values for dynamic rating modifiers (+50 Elo per belt rank difference)
export const BELT_RANKS: Record<BjjBelt, number> = {
  WHITE: 0,
  BLUE: 1,
  PURPLE: 2,
  BROWN: 3,
  BLACK: 4,
};

/**
 * Helper to calculate weight classes and ratings
 */
export function getSportElo(fighter: Fighter, sport: Sport): number {
  switch (sport) {
    case 'MMA': return fighter.mmaElo;
    case 'BJJ': return fighter.bjjElo;
    case 'MT': return fighter.mtElo;
    case 'BOXING': return fighter.boxingElo;
    default: return 1200;
  }
}

/**
 * Matchmaker Engine
 * Validates combinations, applies restraints, and performs greedy pairing.
 */
export function matchmakeRoster(fighters: Fighter[], sport: Sport): MatchmakingResult {
  const matches: MatchmakingResult['matches'] = [];
  const unmatchedReasons: Record<string, string[]> = {};

  // Initialize unmatched reasons for all input fighters
  fighters.forEach(f => {
    unmatchedReasons[f.id] = [];
  });

  // 1. Filter and Group by Gender, WeightClass
  const groups: Record<string, Fighter[]> = {};
  fighters.forEach(f => {
    const key = `${f.gender}_${f.weightClass}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(f);
  });

  const pairedFighterIds = new Set<string>();

  // Process each group (Gender + Weight Class) separately
  for (const groupKey in groups) {
    const rosterInGroup = groups[groupKey];
    
    // Sort roster by their effective Elo in this sport to match closest skill first
    const sortedRoster = [...rosterInGroup].sort((a, b) => {
      return getSportElo(a, sport) - getSportElo(b, sport);
    });

    const matchedInGroup = new Set<string>();

    for (let i = 0; i < sortedRoster.length; i++) {
      const f1 = sortedRoster[i];
      if (matchedInGroup.has(f1.id)) continue;

      let bestOpponent: Fighter | null = null;
      let minEloDiff = Infinity;
      let calculatedBeltPenalty = 0;
      let specificMismatchHistory: string[] = [];

      for (let j = i + 1; j < sortedRoster.length; j++) {
        const f2 = sortedRoster[j];
        if (matchedInGroup.has(f2.id)) continue;

        const reasons: string[] = [];

        // RESTRICTION 1: Same Gym
        if (f1.gym.trim().toLowerCase() === f2.gym.trim().toLowerCase()) {
          reasons.push(`Teammate conflict (both train at ${f1.gym})`);
        }

        // RESTRICTION 2: Age Gap > 10 Years
        const ageGap = Math.abs(f1.age - f2.age);
        if (ageGap > 10) {
          reasons.push(`Incompatible Age Gap of ${ageGap} years (Max is 10)`);
        }

        if (reasons.length > 0) {
          // Log reasons for these two potential matching
          specificMismatchHistory.push(`${f2.name}: ${reasons.join(', ')}`);
          unmatchedReasons[f1.id].push(`Cannot match with ${f2.name}: ${reasons.join(', ')}`);
          unmatchedReasons[f2.id].push(`Cannot match with ${f1.name}: ${reasons.join(', ')}`);
          continue;
        }

        // Calculate Elo differences including BJJ Belts handicap bonus
        const elo1 = getSportElo(f1, sport);
        const elo2 = getSportElo(f2, sport);
        
        let beltPenalty = 0;
        if (sport === 'BJJ') {
          const rank1 = BELT_RANKS[f1.bjjBelt] ?? 0;
          const rank2 = BELT_RANKS[f2.bjjBelt] ?? 0;
          const rankDiff = rank1 - rank2;
          // +50 Elo bonus per belt difference applied as a premium
          beltPenalty = Math.abs(rankDiff) * 50;
        }

        // Incorporate belt handicap to find best relative balance
        const baseEloDiff = Math.abs(elo1 - elo2);
        const adjustedEloDiff = baseEloDiff + beltPenalty;

        if (adjustedEloDiff < minEloDiff) {
          minEloDiff = adjustedEloDiff;
          bestOpponent = f2;
          calculatedBeltPenalty = beltPenalty;
        }
      }

      if (bestOpponent) {
        // We have a successful match!
        matchedInGroup.add(f1.id);
        matchedInGroup.add(bestOpponent.id);
        pairedFighterIds.add(f1.id);
        pairedFighterIds.add(bestOpponent.id);

        const elo1 = getSportElo(f1, sport);
        const elo2 = getSportElo(bestOpponent, sport);

        matches.push({
          fighterRed: f1, // Temporary Red corner assignment, finalized in Corner Logic
          fighterBlue: bestOpponent,
          sport,
          weightClass: f1.weightClass,
          eloDiff: Math.abs(elo1 - elo2),
          beltDiffPenalty: calculatedBeltPenalty > 0 ? calculatedBeltPenalty : undefined,
        });
      } else {
        // No match found in this loop for f1
        if (unmatchedReasons[f1.id].length === 0) {
          unmatchedReasons[f1.id].push(`No available opponents in ${f1.gender} ${f1.weightClass} division`);
        }
      }
    }
  }

  // Find overall unmatched fighters
  const unmatched: MismatchReason[] = fighters
    .filter(f => !pairedFighterIds.has(f.id))
    .map(f => {
      const uniqueReasons = Array.from(new Set(unmatchedReasons[f.id]));
      return {
        fighterName: f.name,
        reasons: uniqueReasons.length > 0 ? uniqueReasons : [`No available matches found in division`],
      };
    });

  return {
    matches,
    unmatched,
  };
}

/**
 * Smart Corner & Locker Room Logic
 * Loops through tournament matches, tracking gym corner weights to pool teammates.
 * Gym A gets associated to Red, Gym B gets associated to Blue.
 */
export interface CornerAssignment {
  fighterRedId: string;
  fighterBlueId: string;
  redGym: string;
  blueGym: string;
  fighterRedCorner: 'RED' | 'BLUE';
  fighterBlueCorner: 'RED' | 'BLUE';
}

export function assignSmartCorners(
  matches: { fighterRed: Fighter; fighterBlue: Fighter; sport: Sport; weightClass: WeightClass }[]
): CornerAssignment[] {
  // Keeps track of which corner each gym has been associated with and how strongly
  const gymCornerWeights: Record<string, { RED: number; BLUE: number }> = {};

  const getGymWeight = (gym: string) => {
    const cleanStr = gym.trim().toLowerCase();
    if (!gymCornerWeights[cleanStr]) {
      gymCornerWeights[cleanStr] = { RED: 0, BLUE: 0 };
    }
    return gymCornerWeights[cleanStr];
  };

  return matches.map(m => {
    const fRed = m.fighterRed;
    const fBlue = m.fighterBlue;

    const gymRed = fRed.gym;
    const gymBlue = fBlue.gym;

    const rWeights = getGymWeight(gymRed);
    const bWeights = getGymWeight(gymBlue);

    // Evaluate current corner affinity for both gyms
    // We want to maximize the division: teammates in same corners, opponents split
    const scoreRedInRed = rWeights.RED + bWeights.BLUE;
    const scoreRedInBlue = rWeights.BLUE + bWeights.RED;

    let assignedRedCorner: 'RED' | 'BLUE' = 'RED';
    let assignedBlueCorner: 'RED' | 'BLUE' = 'BLUE';

    if (scoreRedInBlue > scoreRedInRed) {
      // It is structurally better to assign fRed to Blue Corner and fBlue to Red Corner
      assignedRedCorner = 'BLUE';
      assignedBlueCorner = 'RED';
      
      // Update historical gym counts
      rWeights.BLUE += 1;
      bWeights.RED += 1;
    } else {
      // Default: fRed gets RED, fBlue gets BLUE
      assignedRedCorner = 'RED';
      assignedBlueCorner = 'BLUE';

      rWeights.RED += 1;
      bWeights.BLUE += 1;
    }

    return {
      fighterRedId: fRed.id,
      fighterBlueId: fBlue.id,
      redGym: gymRed,
      blueGym: gymBlue,
      fighterRedCorner: assignedRedCorner,
      fighterBlueCorner: assignedBlueCorner,
    };
  });
}

/**
 * Derived-State Runtime Timings Calculator
 * Steps down sorted list of bouts to assign realwalkout times.
 */
export function calculateWalkoutTimings(
  boutsCount: number,
  startTimeStr: string,
  minutesPerFight: number
): string[] {
  const times: string[] = [];
  if (boutsCount <= 0) return times;

  const [startHour, startMin] = startTimeStr.split(':').map(Number);
  let currentMinutes = (isNaN(startHour) ? 18 : startHour) * 60 + (isNaN(startMin) ? 0 : startMin);

  for (let i = 0; i < boutsCount; i++) {
    const hr = Math.floor(currentMinutes / 60) % 24;
    const min = currentMinutes % 60;
    const formattedTime = `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    times.push(formattedTime);
    currentMinutes += minutesPerFight;
  }

  return times;
}
