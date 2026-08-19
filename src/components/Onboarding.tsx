import React, { useState } from 'react';
import { Swords, Building, ShieldAlert, Loader2, Award, Compass, Globe, Sparkles } from 'lucide-react';

interface OnboardingProps {
  token: string;
  onComplete: (user: any, fighter: any) => void;
}

export default function Onboarding({ token, onComplete }: OnboardingProps) {
  const [role, setRole] = useState<'FIGHTER' | 'PROMOTER' | 'JUDGE' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fighter details
  const [gym, setGym] = useState('');
  const [location, setLocation] = useState('');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [weightClass, setWeightClass] = useState('-73kg');
  const [bjjBelt, setBjjBelt] = useState('WHITE');
  const [titles, setTitles] = useState('');

  // Fighter Records
  const [mmaWins, setMmaWins] = useState('0');
  const [mmaLosses, setMmaLosses] = useState('0');
  const [mmaDraws, setMmaDraws] = useState('0');

  const [bjjWins, setBjjWins] = useState('0');
  const [bjjLosses, setBjjLosses] = useState('0');
  const [bjjDraws, setBjjDraws] = useState('0');

  const [mtWins, setMtWins] = useState('0');
  const [mtLosses, setMtLosses] = useState('0');
  const [mtDraws, setMtDraws] = useState('0');

  const [boxingWins, setBoxingWins] = useState('0');
  const [boxingLosses, setBoxingLosses] = useState('0');
  const [boxingDraws, setBoxingDraws] = useState('0');

  // Promoter details
  const [orgName, setOrgName] = useState('');
  const [sanctionName, setSanctionName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [websiteName, setWebsiteName] = useState('');

  // Judge details
  const [credential, setCredential] = useState('');

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    setError('');

    let payload: any = { role };

    if (role === 'FIGHTER') {
      payload.fighterDetails = {
        gym,
        location,
        age: parseInt(age) || 25,
        gender,
        weightClass,
        bjjBelt,
        titles,
        mmaWins: parseInt(mmaWins) || 0,
        mmaLosses: parseInt(mmaLosses) || 0,
        mmaDraws: parseInt(mmaDraws) || 0,
        bjjWins: parseInt(bjjWins) || 0,
        bjjLosses: parseInt(bjjLosses) || 0,
        bjjDraws: parseInt(bjjDraws) || 0,
        mtWins: parseInt(mtWins) || 0,
        mtLosses: parseInt(mtLosses) || 0,
        mtDraws: parseInt(mtDraws) || 0,
        boxingWins: parseInt(boxingWins) || 0,
        boxingLosses: parseInt(boxingLosses) || 0,
        boxingDraws: parseInt(boxingDraws) || 0
      };
    } else if (role === 'PROMOTER') {
      payload.promoterDetails = { 
        orgName,
        sanctionName,
        locationName,
        websiteName
      };
    } else if (role === 'JUDGE') {
      payload.judgeDetails = { credential };
    }

    try {
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete onboarding');
      }
      onComplete(data.user, data.fighter);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-y-auto overflow-x-hidden font-sans">
      
      {/* Background Decorators */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-900/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-3xl bg-slate-900/80 border border-slate-850 rounded-2xl p-6 sm:p-10 shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Choose Your Arena</h1>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mt-1.5">
            Initialize your TrueRank digital persona
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/20 border border-red-900/30 rounded-xl text-xs font-mono text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleComplete} className="space-y-8">
          
          {/* Card Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Fighter Card */}
            <div 
              onClick={() => setRole('FIGHTER')}
              className={`p-5 rounded-xl border cursor-pointer transition flex flex-col items-center text-center gap-3 relative ${
                role === 'FIGHTER' 
                  ? 'bg-purple-950/20 border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.15)] text-white' 
                  : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-2.5 rounded-lg ${role === 'FIGHTER' ? 'bg-purple-500/25 text-purple-400' : 'bg-slate-900 text-slate-400'}`}>
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider">Fighter</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">Join tournaments, check walkout times & fight weights</p>
              </div>
            </div>

            {/* Promoter Card */}
            <div 
              onClick={() => setRole('PROMOTER')}
              className={`p-5 rounded-xl border cursor-pointer transition flex flex-col items-center text-center gap-3 relative ${
                role === 'PROMOTER' 
                  ? 'bg-purple-950/20 border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.15)] text-white' 
                  : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-2.5 rounded-lg ${role === 'PROMOTER' ? 'bg-purple-500/25 text-purple-400' : 'bg-slate-900 text-slate-400'}`}>
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider">Promoter</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">Set up tournaments, pair matches & publish cards</p>
              </div>
            </div>

            {/* Judge Card */}
            <div 
              onClick={() => setRole('JUDGE')}
              className={`p-5 rounded-xl border cursor-pointer transition flex flex-col items-center text-center gap-3 relative ${
                role === 'JUDGE' 
                  ? 'bg-purple-950/20 border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.15)] text-white' 
                  : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-2.5 rounded-lg ${role === 'JUDGE' ? 'bg-purple-500/25 text-purple-400' : 'bg-slate-900 text-slate-400'}`}>
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider">Official Judge</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">Submit card decisions & manage scoring events</p>
              </div>
            </div>

          </div>

          {/* Persona Detail Sub-Forms */}
          {role === 'FIGHTER' && (
            <div className="bg-slate-950/50 border border-slate-850 p-5 rounded-xl space-y-6 animate-fadeIn">
              
              <div className="border-b border-slate-850 pb-2 flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-widest">
                  Fighter Passport Specifications
                </h4>
                <span className="text-[9px] bg-purple-950/60 border border-purple-800/30 text-purple-400 font-mono uppercase tracking-widest px-2 py-0.5 rounded font-bold">
                  Mandatory Profile Setup
                </span>
              </div>
              
              {/* Grid 1: Basic specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Gym or Team affiliation</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Apex Martial Arts"
                    value={gym}
                    onChange={e => setGym(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 hover:border-slate-750 focus:border-purple-600 rounded-lg p-2 text-xs text-white outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Location (City, Country)</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. London, UK"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 hover:border-slate-750 focus:border-purple-600 rounded-lg p-2 text-xs text-white outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Age</label>
                  <input 
                    type="number"
                    required
                    placeholder="25"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 hover:border-slate-750 focus:border-purple-600 rounded-lg p-2 text-xs text-white outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Target Weight Division</label>
                  <select 
                    value={weightClass}
                    onChange={e => setWeightClass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-600 rounded-lg p-2 text-xs text-white outline-none transition"
                  >
                    <option value="-61kg">-61kg (Bantamweight)</option>
                    <option value="-66kg">-66kg (Featherweight)</option>
                    <option value="-73kg">-73kg (Lightweight)</option>
                    <option value="-77kg">-77kg (Welterweight)</option>
                    <option value="-84kg">-84kg (Middleweight)</option>
                    <option value="-93kg">-93kg (Light Heavyweight)</option>
                    <option value="+93kg">+93kg (Heavyweight)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">BJJ Belt Rank</label>
                  <select 
                    value={bjjBelt}
                    onChange={e => setBjjBelt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-600 rounded-lg p-2 text-xs text-white outline-none transition"
                  >
                    <option value="WHITE">White Belt</option>
                    <option value="BLUE">Blue Belt</option>
                    <option value="PURPLE">Purple Belt</option>
                    <option value="BROWN">Brown Belt</option>
                    <option value="BLACK">Black Belt</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Gender</label>
                  <div className="flex gap-4 pt-1.5">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input 
                        type="radio" 
                        name="gender" 
                        checked={gender === 'MALE'} 
                        onChange={() => setGender('MALE')}
                        className="text-purple-600 focus:ring-0" 
                      />
                      Male
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input 
                        type="radio" 
                        name="gender" 
                        checked={gender === 'FEMALE'} 
                        onChange={() => setGender('FEMALE')}
                        className="text-purple-600 focus:ring-0" 
                      />
                      Female
                    </label>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Titles & Accolades</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. WKA National Champion, IBJJF Worlds Bronze Medalist (separated by commas)"
                    value={titles}
                    onChange={e => setTitles(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 hover:border-slate-750 focus:border-purple-600 rounded-lg p-2 text-xs text-white outline-none transition"
                  />
                </div>
              </div>

              {/* Grid 2: Detailed records per sport */}
              <div className="border-t border-slate-850 pt-4 space-y-4">
                <h5 className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest">
                  Sports Records (Wins - Losses - Draws)
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  
                  {/* MMA Record */}
                  <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg space-y-2">
                    <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-400">MMA Record</span>
                    <div className="grid grid-cols-3 gap-1">
                      <input type="number" required placeholder="W" value={mmaWins} onChange={e => setMmaWins(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white" />
                      <input type="number" required placeholder="L" value={mmaLosses} onChange={e => setMmaLosses(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white" />
                      <input type="number" required placeholder="D" value={mmaDraws} onChange={e => setMmaDraws(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white" />
                    </div>
                  </div>

                  {/* BJJ Record */}
                  <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg space-y-2">
                    <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-400">BJJ Record</span>
                    <div className="grid grid-cols-3 gap-1">
                      <input type="number" required placeholder="W" value={bjjWins} onChange={e => setBjjWins(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white" />
                      <input type="number" required placeholder="L" value={bjjLosses} onChange={e => setBjjLosses(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white" />
                      <input type="number" required placeholder="D" value={bjjDraws} onChange={e => setBjjDraws(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white" />
                    </div>
                  </div>

                  {/* Muay Thai Record */}
                  <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg space-y-2">
                    <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-400">Muay Thai Record</span>
                    <div className="grid grid-cols-3 gap-1">
                      <input type="number" required placeholder="W" value={mtWins} onChange={e => setMtWins(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white" />
                      <input type="number" required placeholder="L" value={mtLosses} onChange={e => setMtLosses(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white" />
                      <input type="number" required placeholder="D" value={mtDraws} onChange={e => setMtDraws(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white" />
                    </div>
                  </div>

                  {/* Boxing Record */}
                  <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg space-y-2">
                    <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-400">Boxing Record</span>
                    <div className="grid grid-cols-3 gap-1">
                      <input type="number" required placeholder="W" value={boxingWins} onChange={e => setBoxingWins(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white" />
                      <input type="number" required placeholder="L" value={boxingLosses} onChange={e => setBoxingLosses(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white" />
                      <input type="number" required placeholder="D" value={boxingDraws} onChange={e => setBoxingDraws(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center text-xs text-white" />
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {role === 'PROMOTER' && (
            <div className="bg-slate-950/50 border border-slate-850 p-5 rounded-xl space-y-4 animate-fadeIn">
              
              <div className="border-b border-slate-850 pb-2 flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-widest">
                  Promoter Specifications
                </h4>
                <span className="text-[9px] bg-purple-950/60 border border-purple-800/30 text-purple-400 font-mono uppercase tracking-widest px-2 py-0.5 rounded font-bold">
                  Mandatory Credentials Setup
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Organization or Banner Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Apex Fighting Championship"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-750 focus:border-purple-600 rounded-lg py-2 pl-10 pr-4 text-xs text-white outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Sanctioning Commission Affiliation</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      required
                      placeholder="e.g. ISKA, WBC Combat, NJSACB"
                      value={sanctionName}
                      onChange={e => setSanctionName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-750 focus:border-purple-600 rounded-lg py-2 pl-10 pr-4 text-xs text-white outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Base of Operations (HQ City, Country)</label>
                  <div className="relative">
                    <Compass className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Las Vegas, NV"
                      value={locationName}
                      onChange={e => setLocationName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-750 focus:border-purple-600 rounded-lg py-2 pl-10 pr-4 text-xs text-white outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Official Promotion Website / Contact</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      required
                      placeholder="e.g. www.apexfighting.com"
                      value={websiteName}
                      onChange={e => setWebsiteName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-750 focus:border-purple-600 rounded-lg py-2 pl-10 pr-4 text-xs text-white outline-none transition"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {role === 'JUDGE' && (
            <div className="bg-slate-950/50 border border-slate-850 p-5 rounded-xl space-y-4 animate-fadeIn">
              <h4 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-widest border-b border-slate-850 pb-2">
                Sanctioning Official Credentials
              </h4>
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Licensing Credentials or Body</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. UK Combat Referee Board (UKCRB-99)"
                  value={credential}
                  onChange={e => setCredential(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 hover:border-slate-750 focus:border-purple-600 rounded-lg p-2.5 text-xs text-white outline-none transition"
                />
              </div>
            </div>
          )}

          {role && (
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Create Digital Persona</span>
                </div>
              )}
            </button>
          )}

        </form>

      </div>
    </div>
  );
}
