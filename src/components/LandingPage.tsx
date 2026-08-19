import React, { useEffect, useState } from 'react';
import { 
  Swords, 
  Trophy, 
  ShieldCheck, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  Image as ImageIcon, 
  UserCheck, 
  Zap, 
  HelpCircle,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export default function LandingPage({ onOpenAuth }: LandingPageProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const faqItems = [
    {
      q: "How does the Algorithmic Matchmaking engine pair fighters?",
      a: "The engine runs a comparative calculation checking weight division tolerance limits, age margins, and relative sport Elos. It automatically skips pairings where athletes are flagged as teammates from the same gym."
    },
    {
      q: "Are ELO rankings updated instantly?",
      a: "Yes. When an official judge submits a winner or draw decision, TrueRank recalculates both fighters' ratings in real-time, pushing adjustments instantly to the public standings."
    },
    {
      q: "What is the Fighter Passport?",
      a: "Fighter Passport is a decentralized digital identity. Fighters maintain their records, gyms, and ratings across multiple events and promoters, rather than being locked to a single banner."
    },
    {
      q: "How does the dynamic walkout scheduler work?",
      a: "The schedule calculates timings from the started event time. When a judge completes a match, the walkout timers for all subsequent bouts update using location-based duration averages."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden">
      
      {/* Sleek Gradient Overlay */}
      <div className="absolute top-0 left-0 w-full h-[650px] bg-gradient-to-b from-purple-900/10 via-transparent to-transparent pointer-events-none" />

      {/* Floating Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-slate-950/75 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center font-bold text-sm tracking-tight text-white">
            T
          </div>
          <span className="font-sans font-bold text-sm tracking-widest text-slate-100 uppercase">
            TrueRank
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onOpenAuth('login')}
            className="text-xs font-semibold text-slate-350 hover:text-white px-4 py-2 transition"
          >
            Sign In
          </button>
          <button 
            onClick={() => onOpenAuth('signup')}
            className="text-xs font-bold text-slate-950 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition shadow-sm"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-20 text-center max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/45 border border-purple-800/35 text-[10px] font-bold text-purple-400 uppercase tracking-widest animate-pulse">
            <Swords className="w-3.5 h-3.5" /> Next-Gen Combat Matchmaking
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-250 to-slate-400 leading-tight">
            The Decentralized Arena <br />
            For Modern Fighters.
          </h1>
          
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            TrueRank empowers promoters with algorithmic matchmaking, provides judges with real-time scoring cards, and gives fighters absolute clarity over rankings and walkout times.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              Create Your Persona
            </button>
            <button 
              onClick={() => {
                window.scrollTo({
                  top: window.innerHeight * 0.9,
                  behavior: 'smooth'
                });
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800/80 text-xs font-bold text-slate-350 hover:text-white transition cursor-pointer"
            >
              Explore Capabilities
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 flex flex-col items-center gap-1 text-slate-500 text-[10px] font-mono tracking-widest uppercase">
          <span>scroll down</span>
          <ChevronDown className="w-4.5 h-4.5 animate-bounce" />
        </div>
      </section>

      {/* Stats Counter Row */}
      <section className="border-y border-slate-900 bg-slate-900/10 py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-1">
              <span>0.02</span><span className="text-purple-500 text-xs font-mono">s</span>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Matchmaking Speed</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-1">
              <span>100</span><span className="text-purple-500 text-xs font-mono">%</span>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Verified Outcomes</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-white">4</div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Combat Disciplines</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-1">
              <span>24</span><span className="text-purple-500 text-xs font-mono">/7</span>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Live Elo Rankings</p>
          </div>
        </div>
      </section>

      {/* Feature Grid / Scroll Reveal Sections */}
      <section className="py-24 px-6 max-w-6xl mx-auto space-y-32">
        
        {/* Matchmaker Panel Teaser */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center transition-all duration-700 transform ${
          scrollPosition > 150 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-10'
        }`}>
          <div className="space-y-4">
            <div className="p-2.5 w-fit rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Algorithmic Matchmaking</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">
              Promoters upload CSV files containing multi-sport rosters. TrueRank evaluates age parameters, gender criteria, belt weights, and sport Elos to recommend fair, competitive pairings instantly.
            </p>
            <ul className="space-y-2 text-xs text-slate-350 pt-2 font-mono">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> Automatic teammate protection limits</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> Customizable Elo tolerances</li>
            </ul>
          </div>
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl relative overflow-hidden shadow-inner group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/5 rounded-full blur-3xl group-hover:bg-purple-600/10 transition" />
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Suggested Matchup</span>
                <span className="text-[10px] bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded border border-purple-700/30 font-bold uppercase">MMA</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Alex Volkan</h4>
                  <span className="text-[10px] text-purple-450 font-mono">1550 Elo</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 italic">vs</span>
                <div className="text-right">
                  <h4 className="text-xs font-bold text-slate-200">Charles Oliver</h4>
                  <span className="text-[10px] text-purple-450 font-mono">1510 Elo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Walkout Calculation Selling Point */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center transition-all duration-700 transform ${
          scrollPosition > 400 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-10'
        }`}>
          <div className="order-2 md:order-1 bg-slate-900 border border-slate-850 p-6 rounded-2xl relative overflow-hidden shadow-inner group">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-600/5 rounded-full blur-3xl group-hover:bg-emerald-600/10 transition" />
            <div className="space-y-3 font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-1.5 text-[10px] text-slate-500 font-bold">
                <span>BOUT ORDER</span>
                <span>EXPECTED WALKOUT</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-350">Bout #1 (Title Fight)</span>
                <span className="text-emerald-400 font-bold">19:30 Local</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-350">Bout #2 (Main Card)</span>
                <span className="text-emerald-400 font-bold">19:45 Local</span>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-4">
            <div className="p-2.5 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Real-Time Arena Walkouts</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">
              Never get caught cold. As the referee reports results, TrueRank updates fight timings automatically. Fighters receive immediate, location-based warm-up alerts straight to their mobile Passports.
            </p>
            <ul className="space-y-2 text-xs text-slate-350 pt-2 font-mono">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automatic warm-up notifications</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Location-based walkout time estimations</li>
            </ul>
          </div>
        </div>

        {/* Poster Configurator Selling Point */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center transition-all duration-700 transform ${
          scrollPosition > 650 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-10'
        }`}>
          <div className="space-y-4">
            <div className="p-2.5 w-fit rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Digital Running Order Configurator</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">
              Design and export stunning running order posters for social media. Choose between Title Fights, Main Cards, and Undercards. Instantly publish matched weights and fight times for fans.
            </p>
            <ul className="space-y-2 text-xs text-slate-350 pt-2 font-mono">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Sleek poster graphic template presets</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Single-click export for promoter promotion</li>
            </ul>
          </div>
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl relative overflow-hidden shadow-inner group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl group-hover:bg-indigo-600/10 transition" />
            <div className="border border-indigo-900/40 p-4 bg-slate-950 rounded-xl space-y-3 font-mono text-center">
              <span className="text-[9px] text-indigo-400 font-bold block uppercase tracking-widest">★ Digital Poster Preview ★</span>
              <div className="text-[11px] text-slate-200 uppercase font-black tracking-wider">TrueRank Arena: Collision Course</div>
              <div className="text-[9px] text-slate-500">London Wembley Arena | July 20</div>
            </div>
          </div>
        </div>

        {/* Live Scoring Teaser */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center transition-all duration-700 transform ${
          scrollPosition > 850 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-10'
        }`}>
          <div className="order-2 md:order-1 bg-slate-900 border border-slate-850 p-6 rounded-2xl relative overflow-hidden shadow-inner group">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-600/5 rounded-full blur-3xl group-hover:bg-amber-600/10 transition" />
            <div className="space-y-3.5 text-center">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Submit Official Score</span>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-xs font-bold text-red-400">RED CORNER</div>
                <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-xs font-bold text-blue-400">BLUE CORNER</div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-4">
            <div className="p-2.5 w-fit rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Verified Live Scoring</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">
              Invited scoring officials gain access to an official card dashboard. Results are logged directly into SQLite databases, triggering instant leaderboard calculations and shifting upcoming walkout times for fighters in real-time.
            </p>
            <ul className="space-y-2 text-xs text-slate-350 pt-2 font-mono">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500" /> Secure invitation links for referees</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500" /> Auto-recalculation of ELO rankings</li>
            </ul>
          </div>
        </div>

      </section>

      {/* Technical FAQ Accordions */}
      <section className="py-24 px-6 border-t border-slate-900 bg-slate-900/5">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="p-2.5 w-fit rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 mx-auto">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Deep technical clarifications</p>
          </div>

          <div className="space-y-3.5">
            {faqItems.map((item, idx) => (
              <div 
                key={idx}
                className="bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono">{item.q}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'transform rotate-90' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="p-5 pt-0 border-t border-slate-950 text-xs text-slate-400 font-mono leading-relaxed bg-slate-950/20">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Form */}
      <section className="py-24 px-6 text-center max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Ready to Step into the Cage?</h2>
        <p className="text-xs sm:text-sm text-slate-400 font-mono leading-relaxed">
          Create your promoter cockpit, fighter passport, or judge credential sheet and secure your combat ratings.
        </p>
        <button 
          onClick={() => onOpenAuth('signup')}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
        >
          Claim Your TrueRank Profile
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 px-6 text-center text-xs text-slate-500 font-mono space-y-2">
        <p>&copy; 2026 TrueRank Combat Systems Inc. All rights reserved.</p>
        <p className="text-[10.5px] text-slate-600">Enterprise Matchmaking & Live Standing Services.</p>
      </footer>

    </div>
  );
}
