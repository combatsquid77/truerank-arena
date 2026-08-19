export type UserRole = 'PROMOTER' | 'FIGHTER' | 'ADMIN';

export type Sport = 'MMA' | 'BJJ' | 'MT' | 'BOXING';

export type BjjBelt = 'WHITE' | 'BLUE' | 'PURPLE' | 'BROWN' | 'BLACK';

export type Gender = 'MALE' | 'FEMALE';

export type WeightClass = '-63kg' | '-68kg' | '-73kg' | '-78kg' | '-85kg' | '-91kg' | '100kg+';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Fighter {
  id: string;
  userId: string;
  name: string;
  gym: string;
  location: string;
  age: number;
  gender: Gender;
  weightClass: WeightClass;
  bjjBelt: BjjBelt;
  lastFightDate: string; // ISO format
  
  // MMA records
  mmaWins: number;
  mmaLosses: number;
  mmaDraws: number;
  mmaElo: number;

  // BJJ records
  bjjWins: number;
  bjjLosses: number;
  bjjDraws: number;
  bjjElo: number;

  // Muay Thai records
  mtWins: number;
  mtLosses: number;
  mtDraws: number;
  mtElo: number;

  // Boxing records
  boxingWins: number;
  boxingLosses: number;
  boxingDraws: number;
  boxingElo: number;
}

export interface Event {
  id: string;
  name: string;
  date: string; // ISO String normalized via new Date(body.date).toISOString()
  location: string;
  promoterId: string;
  fighterIds: string[]; // Many-to-many implicit relationship
  weighInDate: string;
  weighInTime: string;
  promoEvents: string;
  published: boolean;
  started: boolean;
}

export interface EventRequest {
  id: string;
  fighterId: string;
  eventId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ScheduledBout {
  id: string;
  eventId: string;
  fighterRedId: string;
  fighterBlueId: string;
  sport: Sport;
  weightClass: string;
  boutOrder: number; // default 0
  
  // Assigned dynamically based on Smart Corner logic
  fighterRedCorner: 'RED' | 'BLUE';
  fighterBlueCorner: 'RED' | 'BLUE';
  
  // Walkout time calculated at runtime
  walkoutTime?: string;

  confirmedWeight: string;
  cardType: 'TITLE' | 'MAIN' | 'UNDER';
  completed: boolean;
  winnerId?: string | null;
  method?: string | null;
  completedAt?: string | null;
}

export interface MatchResult {
  id: string;
  boutId: string;
  winnerId: string | null; // null represents draw or pending
  method: string;
  boutOrder: number;
}

// Structures for matchmaking
export interface MismatchReason {
  fighterName: string;
  reasons: string[];
}

export interface MatchmakingResult {
  matches: {
    fighterRed: Fighter;
    fighterBlue: Fighter;
    sport: Sport;
    weightClass: WeightClass;
    eloDiff: number;
    beltDiffPenalty?: number; // for BJJ +50 Elo bonus per belt rank difference
  }[];
  unmatched: MismatchReason[];
}
