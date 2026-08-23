import React, { useEffect, useState } from 'react';
import { 
  Swords, 
  Trophy, 
  ShieldCheck, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  Image as ImageIcon, 
  HelpCircle,
  ChevronRight
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-rose-900/30 selection:text-rose-200">
      
      {/* Sleek Gradient Overlay */}
      <div className="absolute top-0 left-0 w-full h-[650px] bg-gradient-to-b from-rose-950/15 via-transparent to-transparent pointer-events-none" />

      {/* Floating Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#131316]/85 backdrop-blur-md border-b border-[#1c1c22] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 bg-rose-800 flex items-center justify-center border border-rose-600 rounded text-white shadow-sm shrink-0">
            <Swords className="w-4 h-4 text-white" />
          </div>
          <span className="font-sans font-bold text-sm tracking-widest text-slate-100 uppercase">
            TrueRank
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onOpenAuth('login')}
            className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2 transition uppercase tracking-wider cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={() => onOpenAuth('signup')}
            className="text-xs font-bold text-white bg-[#431928] hover:bg-rose-900 border border-rose-700 px-4 py-2 rounded transition shadow-sm uppercase tracking-wider cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-20 text-center max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-rose-950/20 border border-rose-900/30 text-[10px] font-bold text-rose-450 uppercase tracking-widest animate-pulse select-none">
            <Swords className="w-3.5 h-3.5" /> Next-Gen Combat Matchmaking
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 leading-tight uppercase font-display">
            The Decentralized Arena <br />
            For Modern Fighters.
          </h1>
          
          <p className="text-sm sm:text-base text-slate-450 max-w-xl mx-auto leading-relaxed font-mono">
            TrueRank empowers promoters with algorithmic matchmaking, provides judges with real-time scoring cards, and gives fighters absolute clarity over rankings and walkout times.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-6 py-3.5 rounded bg-[#431928] hover:bg-rose-900 border border-rose-700 text-xs font-bold text-white shadow-md transition transform hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider"
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
              className="w-full sm:w-auto px-6 py-3.5 rounded bg-[#1c1c20] hover:bg-slate-800 border border-[#2a2930] text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer uppercase tracking-wider"
            >
              Explore Capabilities
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 flex flex-col items-center gap-1 text-slate-500 text-[10px] font-mono tracking-widest uppercase select-none">
          <span>scroll down</span>
          <ChevronDown className="w-4.5 h-4.5 animate-bounce" />
        </div>
      </section>

      {/* Stats Counter Row */}
      <section className="border-y border-slate-900 bg-[#131316]/40 py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center select-none font-mono">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-1">
              <span>0.02</span><span className="text-rose-500 text-xs">s</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Matchmaking Speed</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-1">
              <span>100</span><span className="text-rose-500 text-xs">%</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Verified Outcomes</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-white">4</div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Combat Disciplines</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-1">
              <span>24</span><span className="text-rose-500 text-xs">/7</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Live Elo Rankings</p>
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
            <div className="p-2.5 w-fit rounded bg-rose-950/20 text-rose-400 border border-rose-900/30">
              <Trophy className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-display">Algorithmic Matchmaking</h2>
            <p className="text-xs sm:text-sm text-slate-405 leading-relaxed font-mono">
              Promoters upload CSV files containing multi-sport rosters. TrueRank evaluates age parameters, gender criteria, belt weights, and sport Elos to recommend fair, competitive pairings instantly.
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-2 font-mono">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Automatic teammate protection limits</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Customizable Elo tolerances</li>
            </ul>
          </div>
          <div className="bg-[#131316] border border-[#1c1c22] p-6 rounded relative overflow-hidden shadow-inner group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-950/20 rounded-full blur-3xl group-hover:bg-rose-900/20 transition" />
            <div className="space-y-3.5 relative z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Suggested Matchup</span>
                <span className="text-[10px] bg-rose-950/40 text-rose-400 px-2 py-0.5 rounded border border-rose-900/40 font-bold uppercase">MMA</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Alex Volkan</h4>
                  <span className="text-[10px] text-rose-450 font-mono">1550 Elo</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 italic select-none">vs</span>
                <div className="text-right">
                  <h4 className="text-xs font-bold text-slate-200">Charles Oliver</h4>
                  <span className="text-[10px] text-rose-450 font-mono">1510 Elo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Walkout Calculation Selling Point */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center transition-all duration-700 transform ${
          scrollPosition > 400 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-10'
        }`}>
          <div className="order-2 md:order-1 bg-[#131316] border border-[#1c1c22] p-6 rounded relative overflow-hidden shadow-inner group">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-950/20 rounded-full blur-3xl group-hover:bg-rose-900/20 transition" />
            <div className="space-y-3 font-mono relative z-10">
              <div className="flex justify-between border-b border-slate-800 pb-1.5 text-[10px] text-slate-500 font-bold">
                <span>BOUT ORDER</span>
                <span>EXPECTED WALKOUT</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-350">Bout #1 (Title Fight)</span>
                <span className="text-rose-400 font-bold">19:30 Local</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-350">Bout #2 (Main Card)</span>
                <span className="text-rose-400 font-bold">19:45 Local</span>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-4">
            <div className="p-2.5 w-fit rounded bg-rose-950/20 text-rose-400 border border-rose-900/30">
              <Clock className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-display">Real-Time Arena Walkouts</h2>
            <p className="text-xs sm:text-sm text-slate-405 leading-relaxed font-mono">
              Never get caught cold. As the referee reports results, TrueRank updates fight timings automatically. Fighters receive immediate, location-based warm-up alerts straight to their mobile Passports.
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-2 font-mono">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Automatic warm-up notifications</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Location-based walkout time estimations</li>
            </ul>
          </div>
        </div>

        {/* Poster Configurator Selling Point */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center transition-all duration-700 transform ${
          scrollPosition > 650 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-10'
        }`}>
          <div className="space-y-4">
            <div className="p-2.5 w-fit rounded bg-rose-950/20 text-rose-400 border border-rose-900/30">
              <ImageIcon className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-display">Digital Running Order Configurator</h2>
            <p className="text-xs sm:text-sm text-slate-405 leading-relaxed font-mono">
              Design and export stunning running order posters for social media. Choose between Title Fights, Main Cards, and Undercards. Instantly publish matched weights and fight times for fans.
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-2 font-mono">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Sleek poster graphic template presets</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Single-click export for promoter promotion</li>
            </ul>
          </div>
          <div className="bg-[#131316] border border-[#1c1c22] p-6 rounded relative overflow-hidden shadow-inner group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-950/20 rounded-full blur-3xl group-hover:bg-rose-900/20 transition" />
            <div className="border border-rose-900/30 p-4 bg-slate-950 rounded space-y-3 font-mono text-center relative z-10">
              <span className="text-[9px] text-rose-400 font-bold block uppercase tracking-widest select-none">★ Digital Poster Preview ★</span>
              <div className="text-[11px] text-slate-200 uppercase font-black tracking-wider">TrueRank Arena: Collision Course</div>
              <div className="text-[9px] text-slate-500">London Wembley Arena | July 20</div>
            </div>
          </div>
        </div>

        {/* Live Scoring Teaser */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center transition-all duration-700 transform ${
          scrollPosition > 850 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-10'
        }`}>
          <div className="order-2 md:order-1 bg-[#131316] border border-[#1c1c22] p-6 rounded relative overflow-hidden shadow-inner group">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-950/20 rounded-full blur-3xl group-hover:bg-rose-900/20 transition" />
            <div className="space-y-3.5 text-center relative z-10">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Submit Official Score</span>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#431928] border border-rose-700/30 rounded text-xs font-bold text-rose-350">RED CORNER</div>
                <div className="p-3 bg-slate-950 border border-[#2a2930] rounded text-xs font-bold text-slate-400">BLUE CORNER</div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-4">
            <div className="p-2.5 w-fit rounded bg-rose-950/20 text-rose-400 border border-rose-900/30">
              <ShieldCheck className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-display">Verified Live Scoring</h2>
            <p className="text-xs sm:text-sm text-slate-405 leading-relaxed font-mono">
              Invited scoring officials gain access to an official card dashboard. Results are logged directly into SQLite databases, triggering instant leaderboard calculations and shifting upcoming walkout times for fighters in real-time.
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-2 font-mono">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Secure invitation links for referees</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Auto-recalculation of ELO rankings</li>
            </ul>
          </div>
        </div>

      </section>

      {/* Technical FAQ Accordions */}
      <section className="py-24 px-6 border-t border-slate-900 bg-[#131316]/20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="p-2.5 w-fit rounded bg-rose-950/20 text-rose-400 border border-rose-900/30 mx-auto">
              <HelpCircle className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white uppercase font-display">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-405 font-mono uppercase tracking-wider select-none">Deep technical clarifications</p>
          </div>

          <div className="space-y-3.5 animate-fadeIn">
            {faqItems.map((item, idx) => (
              <div 
                key={idx}
                className="bg-[#131316] border border-[#1c1c22] hover:border-slate-800 rounded overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 flex items-center justify-between text-left focus:outline-none cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono">{item.q}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${activeFaq === idx ? 'transform rotate-90' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="p-5 pt-0 border-t border-[#1c1c22]/60 text-xs text-slate-400 font-mono leading-relaxed bg-slate-950/20">
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
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-display">Ready to Step into the Cage?</h2>
        <p className="text-xs sm:text-sm text-slate-450 font-mono leading-relaxed">
          Create your promoter cockpit, fighter passport, or judge credential sheet and secure your combat ratings.
        </p>
        <button 
          onClick={() => onOpenAuth('signup')}
          className="px-8 py-3.5 rounded bg-[#431928] hover:bg-rose-900 border border-rose-700 text-xs font-bold text-white shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer uppercase tracking-wider"
        >
          Claim Your TrueRank Profile
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1c1c22] py-12 px-6 text-center text-xs text-slate-600 font-mono space-y-2 select-none">
        <p>&copy; 2026 TrueRank Combat Systems Inc. All rights reserved.</p>
        <p className="text-[10.5px] text-slate-650">Enterprise Matchmaking & Live Standing Services.</p>
      </footer>

    </div>
  );
}
