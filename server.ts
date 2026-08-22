import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Fighter, Event, EventRequest, ScheduledBout, MatchResult, Sport, User, BjjBelt, Gender, WeightClass } from './src/types';
import { matchmakeRoster, assignSmartCorners, calculateWalkoutTimings, getSportElo } from './src/matchmaker';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function updateFighterResult(
  fighter: Fighter,
  opponent: Fighter,
  sport: Sport,
  outcome: 'WIN' | 'LOSS' | 'DRAW'
) {
  const K = 32;
  
  let eloField: keyof Fighter;
  let winsField: keyof Fighter;
  let lossesField: keyof Fighter;
  let drawsField: keyof Fighter;

  switch (sport) {
    case 'MMA':
      eloField = 'mmaElo';
      winsField = 'mmaWins';
      lossesField = 'mmaLosses';
      drawsField = 'mmaDraws';
      break;
    case 'BJJ':
      eloField = 'bjjElo';
      winsField = 'bjjWins';
      lossesField = 'bjjLosses';
      drawsField = 'bjjDraws';
      break;
    case 'MT':
      eloField = 'mtElo';
      winsField = 'mtWins';
      lossesField = 'mtLosses';
      drawsField = 'mtDraws';
      break;
    case 'BOXING':
      eloField = 'boxingElo';
      winsField = 'boxingWins';
      lossesField = 'boxingLosses';
      drawsField = 'boxingDraws';
      break;
    default:
      return;
  }

  const oldElo = fighter[eloField] as number;
  const oppElo = opponent[eloField] as number;

  const expected = 1 / (1 + Math.pow(10, (oppElo - oldElo) / 400));
  
  let actual = 0.5;
  if (outcome === 'WIN') {
    actual = 1;
    (fighter[winsField] as number)++;
  } else if (outcome === 'LOSS') {
    actual = 0;
    (fighter[lossesField] as number)++;
  } else {
    actual = 0.5;
    (fighter[drawsField] as number)++;
  }

  const newElo = Math.round(oldElo + K * (actual - expected));
  (fighter[eloField] as any) = newElo;
  fighter.lastFightDate = new Date().toISOString();
}

function calculateDynamicWalkouts(event: Event, bouts: ScheduledBout[], minutesPerFight = 15): Record<string, string> {
  const sorted = [...bouts].filter(b => b.eventId === event.id).sort((a, b) => a.boutOrder - b.boutOrder);
  const result: Record<string, string> = {}; 
  
  let currentBaseTime = new Date(event.date).getTime();

  const completedBouts = sorted.filter(b => b.completed && b.completedAt);
  if (completedBouts.length > 0) {
    const lastCompleted = completedBouts[completedBouts.length - 1];
    if (lastCompleted.completedAt) {
      currentBaseTime = new Date(lastCompleted.completedAt).getTime() + (minutesPerFight * 60 * 1000);
    }
  }

  let uncompletedIndex = 0;
  sorted.forEach((bout) => {
    if (bout.completed && bout.completedAt) {
      result[bout.id] = new Date(bout.completedAt).toISOString();
    } else {
      const time = currentBaseTime + (uncompletedIndex * minutesPerFight * 60 * 1000);
      result[bout.id] = new Date(time).toISOString();
      uncompletedIndex++;
    }
  });

  return result;
}

// Initialize in-memory database with rich high-quality seed records
const seedUsers: User[] = [
  { id: 'u-1', email: 'promoter@truerank.uk', name: 'Marcus "The Matchmaker" Silva', role: 'PROMOTER' },
  { id: 'u-2', email: 'admin@truerank.uk', name: 'TrueRank Chief Commissioner', role: 'ADMIN' },
  { id: 'u-3', email: 'rdrt.rt@gmail.com', name: 'Fighter Jordan "Apex" Smith', role: 'FIGHTER' },
  { id: 'f-user-1', email: 'alex@volkan.com', name: 'Alex Volkan', role: 'FIGHTER' },
  { id: 'f-user-2', email: 'khabib@aka.com', name: 'Khabib Nurmag', role: 'FIGHTER' },
  { id: 'f-user-3', email: 'islam@aka.com', name: 'Islam Macha', role: 'FIGHTER' },
  { id: 'f-user-4', email: 'charles@chuteboxe.com', name: 'Charles Oliver', role: 'FIGHTER' },
  { id: 'f-user-5', email: 'israel@citykick.com', name: 'Israel Ades', role: 'FIGHTER' },
  { id: 'f-user-6', email: 'alex@teixeira.com', name: 'Alex Pereir', role: 'FIGHTER' },
  { id: 'f-user-7', email: 'oldtimer@legacy.com', name: 'Master Helio', role: 'FIGHTER' },
  { id: 'f-user-8', email: 'junior@chuteboxe.com', name: 'Junior Silva', role: 'FIGHTER' },
];

const seedFighters: Fighter[] = [
  {
    id: 'f-3', // Linked to authenticated user rdrt.rt@gmail.com
    userId: 'u-3',
    name: 'Jordan "Apex" Smith',
    gym: 'Apex Performance',
    location: 'Denver, CO',
    age: 26,
    gender: 'MALE',
    weightClass: '-73kg',
    bjjBelt: 'PURPLE',
    lastFightDate: '2026-03-10T12:00:00.000Z',
    mmaWins: 14, mmaLosses: 3, mmaDraws: 1, mmaElo: 1420,
    bjjWins: 20, bjjLosses: 2, bjjDraws: 0, bjjElo: 1350,
    mtWins: 5, mtLosses: 1, mtDraws: 0, mtElo: 1250,
    boxingWins: 10, boxingLosses: 2, boxingDraws: 1, boxingElo: 1300
  },
  {
    id: 'f-1',
    userId: 'f-user-1',
    name: 'Alex Volkan',
    gym: 'City Kickboxing',
    location: 'Auckland, NZ',
    age: 33,
    gender: 'MALE',
    weightClass: '-68kg',
    bjjBelt: 'BLACK',
    lastFightDate: '2026-01-15T12:00:00.000Z',
    mmaWins: 26, mmaLosses: 4, mmaDraws: 0, mmaElo: 1550,
    bjjWins: 15, bjjLosses: 1, bjjDraws: 0, bjjElo: 1480,
    mtWins: 12, mtLosses: 0, mtDraws: 0, mtElo: 1450,
    boxingWins: 8, boxingLosses: 2, boxingDraws: 0, boxingElo: 1320
  },
  {
    id: 'f-2',
    userId: 'f-user-2',
    name: 'Khabib Nurmag',
    gym: 'AKA Gym',
    location: 'Dagestan, RU',
    age: 34,
    gender: 'MALE',
    weightClass: '-73kg',
    bjjBelt: 'BLACK',
    lastFightDate: '2025-10-20T12:00:00.000Z',
    mmaWins: 29, mmaLosses: 0, mmaDraws: 0, mmaElo: 1620,
    bjjWins: 25, bjjLosses: 0, bjjDraws: 0, bjjElo: 1580,
    mtWins: 4, mtLosses: 0, mtDraws: 0, mtElo: 1220,
    boxingWins: 2, boxingLosses: 1, boxingDraws: 0, boxingElo: 1180
  },
  {
    id: 'f-4',
    userId: 'f-user-4',
    name: 'Charles Oliver',
    gym: 'Chute Boxe',
    location: 'São Paulo, BR',
    age: 34,
    gender: 'MALE',
    weightClass: '-73kg',
    bjjBelt: 'BLACK',
    lastFightDate: '2026-05-18T12:00:00.000Z',
    mmaWins: 34, mmaLosses: 9, mmaDraws: 0, mmaElo: 1510,
    bjjWins: 42, bjjLosses: 4, bjjDraws: 1, bjjElo: 1610,
    mtWins: 8, mtLosses: 2, mtDraws: 0, mtElo: 1300,
    boxingWins: 4, boxingLosses: 1, boxingDraws: 0, boxingElo: 1210
  },
  {
    id: 'f-3-teammate', // AKA Gym teammate to test same-gym matchup prevention
    userId: 'f-user-3',
    name: 'Islam Macha',
    gym: 'AKA Gym',
    location: 'Dagestan, RU',
    age: 32,
    gender: 'MALE',
    weightClass: '-73kg',
    bjjBelt: 'PURPLE',
    lastFightDate: '2026-04-12T12:00:00.000Z',
    mmaWins: 25, mmaLosses: 1, mmaDraws: 0, mmaElo: 1590,
    bjjWins: 18, bjjLosses: 1, bjjDraws: 0, bjjElo: 1510,
    mtWins: 6, mtLosses: 1, mtDraws: 0, mtElo: 1280,
    boxingWins: 3, boxingLosses: 0, boxingDraws: 1, boxingElo: 1220
  },
  {
    id: 'f-5',
    userId: 'f-user-5',
    name: 'Israel Ades',
    gym: 'City Kickboxing',
    location: 'Auckland, NZ',
    age: 34,
    gender: 'MALE',
    weightClass: '-85kg',
    bjjBelt: 'PURPLE',
    lastFightDate: '2026-02-14T12:00:00.000Z',
    mmaWins: 24, mmaLosses: 3, mmaDraws: 0, mmaElo: 1480,
    bjjWins: 8, bjjLosses: 2, bjjDraws: 0, bjjElo: 1240,
    mtWins: 75, mtLosses: 5, mtDraws: 0, mtElo: 1650,
    boxingWins: 5, boxingLosses: 1, boxingDraws: 0, boxingElo: 1280
  },
  {
    id: 'f-6',
    userId: 'f-user-6',
    name: 'Alex Pereir',
    gym: 'Teixeira MMA',
    location: 'Danbury, CT',
    age: 36,
    gender: 'MALE',
    weightClass: '-85kg',
    bjjBelt: 'BROWN',
    lastFightDate: '2026-05-30T12:00:00.000Z',
    mmaWins: 11, mmaLosses: 2, mmaDraws: 0, mmaElo: 1520,
    bjjWins: 4, bjjLosses: 1, bjjDraws: 0, bjjElo: 1300,
    mtWins: 33, mtLosses: 7, mtDraws: 0, mtElo: 1680,
    boxingWins: 1, boxingLosses: 0, boxingDraws: 0, boxingElo: 1150
  },
  {
    id: 'f-7', // Test age gap (55 vs 26 or 34 is blocker)
    userId: 'f-user-7',
    name: 'Master Helio',
    gym: 'Legacy Gym',
    location: 'Rio de Janeiro, BR',
    age: 58,
    gender: 'MALE',
    weightClass: '-73kg',
    bjjBelt: 'BLACK',
    lastFightDate: '2015-05-18T10:00:00.000Z', // Inactive (dormant > 12 months)
    mmaWins: 10, mmaLosses: 1, mmaDraws: 2, mmaElo: 1300,
    bjjWins: 50, bjjLosses: 0, bjjDraws: 0, bjjElo: 1650,
    mtWins: 0, mtLosses: 0, mtDraws: 0, mtElo: 1200,
    boxingWins: 0, boxingLosses: 0, boxingDraws: 0, boxingElo: 1200
  },
  {
    id: 'f-8', // Junior under 100kg+
    userId: 'f-user-8',
    name: 'Junior Silva',
    gym: 'Chute Boxe',
    location: 'Curitiba, BR',
    age: 22,
    gender: 'MALE',
    weightClass: '-73kg',
    bjjBelt: 'BLUE',
    lastFightDate: '2026-01-20T12:00:00.000Z',
    mmaWins: 4, mmaLosses: 1, mmaDraws: 0, mmaElo: 1240,
    bjjWins: 6, bjjLosses: 1, bjjDraws: 0, bjjElo: 1260,
    mtWins: 5, mtLosses: 1, mtDraws: 0, mtElo: 1250,
    boxingWins: 2, boxingLosses: 0, boxingDraws: 0, boxingElo: 1220
  },
];

const seedEvents: Event[] = [
  {
    id: 'e-1',
    name: 'TrueRank Arena: Collision Course',
    date: '2026-07-20T18:00:00.000Z',
    location: 'London Wembley Arena, UK',
    promoterId: 'u-1',
    fighterIds: ['f-3', 'f-1', 'f-2', 'f-4', 'f-3-teammate', 'f-5', 'f-6'],
    weighInDate: '2026-07-19',
    weighInTime: '09:00',
    promoEvents: 'Pre-fight Press Conference (14:00), Media Face-offs (16:30)',
    published: true,
    started: false,
  },
  {
    id: 'e-2',
    name: 'Downtown MT & Boxing Super-Slam',
    date: '2026-08-15T19:00:00.000Z',
    location: 'Las Vegas Grand Garden, NV',
    promoterId: 'u-1',
    fighterIds: ['f-1', 'f-5', 'f-6'],
    weighInDate: '',
    weighInTime: '',
    promoEvents: '',
    published: false,
    started: false,
  },
];

const seedRequests: EventRequest[] = [
  { id: 'req-1', fighterId: 'f-8', eventId: 'e-1', status: 'PENDING' },
];

const seedScheduledBouts: ScheduledBout[] = [
  {
    id: 'bout-1',
    eventId: 'e-1',
    fighterRedId: 'f-5',
    fighterBlueId: 'f-6',
    sport: 'MMA',
    weightClass: '-85kg',
    boutOrder: 0,
    fighterRedCorner: 'RED',
    fighterBlueCorner: 'BLUE',
    confirmedWeight: '84.8 kg',
    cardType: 'TITLE',
    completed: false,
    winnerId: null,
    method: null,
    completedAt: null,
  },
  {
    id: 'bout-2',
    eventId: 'e-1',
    fighterRedId: 'f-2',
    fighterBlueId: 'f-4',
    sport: 'BJJ',
    weightClass: '-73kg',
    boutOrder: 1,
    fighterRedCorner: 'RED',
    fighterBlueCorner: 'BLUE',
    confirmedWeight: '73.0 kg',
    cardType: 'MAIN',
    completed: false,
    winnerId: null,
    method: null,
    completedAt: null,
  },
];

const seedMatchResults: MatchResult[] = [
  { id: 'res-1', boutId: 'bout-1', winnerId: 'f-6', method: 'KO (Left Hook)', boutOrder: 0 },
];

async function seedDatabase() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  console.log("Seeding database with default records...");

  for (const u of seedUsers) {
    await prisma.user.create({
      data: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        password: hashPassword("password"),
        onboarded: true,
      }
    });
  }

  for (const f of seedFighters) {
    await prisma.fighter.create({
      data: {
        id: f.id,
        userId: f.userId,
        gym: f.gym,
        location: f.location || "Unknown",
        age: f.age,
        gender: f.gender,
        weightClass: f.weightClass,
        bjjBelt: f.bjjBelt,
        mmaWins: f.mmaWins,
        mmaLosses: f.mmaLosses,
        mmaDraws: f.mmaDraws,
        mmaElo: f.mmaElo,
        bjjWins: f.bjjWins,
        bjjLosses: f.bjjLosses,
        bjjDraws: f.bjjDraws,
        bjjElo: f.bjjElo,
        mtWins: f.mtWins,
        mtLosses: f.mtLosses,
        mtDraws: f.mtDraws,
        mtElo: f.mtElo,
        boxingWins: f.boxingWins,
        boxingLosses: f.boxingLosses,
        boxingDraws: f.boxingDraws,
        boxingElo: f.boxingElo,
      }
    });
  }

  for (const e of seedEvents) {
    await prisma.event.create({
      data: {
        id: e.id,
        name: e.name,
        date: new Date(e.date),
        location: e.location,
        weighInDate: e.weighInDate || '',
        weighInTime: e.weighInTime || '',
        promoEvents: e.promoEvents || '',
        published: e.published || false,
        started: e.started || false,
        promoterId: e.promoterId,
        fighters: {
          connect: e.fighterIds.map(fid => ({ id: fid }))
        }
      }
    });
  }

  for (const r of seedRequests) {
    await prisma.eventRequest.create({
      data: {
        id: r.id,
        eventId: r.eventId,
        fighterId: r.fighterId,
        status: r.status,
      }
    });
  }

  for (const b of seedScheduledBouts) {
    await prisma.scheduledBout.create({
      data: {
        id: b.id,
        eventId: b.eventId,
        fighterRedId: b.fighterRedId,
        fighterBlueId: b.fighterBlueId,
        sport: b.sport,
        weightClass: b.weightClass,
        boutOrder: b.boutOrder,
        confirmedWeight: b.confirmedWeight || '',
        cardType: b.cardType || 'UNDER',
        completed: b.completed || false,
        winnerId: b.winnerId,
        method: b.method,
        completedAt: b.completedAt ? new Date(b.completedAt) : null,
      }
    });
  }

  console.log("Database seeded successfully!");
}

async function startServer() {
  // Ensure the SQLite directory exists if running in file mode
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('file:')) {
    const dbPath = dbUrl.replace('file:', '');
    const dbDir = path.dirname(dbPath);
    if (dbDir && !fs.existsSync(dbDir)) {
      console.log(`Creating database directory: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // OWASP Top 10 Hardened Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
    next();
  });

  // Run database self-seeding on startup
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Error seeding database:", err);
  }

  // API ROUTES

  // 1. Get logged-in user profile simulation
  app.get('/api/me', async (req, res) => {
    try {
      const authenticatedUser = await prisma.user.findFirst({ where: { email: 'rdrt.rt@gmail.com' } });
      if (!authenticatedUser) return res.status(404).json({ error: 'User not found' });
      const fighterProfile = await prisma.fighter.findFirst({ where: { userId: authenticatedUser.id } });
      res.json({
        user: authenticatedUser,
        fighter: fighterProfile
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Authentication & Onboarding Routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required signup fields' });
      }
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      const newUser = await prisma.user.create({
        data: {
          id: `u-${Date.now()}`,
          email,
          name,
          password: hashPassword(password),
          role: 'PENDING',
          onboarded: false,
        }
      });
      res.json({ token: newUser.id, user: newUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      res.json({ token: user.id, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const userId = req.headers.authorization;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ error: 'User session invalid' });
      }
      const fighter = await prisma.fighter.findFirst({ where: { userId: user.id } });
      res.json({ user, fighter });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/onboard', async (req, res) => {
    try {
      const userId = req.headers.authorization;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ error: 'User invalid' });
      }

      const { role, fighterDetails, promoterDetails } = req.body;
      if (!role || !['FIGHTER', 'PROMOTER', 'JUDGE'].includes(role)) {
        return res.status(400).json({ error: 'Invalid persona selection' });
      }

      if (role === 'PROMOTER' && promoterDetails) {
        const { orgName, sanctionName, locationName, websiteName } = promoterDetails;
        await prisma.user.update({
          where: { id: userId },
          data: {
            role,
            onboarded: true,
            promoterOrg: orgName || '',
            promoterSanction: sanctionName || '',
            promoterLocation: locationName || '',
            promoterWebsite: websiteName || '',
          }
        });
      } else {
        await prisma.user.update({
          where: { id: userId },
          data: {
            role,
            onboarded: true,
          }
        });
      }

      let createdFighterProfile = null;
      if (role === 'FIGHTER' && fighterDetails) {
        const { 
          gym, location, age, gender, weightClass, bjjBelt, titles,
          mmaWins = 0, mmaLosses = 0, mmaDraws = 0,
          bjjWins = 0, bjjLosses = 0, bjjDraws = 0,
          mtWins = 0, mtLosses = 0, mtDraws = 0,
          boxingWins = 0, boxingLosses = 0, boxingDraws = 0
        } = fighterDetails;

        createdFighterProfile = await prisma.fighter.create({
          data: {
            id: `f-${Date.now()}`,
            userId: user.id,
            gym: gym || 'Independent',
            location: location || 'Unknown',
            age: parseInt(age) || 25,
            gender: gender || 'MALE',
            weightClass: weightClass || '-73kg',
            bjjBelt: bjjBelt || 'WHITE',
            titles: titles || '',
            mmaWins: parseInt(mmaWins) || 0,
            mmaLosses: parseInt(mmaLosses) || 0,
            mmaDraws: parseInt(mmaDraws) || 0,
            mmaElo: 1200 + ((parseInt(mmaWins) || 0) * 15) - ((parseInt(mmaLosses) || 0) * 10),
            bjjWins: parseInt(bjjWins) || 0,
            bjjLosses: parseInt(bjjLosses) || 0,
            bjjDraws: parseInt(bjjDraws) || 0,
            bjjElo: 1200 + ((parseInt(bjjWins) || 0) * 15) - ((parseInt(bjjLosses) || 0) * 10),
            mtWins: parseInt(mtWins) || 0,
            mtLosses: parseInt(mtLosses) || 0,
            mtDraws: parseInt(mtDraws) || 0,
            mtElo: 1200 + ((parseInt(mtWins) || 0) * 15) - ((parseInt(mtLosses) || 0) * 10),
            boxingWins: parseInt(boxingWins) || 0,
            boxingLosses: parseInt(boxingLosses) || 0,
            boxingDraws: parseInt(boxingDraws) || 0,
            boxingElo: 1200 + ((parseInt(boxingWins) || 0) * 15) - ((parseInt(boxingLosses) || 0) * 10),
          }
        });
      }

      const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
      res.json({
        user: updatedUser,
        fighter: createdFighterProfile,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Global lists
  app.get('/api/fighters', async (req, res) => {
    try {
      const allFighters = await prisma.fighter.findMany();
      const usersList = await prisma.user.findMany();
      const mapped = allFighters.map(f => {
        const u = usersList.find(user => user.id === f.userId);
        return {
          ...f,
          name: u?.name || 'Unknown Fighter'
        };
      });
      res.json(mapped);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/events', async (req, res) => {
    try {
      const allEvents = await prisma.event.findMany({
        include: { fighters: true }
      });
      const mapped = allEvents.map(e => ({
        id: e.id,
        name: e.name,
        date: e.date.toISOString(),
        location: e.location,
        weighInDate: e.weighInDate,
        weighInTime: e.weighInTime,
        promoEvents: e.promoEvents,
        published: e.published,
        started: e.started,
        promoterId: e.promoterId,
        fighterIds: e.fighters.map(f => f.id)
      }));
      res.json(mapped);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/events/:eventId', async (req, res) => {
    try {
      const { eventId } = req.params;
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          bouts: true,
          fighters: true
        }
      });
      if (!event) return res.status(404).json({ error: 'Event not found' });
      
      const allFighters = await prisma.fighter.findMany();
      const eventFighters = allFighters.filter(f => event.fighters.some(ef => ef.id === f.id));
      const usersList = await prisma.user.findMany();
      const rosterFighters = eventFighters.map(f => {
        const u = usersList.find(user => user.id === f.userId);
        return {
          ...f,
          name: u?.name || 'Unknown Fighter'
        };
      });

      const eventRequests = await prisma.eventRequest.findMany({ where: { eventId } });

      res.json({
        event: {
          id: event.id,
          name: event.name,
          date: event.date.toISOString(),
          location: event.location,
          weighInDate: event.weighInDate,
          weighInTime: event.weighInTime,
          promoEvents: event.promoEvents,
          published: event.published,
          started: event.started,
          promoterId: event.promoterId,
          fighterIds: event.fighters.map(f => f.id)
        },
        roster: rosterFighters,
        bouts: event.bouts.map(b => ({
          id: b.id,
          eventId: b.eventId,
          fighterRedId: b.fighterRedId,
          fighterBlueId: b.fighterBlueId,
          sport: b.sport,
          weightClass: b.weightClass,
          boutOrder: b.boutOrder,
          fighterRedCorner: b.fighterRedCorner,
          fighterBlueCorner: b.fighterBlueCorner,
          confirmedWeight: b.confirmedWeight,
          cardType: b.cardType,
          completed: b.completed,
          winnerId: b.winnerId,
          method: b.method,
          completedAt: b.completedAt?.toISOString() || null
        })),
        requests: eventRequests.map(r => ({
          id: r.id,
          fighterId: r.fighterId,
          eventId: r.eventId,
          status: r.status
        }))
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Create standalone event
  app.post('/api/events', async (req, res) => {
    try {
      const { name, date, location, promoterId } = req.body;
      if (!name || !date || !location) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      const standardizedDate = new Date(date);
      if (isNaN(standardizedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid ISO date time format' });
      }

      const newEvent = await prisma.event.create({
        data: {
          id: `e-${Date.now()}`,
          name,
          date: standardizedDate,
          location,
          promoterId: promoterId || 'u-1',
          weighInDate: '',
          weighInTime: '',
          promoEvents: '',
          published: false,
          started: false,
        }
      });

      res.json({
        id: newEvent.id,
        name: newEvent.name,
        date: newEvent.date.toISOString(),
        location: newEvent.location,
        weighInDate: newEvent.weighInDate,
        weighInTime: newEvent.weighInTime,
        promoEvents: newEvent.promoEvents,
        published: newEvent.published,
        started: newEvent.started,
        promoterId: newEvent.promoterId,
        fighterIds: []
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Batch Import competitors from raw CSV text
  app.post('/api/upload-csv', async (req, res) => {
    try {
      const { csvContent } = req.body;
      if (!csvContent || typeof csvContent !== 'string') {
        return res.status(400).json({ error: 'No CSV content supplied' });
      }

      const parseRecord = (recStr: string | undefined): { wins: number; losses: number; draws: number } => {
        if (!recStr) return { wins: 0, losses: 0, draws: 0 };
        const clean = recStr.trim();
        const parts = clean.split('-');
        return {
          wins: parseInt(parts[0]) || 0,
          losses: parseInt(parts[1]) || 0,
          draws: parseInt(parts[2]) || 0,
        };
      };

      const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) {
        return res.status(400).json({ error: 'CSV is empty or missing data rows' });
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const createdFighters = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values: string[] = [];
        let insideQuote = false;
        let currentValue = '';
        for (let char of line) {
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx]?.replace(/^"|"$/g, '') || '';
        });

        const name = row['Name'] || `Guest Fighter ${Date.now()}-${i}`;
        const email = row['email'] || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@truerank.uk`;
        const gym = row['Gym'] || 'Independent';
        const location = row['Location'] || 'Unknown';
        const age = parseInt(row['Age'] || '25') || 25;
        const gender = (row['Gender'] || 'MALE').toUpperCase();
        const weightClass = row['Class'] || '-73kg';
        const bjjBelt = (row['BjjBelt'] || 'WHITE').toUpperCase();

        const mmaRec = parseRecord(row['mmaRecord']);
        const bjjRec = parseRecord(row['bjjRecord']);
        const mtRec = parseRecord(row['mtRecord']);
        const boxingRec = parseRecord(row['boxingRecord']);

        let userObj = await prisma.user.findUnique({ where: { email } });
        if (!userObj) {
          userObj = await prisma.user.create({
            data: {
              id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              email,
              name,
              role: 'FIGHTER'
            }
          });
        }

        let fProfile = await prisma.fighter.findUnique({ where: { userId: userObj.id } });
        if (!fProfile) {
          fProfile = await prisma.fighter.create({
            data: {
              id: `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              userId: userObj.id,
              gym,
              location,
              age,
              gender,
              weightClass,
              bjjBelt,
              mmaWins: mmaRec.wins,
              mmaLosses: mmaRec.losses,
              mmaDraws: mmaRec.draws,
              mmaElo: 1200 + (mmaRec.wins * 15) - (mmaRec.losses * 10),
              bjjWins: bjjRec.wins,
              bjjLosses: bjjRec.losses,
              bjjDraws: bjjRec.draws,
              bjjElo: 1200 + (bjjRec.wins * 15) - (bjjRec.losses * 10),
              mtWins: mtRec.wins,
              mtLosses: mtRec.losses,
              mtDraws: mtRec.draws,
              mtElo: 1200 + (mtRec.wins * 15) - (mtRec.losses * 10),
              boxingWins: boxingRec.wins,
              boxingLosses: boxingRec.losses,
              boxingDraws: boxingRec.draws,
              boxingElo: 1200 + (boxingRec.wins * 15) - (boxingRec.losses * 10),
            }
          });
        } else {
          fProfile = await prisma.fighter.update({
            where: { userId: userObj.id },
            data: {
              gym,
              location,
              age,
              gender,
              weightClass,
              bjjBelt,
              mmaWins: mmaRec.wins,
              mmaLosses: mmaRec.losses,
              mmaDraws: mmaRec.draws,
              mmaElo: 1200 + (mmaRec.wins * 15) - (mmaRec.losses * 10),
              bjjWins: bjjRec.wins,
              bjjLosses: bjjRec.losses,
              bjjDraws: bjjRec.draws,
              bjjElo: 1200 + (bjjRec.wins * 15) - (bjjRec.losses * 10),
              mtWins: mtRec.wins,
              mtLosses: mtRec.losses,
              mtDraws: mtRec.draws,
              mtElo: 1200 + (mtRec.wins * 15) - (mtRec.losses * 10),
              boxingWins: boxingRec.wins,
              boxingLosses: boxingRec.losses,
              boxingDraws: boxingRec.draws,
              boxingElo: 1200 + (boxingRec.wins * 15) - (boxingRec.losses * 10),
            }
          });
        }

        createdFighters.push({
          ...fProfile,
          name: userObj.name
        });
      }

      res.json({
        success: true,
        message: `Successfully processed CSV file and imported/updated ${createdFighters.length} fighters!`,
        fighters: createdFighters,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Run Matchmaker
  app.post('/api/events/:eventId/matchmaker', async (req, res) => {
    try {
      const userId = req.headers.authorization;
      const user = await prisma.user.findFirst({ where: { id: userId } });
      if (!user || (user.role !== 'PROMOTER' && user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Requires Promoter credentials' });
      }

      const { eventId } = req.params;
      const { sport } = req.body;

      if (!sport) return res.status(400).json({ error: 'sport parameter is required' });

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { fighters: true }
      });
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const allFighters = await prisma.fighter.findMany();
      const eventFighters = allFighters.filter(f => event.fighters.some(ef => ef.id === f.id));
      
      const matchmakingResult = matchmakeRoster(eventFighters as any, sport as Sport);
      res.json(matchmakingResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Commit card
  app.post('/api/events/:eventId/commit-card', async (req, res) => {
    try {
      const userId = req.headers.authorization;
      const user = await prisma.user.findFirst({ where: { id: userId } });
      if (!user || (user.role !== 'PROMOTER' && user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Requires Promoter credentials' });
      }

      const { eventId } = req.params;
      const { matches, sport } = req.body;

      if (!matches || !Array.isArray(matches)) {
        return res.status(400).json({ error: 'Invalid or missing matches list' });
      }

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ error: 'Event not found' });

      await prisma.scheduledBout.deleteMany({ where: { eventId } });

      const cornerAssignments = assignSmartCorners(matches);

      for (let index = 0; index < matches.length; index++) {
        const m = matches[index];
        const assignment = cornerAssignments[index];
        await prisma.scheduledBout.create({
          data: {
            id: `bout-${eventId}-${index}-${Date.now()}`,
            eventId,
            fighterRedId: m.fighterRed.id,
            fighterBlueId: m.fighterBlue.id,
            sport: sport as Sport,
            weightClass: m.weightClass,
            boutOrder: index,
            fighterRedCorner: assignment.fighterRedCorner,
            fighterBlueCorner: assignment.fighterBlueCorner,
            confirmedWeight: '',
            cardType: 'UNDER',
            completed: false,
            winnerId: null,
            method: null,
            completedAt: null,
          }
        });
      }

      const finalBouts = await prisma.scheduledBout.findMany({ where: { eventId } });

      res.json({
        success: true,
        message: `Committed ${matches.length} bouts with Smart Corner assignments!`,
        bouts: finalBouts
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Update Settings
  app.post('/api/events/:eventId/publish-settings', async (req, res) => {
    try {
      const userId = req.headers.authorization;
      const user = await prisma.user.findFirst({ where: { id: userId } });
      if (!user || (user.role !== 'PROMOTER' && user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Requires Promoter credentials' });
      }

      const { eventId } = req.params;
      const { weighInDate, weighInTime, promoEvents, published, boutsConfig } = req.body;

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: {
          weighInDate: weighInDate !== undefined ? weighInDate : undefined,
          weighInTime: weighInTime !== undefined ? weighInTime : undefined,
          promoEvents: promoEvents !== undefined ? promoEvents : undefined,
          published: published !== undefined ? published : undefined,
        }
      });

      if (boutsConfig && Array.isArray(boutsConfig)) {
        for (const config of boutsConfig) {
          await prisma.scheduledBout.updateMany({
            where: { id: config.boutId, eventId },
            data: {
              confirmedWeight: config.confirmedWeight !== undefined ? config.confirmedWeight : undefined,
              cardType: config.cardType !== undefined ? config.cardType : undefined,
            }
          });
        }
      }

      const finalBouts = await prisma.scheduledBout.findMany({ where: { eventId } });

      res.json({
        success: true,
        message: `Successfully saved and updated publication settings for event ${updatedEvent.name}!`,
        event: updatedEvent,
        bouts: finalBouts
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8.5 Invite accept bypass
  app.post('/api/invite/:eventId/accept', async (req, res) => {
    try {
      const { eventId } = req.params;
      const { fighterId } = req.body;

      if (!fighterId) {
        return res.status(400).json({ error: 'fighterId parameter is required' });
      }

      const event = await prisma.event.findUnique({ where: { id: eventId }, include: { fighters: true } });
      if (!event) {
        return res.status(404).json({ error: 'Target event not found' });
      }

      const fighterExists = await prisma.fighter.findUnique({ where: { id: fighterId } });
      if (!fighterExists) {
        return res.status(404).json({ error: 'Fighter profile not found' });
      }

      if (!event.fighters.some(f => f.id === fighterId)) {
        await prisma.event.update({
          where: { id: eventId },
          data: {
            fighters: {
              connect: { id: fighterId }
            }
          }
        });
      }

      await prisma.eventRequest.updateMany({
        where: { eventId, fighterId },
        data: { status: 'APPROVED' }
      });

      const updatedEvent = await prisma.event.findUnique({ where: { id: eventId }, include: { fighters: true } });

      res.json({
        success: true,
        message: `VIP Quicklink Bypass successful! Joined event ${event.name}`,
        event: {
          ...updatedEvent,
          date: updatedEvent?.date.toISOString(),
          fighterIds: updatedEvent?.fighters.map(f => f.id)
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8.6 Start Fight Night for an event
  app.post('/api/events/:eventId/start', async (req, res) => {
    try {
      const userId = req.headers.authorization;
      const user = await prisma.user.findFirst({ where: { id: userId } });
      if (!user || (user.role !== 'PROMOTER' && user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Requires Promoter privileges' });
      }

      const { eventId } = req.params;
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
          started: true,
          date: new Date()
        }
      });

      res.json({
        success: true,
        message: `Event ${updated.name} has officially started! Fight Night is live.`,
        event: {
          ...updated,
          date: updated.date.toISOString(),
          fighterIds: []
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8.7 Submit official result for a bout (Judge)
  app.post('/api/events/:eventId/bouts/:boutId/result', async (req, res) => {
    try {
      const userId = req.headers.authorization;
      const user = await prisma.user.findFirst({ where: { id: userId } });
      if (!user || (user.role !== 'JUDGE' && user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Requires Official Judge credentials' });
      }

      const { eventId, boutId } = req.params;
      const { winnerId, method } = req.body;

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const bout = await prisma.scheduledBout.findFirst({ where: { id: boutId, eventId } });
      if (!bout) return res.status(404).json({ error: 'Bout not found' });

      const completedAt = new Date();

      const updatedBout = await prisma.scheduledBout.update({
        where: { id: boutId },
        data: {
          completed: true,
          winnerId: winnerId === 'DRAW' ? null : winnerId,
          method: method || 'Decision',
          completedAt,
        }
      });

      const redFighterObj = await prisma.fighter.findUnique({ where: { id: bout.fighterRedId } });
      const blueFighterObj = await prisma.fighter.findUnique({ where: { id: bout.fighterBlueId } });

      if (redFighterObj && blueFighterObj) {
        const redFighterCopy = { ...redFighterObj, name: '' } as unknown as Fighter;
        const blueFighterCopy = { ...blueFighterObj, name: '' } as unknown as Fighter;

        if (winnerId === bout.fighterRedId) {
          updateFighterResult(redFighterCopy, blueFighterCopy, bout.sport as Sport, 'WIN');
          updateFighterResult(blueFighterCopy, redFighterCopy, bout.sport as Sport, 'LOSS');
        } else if (winnerId === bout.fighterBlueId) {
          updateFighterResult(blueFighterCopy, redFighterCopy, bout.sport as Sport, 'WIN');
          updateFighterResult(redFighterCopy, blueFighterCopy, bout.sport as Sport, 'LOSS');
        } else {
          updateFighterResult(redFighterCopy, blueFighterCopy, bout.sport as Sport, 'DRAW');
          updateFighterResult(blueFighterCopy, redFighterCopy, bout.sport as Sport, 'DRAW');
        }

        await prisma.fighter.update({
          where: { id: bout.fighterRedId },
          data: {
            mmaWins: redFighterCopy.mmaWins,
            mmaLosses: redFighterCopy.mmaLosses,
            mmaDraws: redFighterCopy.mmaDraws,
            mmaElo: redFighterCopy.mmaElo,
            bjjWins: redFighterCopy.bjjWins,
            bjjLosses: redFighterCopy.bjjLosses,
            bjjDraws: redFighterCopy.bjjDraws,
            bjjElo: redFighterCopy.bjjElo,
            mtWins: redFighterCopy.mtWins,
            mtLosses: redFighterCopy.mtLosses,
            mtDraws: redFighterCopy.mtDraws,
            mtElo: redFighterCopy.mtElo,
            boxingWins: redFighterCopy.boxingWins,
            boxingLosses: redFighterCopy.boxingLosses,
            boxingDraws: redFighterCopy.boxingDraws,
            boxingElo: redFighterCopy.boxingElo,
            lastFightDate: new Date(redFighterCopy.lastFightDate),
          }
        });

        await prisma.fighter.update({
          where: { id: bout.fighterBlueId },
          data: {
            mmaWins: blueFighterCopy.mmaWins,
            mmaLosses: blueFighterCopy.mmaLosses,
            mmaDraws: blueFighterCopy.mmaDraws,
            mmaElo: blueFighterCopy.mmaElo,
            bjjWins: blueFighterCopy.bjjWins,
            bjjLosses: blueFighterCopy.bjjLosses,
            bjjDraws: blueFighterCopy.bjjDraws,
            bjjElo: blueFighterCopy.bjjElo,
            mtWins: blueFighterCopy.mtWins,
            mtLosses: blueFighterCopy.mtLosses,
            mtDraws: blueFighterCopy.mtDraws,
            mtElo: blueFighterCopy.mtElo,
            boxingWins: blueFighterCopy.boxingWins,
            boxingLosses: blueFighterCopy.boxingLosses,
            boxingDraws: blueFighterCopy.boxingDraws,
            boxingElo: blueFighterCopy.boxingElo,
            lastFightDate: new Date(blueFighterCopy.lastFightDate),
          }
        });
      }

      res.json({
        success: true,
        message: 'Official scoring result submitted successfully! Rankings updated.',
        bout: updatedBout,
        event,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Request Event Sign-up
  app.post('/api/events/:eventId/request', async (req, res) => {
    try {
      const { eventId } = req.params;
      const { fighterId } = req.body;

      if (!fighterId) return res.status(400).json({ error: 'fighterId required' });
      
      const duplicate = await prisma.eventRequest.findFirst({
        where: { eventId, fighterId }
      });
      if (duplicate) return res.json(duplicate);

      const newRequest = await prisma.eventRequest.create({
        data: {
          id: `req-${Date.now()}`,
          eventId,
          fighterId,
          status: 'PENDING',
        }
      });

      res.json(newRequest);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Approve/reject applications
  app.post('/api/requests/:requestId/status', async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status } = req.body;

      const reqObj = await prisma.eventRequest.findUnique({ where: { id: requestId } });
      if (!reqObj) return res.status(404).json({ error: 'Request not found' });

      const updatedRequest = await prisma.eventRequest.update({
        where: { id: requestId },
        data: { status }
      });

      if (status === 'APPROVED') {
        await prisma.event.update({
          where: { id: reqObj.eventId },
          data: {
            fighters: {
              connect: { id: reqObj.fighterId }
            }
          }
        });
      }

      res.json(updatedRequest);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite integration for development or standard fallback in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TrueRank full stack engine booted on port ${PORT}`);
  });
}

startServer();
