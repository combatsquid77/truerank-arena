import React, { useRef, useState, useMemo } from 'react';
import { ScheduledBout, Fighter, Event } from '../types';
import { calculateWalkoutTimings } from '../matchmaker';
import { Download, Calendar, MapPin, Clock, Sparkles, Upload, X, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

// Helper to convert any oklch(...), oklab(...), lab(...) or lch(...) colors to standard rgba(...) formats using a native offscreen canvas.
// This prevents html2canvas from crashing when parsing modern Tailwind CSS v4 color formats.
const convertOklchSubstrings = (str: string | null): string => {
  try {
    if (!str || typeof str !== 'string') {
      return str || '';
    }

    // Check if the style value query contains unsupported modern color formats
    const hasUnsupportedColor = /(oklch|oklab|lab|lch)/i.test(str);
    if (!hasUnsupportedColor) {
      return str;
    }

    // Create a tiny 1x1 canvas to let the browser convert oklch/oklab natively to RGBA
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return str;

    return str.replace(/(oklch|oklab|lab|lch)\([^)]+\)/gi, (match) => {
      try {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = match;
        ctx.fillRect(0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
      } catch (innerErr) {
        // Graceful fallback to secondary purple if anything goes wrong
        return 'rgba(168, 85, 247, 1)';
      }
    });
  } catch (globalErr) {
    console.warn('convertOklchSubstrings global handler caught error:', globalErr);
    return str || '';
  }
};

interface TrueRankPosterProps {
  event: Event;
  bouts: ScheduledBout[];
  fighters: Fighter[];
}

export default function TrueRankPoster({ event, bouts, fighters }: TrueRankPosterProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [startTime, setStartTime] = useState<string>('18:00');
  const [minutesPerFight, setMinutesPerFight] = useState<number>(15);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Logo preset and custom branding states
  const [showLogoPreset, setShowLogoPreset] = useState<string>('standard');
  const [customLogoText, setCustomLogoText] = useState<string>('Apex Combat League');
  
  // Custom media upload states
  const [uploadedShowLogo, setUploadedShowLogo] = useState<string | null>(null);
  const [uploadedSponsors, setUploadedSponsors] = useState<{ id: string; dataUrl: string; name: string }[]>([]);
  
  // Drag & Drop visual state trackers
  const [showLogoDragActive, setShowLogoDragActive] = useState<boolean>(false);
  const [sponsorsDragActive, setSponsorsDragActive] = useState<boolean>(false);
  
  // Input references
  const showLogoInputRef = useRef<HTMLInputElement>(null);
  const sponsorsInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop event handlers
  const handleShowLogoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setShowLogoDragActive(true);
    } else if (e.type === 'dragleave') {
      setShowLogoDragActive(false);
    }
  };

  const handleShowLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLogoDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleShowLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleShowLogoFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setUploadedShowLogo(e.target.result);
        setShowLogoPreset('uploaded'); // Auto-switch to uploaded preset to display in running order!
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSponsorsDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setSponsorsDragActive(true);
    } else if (e.type === 'dragleave') {
      setSponsorsDragActive(false);
    }
  };

  const handleSponsorsDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSponsorsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSponsorFiles(e.dataTransfer.files);
    }
  };

  const handleSponsorFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    list.forEach((file) => {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setUploadedSponsors(prev => [
            ...prev,
            {
              id: `uploaded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              dataUrl: e.target.result as string,
              name: file.name
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Sponsors states
  const [showSponsors, setShowSponsors] = useState<boolean>(true);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>(['venum', 'monster', 'apexgear']);
  const [newSponsorInput, setNewSponsorInput] = useState<string>('');

  const toggleSponsor = (sponsorId: string) => {
    if (selectedSponsors.includes(sponsorId)) {
      setSelectedSponsors(selectedSponsors.filter(s => s !== sponsorId));
    } else {
      setSelectedSponsors([...selectedSponsors, sponsorId]);
    }
  };

  const handleAddCustomSponsor = () => {
    if (!newSponsorInput.trim()) return;
    const cleanSponsor = newSponsorInput.trim();
    if (!selectedSponsors.includes(cleanSponsor)) {
      setSelectedSponsors([...selectedSponsors, cleanSponsor]);
    }
    setNewSponsorInput('');
  };

  // Retrieve fighter names and gyms
  const extendedBouts = useMemo(() => {
    // Sort bouts strictly by boutOrder
    const sorted = [...bouts].sort((a, b) => a.boutOrder - b.boutOrder);
    
    // Derive timings
    const timings = calculateWalkoutTimings(sorted.length, startTime, minutesPerFight);

    return sorted.map((b, idx) => {
      // Correct for smart corners (Red / Blue labels)
      const isRedFighterARed = b.fighterRedCorner === 'RED';
      
      const redChampId = isRedFighterARed ? b.fighterRedId : b.fighterBlueId;
      const blueChampId = isRedFighterARed ? b.fighterBlueId : b.fighterRedId;

      const fighterRed = fighters.find(f => f.id === redChampId);
      const fighterBlue = fighters.find(f => f.id === blueChampId);

      return {
        ...b,
        fighterRedName: fighterRed?.name || 'TBA',
        fighterRedGym: fighterRed?.gym || 'Independent',
        fighterBlueName: fighterBlue?.name || 'TBA',
        fighterBlueGym: fighterBlue?.gym || 'Independent',
        walkoutTime: timings[idx] || startTime,
      };
    });
  }, [bouts, fighters, startTime, minutesPerFight]);

  // Export digital poster layout into a downloadable png leveraging html2canvas
  const handleExportPNG = async () => {
    if (!posterRef.current) return;
    
    setIsExporting(true);
    
    const originalGetComputedStyle = window.getComputedStyle;
    
    // Polyfill getComputedStyle during html2canvas render to intercept and replace OKLCH colors with standard RGBA colors
    window.getComputedStyle = function (elt, pseudoElt) {
      const style = originalGetComputedStyle(elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return function (propertyName: string) {
              try {
                const val = target.getPropertyValue(propertyName);
                return convertOklchSubstrings(val);
              } catch {
                return '';
              }
            };
          }
          
          let val;
          try {
            val = (target as any)[prop];
          } catch (e) {
            // Safe fallback: call native getPropertyValue if normal property access throws a DOMException
            if (typeof prop === 'string') {
              try {
                val = target.getPropertyValue(prop);
              } catch {
                val = undefined;
              }
            }
          }

          if (typeof val === 'string') {
            return convertOklchSubstrings(val);
          }
          if (typeof val === 'function') {
            return val.bind(target);
          }
          return val;
        }
      });
    };

    try {
      // Small delay to allow react layout to settle
      await new Promise(resolve => setTimeout(resolve, 250));
      
      const canvas = await html2canvas(posterRef.current, {
        scale: 3, // High-res poster scaling
        backgroundColor: '#020617', // Force solid matching black backdrop background
        useCORS: true,
        logging: false,
        width: 480, // Locked canvas sizing enforces perfect alignments with no horizontal shifting
        height: posterRef.current.offsetHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `truerank_${event.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_poster.png`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error('Error compiling running order poster image:', err);
    } finally {
      // Restore the native window.getComputedStyle function
      window.getComputedStyle = originalGetComputedStyle;
      setIsExporting(false);
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6" id="truerank-poster-module">
      
      {/* Live Poster Configurator Controls */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
        <div>
          <h2 className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            TrueRank Event Poster Configurator
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Customize walkout timings, logo designs, and sponsor bars for high-resolution graphics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-400" />
              First Walkout
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full text-xs font-mono p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              ⏱ Duration (mins)
            </label>
            <input
              type="number"
              value={minutesPerFight}
              onChange={(e) => setMinutesPerFight(Math.max(1, parseInt(e.target.value) || 15))}
              className="w-full text-xs font-mono p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              🎭 Show Logo Badge
            </label>
            <select
              value={showLogoPreset}
              onChange={(e) => setShowLogoPreset(e.target.value)}
              className="w-full text-xs p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-sans"
            >
              <option value="standard">✦ Standard TrueRank Logo</option>
              <option value="apex">👑 Apex Combat League (Gold)</option>
              <option value="wembley">💎 London Wembley Collision (Ice Blue)</option>
              <option value="superslam">🔥 Las Vegas Super-Slam (Neon Purple)</option>
              <option value="custom">✍️ Custom Text Badge</option>
              <option value="uploaded">📂 Custom Uploaded Image Logo</option>
              <option value="none">❌ Hide Show Logo</option>
            </select>
          </div>

          <button
            onClick={handleExportPNG}
            disabled={extendedBouts.length === 0 || isExporting}
            className="w-full py-2.5 text-xs font-bold rounded bg-purple-700 hover:bg-purple-600 text-white shadow-lg shadow-purple-950/40 border border-purple-500 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating...' : 'Export High-Res PNG'}
          </button>
        </div>

        {/* Custom Logo Text Input */}
        {showLogoPreset === 'custom' && (
          <div className="space-y-1.5 animate-fadeIn">
            <label className="text-[10px] text-slate-400 uppercase font-mono font-bold">Custom Show Logo Text</label>
            <input
              type="text"
              value={customLogoText}
              onChange={(e) => setCustomLogoText(e.target.value)}
              placeholder="e.g. ULTIMATE COMBAT FIGHTS"
              className="w-full max-w-md text-xs p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        )}

        {/* Graphic Media Upload Center */}
        <div className="pt-4 border-t border-slate-850 space-y-4">
          <div>
            <h3 className="text-[10.5px] font-bold text-purple-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              Upload Event Graphic Logos (PNG/JPG)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Upload custom graphics (transparent background PNGs work best!) to render on the digital poster.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Show Logo Graphic Card */}
            <div 
              className={`rounded-xl border p-4 transition-all duration-200 ${
                showLogoDragActive 
                  ? 'border-purple-500 bg-purple-950/20' 
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-800'
              }`}
              onDragEnter={handleShowLogoDrag}
              onDragOver={handleShowLogoDrag}
              onDragLeave={handleShowLogoDrag}
              onDrop={handleShowLogoDrop}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1">
                  1. Event Show Logo Image
                </span>
                {uploadedShowLogo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedShowLogo(null);
                      if (showLogoPreset === 'uploaded') {
                        setShowLogoPreset('standard');
                      }
                    }}
                    className="text-[9px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 px-1.5 py-0.5 hover:bg-red-950/40 rounded transition-all cursor-pointer border border-transparent"
                  >
                    <X className="w-3 h-3" /> Clear logo
                  </button>
                )}
              </div>

              <input 
                type="file"
                ref={showLogoInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleShowLogoFile(e.target.files[0]);
                  }
                }}
                accept="image/*"
                className="hidden"
              />

              {uploadedShowLogo ? (
                <div className="space-y-3">
                  <div className="h-24 rounded-lg bg-slate-900 border border-slate-800 p-2 flex items-center justify-center relative group overflow-hidden">
                    <img 
                      src={uploadedShowLogo} 
                      alt="Uploaded Show Logo Preview" 
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-emerald-400 font-mono uppercase font-bold flex items-center gap-1">
                      <span>✓ Ready to render</span>
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowLogoPreset('uploaded');
                      }}
                      className={`text-[9px] font-bold px-2 py-1 rounded transition-all cursor-pointer border ${
                        showLogoPreset === 'uploaded'
                          ? 'bg-purple-950/50 text-purple-400 border-purple-800'
                          : 'bg-slate-900 text-slate-400 border-slate-850 hover:text-slate-200'
                      }`}
                    >
                      {showLogoPreset === 'uploaded' ? 'Showing in design' : 'Show in design'}
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => showLogoInputRef.current?.click()}
                  className="h-24 rounded-lg border border-dashed border-slate-800 hover:border-purple-500/50 flex flex-col items-center justify-center gap-1.5 cursor-pointer p-4 group transition-all text-center"
                >
                  <ImageIcon className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                  <div>
                    <p className="text-[10px] text-slate-300 font-medium">Drag & drop show logo here, or <span className="text-purple-400 underline decoration-purple-400/30">browse</span></p>
                    <p className="text-[8.5px] text-slate-500 mt-0.5">Supports PNG, JPG, WebP &middot; Rec: 400x120px</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sponsor Graphics Uploader */}
            <div 
              className={`rounded-xl border p-4 transition-all duration-200 ${
                sponsorsDragActive 
                  ? 'border-purple-500 bg-purple-950/20' 
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-800'
              }`}
              onDragEnter={handleSponsorsDrag}
              onDragOver={handleSponsorsDrag}
              onDragLeave={handleSponsorsDrag}
              onDrop={handleSponsorsDrop}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1">
                  2. Sponsor Brand Logos ({uploadedSponsors.length})
                </span>
                {uploadedSponsors.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedSponsors([]);
                    }}
                    className="text-[9px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 px-1.5 py-0.5 hover:bg-red-950/40 rounded transition-all cursor-pointer border border-transparent"
                  >
                    <X className="w-3 h-3" /> Clear sponsors
                  </button>
                )}
              </div>

              <input 
                type="file"
                ref={sponsorsInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleSponsorFiles(e.target.files);
                  }
                }}
                multiple
                accept="image/*"
                className="hidden"
              />

              <div 
                onClick={() => sponsorsInputRef.current?.click()}
                className="h-16 rounded-lg border border-dashed border-slate-800 hover:border-purple-500/50 flex flex-col items-center justify-center gap-1 cursor-pointer px-4 py-2 group transition-all text-center"
              >
                <Upload className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                <p className="text-[10px] text-slate-300">Drag sponsor logo(s) here, or <span className="text-purple-400 underline decoration-purple-400/30">browse</span></p>
              </div>

              {uploadedSponsors.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2 max-h-20 overflow-y-auto pr-1">
                  {uploadedSponsors.map((sp) => (
                    <div 
                      key={sp.id} 
                      className="aspect-video rounded bg-slate-900 border border-slate-800 p-1 flex items-center justify-center relative group"
                      title={sp.name}
                    >
                      <img 
                        src={sp.dataUrl} 
                        alt={sp.name} 
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedSponsors(prev => prev.filter(item => item.id !== sp.id));
                        }}
                        className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-slate-950 border border-slate-800 hover:bg-red-950 hover:text-red-400 rounded-full flex items-center justify-center text-[7.5px] text-slate-300 cursor-pointer transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Sponsor Configuration Section */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Include Sponsor Logos</span>
            <label className="flex items-center gap-2 text-xs text-slate-300 font-mono cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showSponsors} 
                onChange={(e) => setShowSponsors(e.target.checked)}
                className="rounded border-slate-800 text-purple-600 focus:ring-transparent bg-slate-950" 
              />
              Show Sponsor Bar
            </label>
          </div>

          {showSponsors && (
            <div className="flex flex-wrap gap-4 p-3 bg-slate-950 rounded-xl border border-slate-850 items-center">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono cursor-pointer hover:text-slate-200 select-none">
                <input 
                  type="checkbox" 
                  checked={selectedSponsors.includes('venum')} 
                  onChange={() => toggleSponsor('venum')}
                  className="rounded border-slate-800 text-purple-500 bg-slate-900"
                />
                Venum
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono cursor-pointer hover:text-slate-200 select-none">
                <input 
                  type="checkbox" 
                  checked={selectedSponsors.includes('monster')} 
                  onChange={() => toggleSponsor('monster')}
                  className="rounded border-slate-800 text-purple-500 bg-slate-900"
                />
                Monster Energy
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono cursor-pointer hover:text-slate-200 select-none">
                <input 
                  type="checkbox" 
                  checked={selectedSponsors.includes('gatorade')} 
                  onChange={() => toggleSponsor('gatorade')}
                  className="rounded border-slate-800 text-purple-500 bg-slate-900"
                />
                Gatorade
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono cursor-pointer hover:text-slate-200 select-none">
                <input 
                  type="checkbox" 
                  checked={selectedSponsors.includes('apexgear')} 
                  onChange={() => toggleSponsor('apexgear')}
                  className="rounded border-slate-800 text-purple-500 bg-slate-900"
                />
                Apex Gear
              </label>

              {/* Custom Sponsor Addition */}
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="text"
                  placeholder="Custom Sponsor Name"
                  value={newSponsorInput}
                  onChange={(e) => setNewSponsorInput(e.target.value)}
                  className="text-[10px] bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500 w-32 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSponsor}
                  className="text-[10px] font-bold text-purple-400 bg-purple-950/40 border border-purple-800/30 rounded px-2 py-1.5 hover:bg-purple-900/30 transition-all cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {bouts.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
          Matchmake more fighters and save them to publish the schedule.
        </div>
      ) : (
        <div className="flex justify-center">
          
          {/* THE PHYSICAL DIGITAL POSTER LAYOUT (HTML2CANVAS EXPORT ELEMENT) */}
          <div
            ref={posterRef}
            id="truerank-poster-render-frame"
            className="rounded-3xl border shadow-2xl relative flex flex-col items-center"
            style={{ 
              background: 'linear-gradient(180deg, #020617 0%, #0c0827 50%, #020617 100%)', 
              color: '#ffffff', 
              borderColor: 'rgba(147, 51, 234, 0.4)',
              borderWidth: '2px',
              width: '480px',
              maxWidth: '480px',
              padding: '40px 32px 40px 32px',
              boxSizing: 'border-box'
            }}
          >
            {/* Show Logo Brand Bar */}
            {showLogoPreset !== 'none' && (
              <div 
                className="w-full mb-6"
                style={{ 
                  width: '100%', 
                  display: 'block', 
                  textAlign: 'center', 
                  marginBottom: '24px' 
                }}
              >
                {showLogoPreset === 'standard' && (
                  <div 
                    className="inline-block tracking-widest text-[9px] font-black border px-3 py-1.5 rounded-full uppercase"
                    style={{ 
                      color: '#c084fc', 
                      backgroundColor: 'rgba(59, 7, 100, 0.5)', 
                      borderColor: 'rgba(168, 85, 247, 0.3)',
                      display: 'inline-block',
                      margin: '0 auto',
                      textAlign: 'center'
                    }}
                  >
                    ✦ TRUERANK Digital Running Order ✦
                  </div>
                )}
                {showLogoPreset === 'apex' && (
                  <div 
                    className="p-2 rounded-xl border"
                    style={{ 
                      color: '#f59e0b', 
                      backgroundColor: 'rgba(245, 158, 11, 0.05)', 
                      borderColor: 'rgba(245, 158, 11, 0.25)', 
                      width: '100%', 
                      boxSizing: 'border-box',
                      display: 'block',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px', textTransform: 'uppercase', color: '#f59e0b', display: 'block', textAlign: 'center' }}>
                      👑 APEX COMBAT 👑
                    </span>
                    <span style={{ fontSize: '8px', color: '#fbbf24', letterSpacing: '1px', marginTop: '3.5px', fontFamily: 'monospace', display: 'block', textAlign: 'center' }}>
                      PRO PRESTIGE CHAMPIONSHIP SERIES
                    </span>
                  </div>
                )}
                {showLogoPreset === 'wembley' && (
                  <div 
                    className="p-2 rounded-xl border"
                    style={{ 
                      color: '#06b6d4', 
                      backgroundColor: 'rgba(6, 182, 212, 0.05)', 
                      borderColor: 'rgba(6, 182, 212, 0.25)', 
                      width: '100%', 
                      boxSizing: 'border-box',
                      display: 'block',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px', textTransform: 'uppercase', color: '#06b6d4', display: 'block', textAlign: 'center' }}>
                      💎 WEMBLEY COLLISION 💎
                    </span>
                    <span style={{ fontSize: '8px', color: '#22d3ee', letterSpacing: '1.5px', marginTop: '3.5px', fontFamily: 'monospace', display: 'block', textAlign: 'center' }}>
                      LONDON COMBAT SPECTACLE
                    </span>
                  </div>
                )}
                {showLogoPreset === 'superslam' && (
                  <div 
                    className="p-2 rounded-xl border"
                    style={{ 
                      color: '#ec4899', 
                      backgroundColor: 'rgba(236, 72, 153, 0.05)', 
                      borderColor: 'rgba(236, 72, 153, 0.25)', 
                      width: '100%', 
                      boxSizing: 'border-box',
                      display: 'block',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px', textTransform: 'uppercase', color: '#f472b6', display: 'block', textAlign: 'center' }}>
                      🔥 LAS VEGAS SUPER-SLAM 🔥
                    </span>
                    <span style={{ fontSize: '8px', color: '#f472b6', letterSpacing: '2px', marginTop: '3.5px', fontFamily: 'monospace', display: 'block', textAlign: 'center' }}>
                      ARENA SPECIAL RUNNING ORDER
                    </span>
                  </div>
                )}
                {showLogoPreset === 'custom' && (
                  <div 
                    className="p-2 rounded-xl border"
                    style={{ 
                      color: '#c084fc', 
                      backgroundColor: 'rgba(168, 85, 247, 0.05)', 
                      borderColor: 'rgba(168, 85, 247, 0.25)', 
                      width: '100%', 
                      boxSizing: 'border-box',
                      display: 'block',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 'black', letterSpacing: '2px', textTransform: 'uppercase', color: '#e9d5ff', display: 'block', textAlign: 'center' }}>
                      {customLogoText || 'COMBAT CHAMPIONSHIP'}
                    </span>
                    <span style={{ fontSize: '7.5px', color: '#d8b4fe', letterSpacing: '1px', marginTop: '3.5px', fontFamily: 'monospace', display: 'block', textAlign: 'center' }}>
                      OFFICIAL SHOWRUNNING MATCHUPS
                    </span>
                  </div>
                )}
                {showLogoPreset === 'uploaded' && (
                  <div 
                    className="flex justify-center items-center w-full select-none" 
                    style={{ 
                      width: '100%', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      textAlign: 'center' 
                    }}
                  >
                    {uploadedShowLogo ? (
                      <img 
                        src={uploadedShowLogo} 
                        alt="Uploaded Show Logo" 
                        style={{ 
                          maxHeight: '52px', 
                          maxWidth: '300px', 
                          objectFit: 'contain', 
                          display: 'inline-block',
                          margin: '0 auto'
                        }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div 
                        className="inline-block tracking-widest text-[9px] font-black border px-3 py-1.5 rounded-full uppercase"
                        style={{ 
                          color: '#bef264', 
                          backgroundColor: 'rgba(132, 204, 22, 0.1)', 
                          borderColor: 'rgba(132, 204, 22, 0.35)',
                          display: 'inline-block',
                          margin: '0 auto',
                          textAlign: 'center'
                        }}
                      >
                        📂 NO SHOW LOGO FILE UPLOADED
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Event Name Heading */}
            <div className="w-full text-center space-y-1 mb-5">
              <h1 className="text-xl font-extrabold tracking-tight uppercase" style={{ color: '#f8fafc', fontSize: '19px', lineHeight: '1.2' }}>
                {event.name}
              </h1>
              <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: '#c084fc' }}>
                Arena Matchups & Walkout Times
              </p>
            </div>

            {/* Event Metadata Row (Date & Location) */}
            <div 
              className="w-full flex justify-between items-center py-2 px-3 border-y mb-6 text-xs font-mono"
              style={{ color: '#94a3b8', borderColor: 'rgba(148, 163, 184, 0.15)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" color="#a855f7" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-right justify-end">
                <MapPin className="w-3.5 h-3.5" color="#a855f7" />
                <span className="uppercase text-[10px] tracking-tight">{event.location}</span>
              </div>
            </div>

            {/* Matchup List divided by Card splits */}
            <div className="w-full space-y-6">
              {/* 1. Title Fights */}
              {extendedBouts.filter(b => b.cardType === 'TITLE').length > 0 && (
                <div className="space-y-4">
                  <div className="py-1 flex items-center justify-center gap-3">
                    <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(245, 158, 11, 0.4))' }} />
                    <span className="text-[9px] font-black font-mono tracking-[0.2em] text-amber-400 uppercase flex items-center gap-1">
                      👑 TITLE FIGHTS 👑
                    </span>
                    <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, rgba(245, 158, 11, 0.4))' }} />
                  </div>
                  <div className="space-y-4">
                    {extendedBouts.filter(b => b.cardType === 'TITLE').map((b) => (
                      <div
                        key={b.id}
                        className="border-b pb-4 last:border-b-0 last:pb-0"
                        style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                      >
                        {/* Header Row: Timing and weight class */}
                        <div className="flex items-center justify-between text-[10px] font-mono mb-2" style={{ color: '#94a3b8' }}>
                          <span 
                            className="font-bold px-2 py-0.5 rounded border"
                            style={{ color: '#fbbf24', backgroundColor: 'rgba(120, 53, 4, 0.4)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                          >
                            {b.walkoutTime} Walkout
                          </span>
                          <span className="uppercase font-semibold tracking-wider text-[9px]" style={{ color: '#fbbf24' }}>
                            {b.sport} {b.weightClass} Division {b.confirmedWeight && `• ${b.confirmedWeight}`}
                          </span>
                        </div>

                        {/* VS Grid: [Red Corner Name] VS [Blue Corner Name] */}
                        <div className="grid grid-cols-11 items-center gap-2">
                          
                          {/* Red Corner */}
                          <div className="col-span-5 text-right">
                            <span className="block text-xs font-bold tracking-tight leading-tight" style={{ color: '#f1f5f9' }}>
                              {b.fighterRedName}
                            </span>
                            <span className="block text-[9px] font-mono tracking-wide uppercase mt-0.5" style={{ color: '#f87171' }}>
                              {b.fighterRedGym} &bull; Red
                            </span>
                          </div>

                          {/* VS separator */}
                          <div className="col-span-1 text-center">
                            <span 
                              className="text-[10px] font-bold font-mono tracking-tighter px-1 py-0.5 border rounded block text-center"
                              style={{ color: '#fbbf24', backgroundColor: 'rgba(120, 53, 4, 0.2)', borderColor: 'rgba(245, 158, 11, 0.3)', minWidth: '22px' }}
                            >
                              VS
                            </span>
                          </div>

                          {/* Blue Corner */}
                          <div className="col-span-5 text-left">
                            <span className="block text-xs font-bold tracking-tight leading-tight" style={{ color: '#f1f5f9' }}>
                              {b.fighterBlueName}
                            </span>
                            <span className="block text-[9px] font-mono tracking-wide uppercase mt-0.5" style={{ color: '#60a5fa' }}>
                              {b.fighterBlueGym} &bull; Blue
                            </span>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Main Card */}
              {extendedBouts.filter(b => b.cardType === 'MAIN').length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="py-1 flex items-center justify-center gap-3">
                    <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(168, 85, 247, 0.4))' }} />
                    <span className="text-[9px] font-black font-mono tracking-[0.2em] text-purple-400 uppercase flex items-center gap-1">
                      🏆 MAIN CARD 🏆
                    </span>
                    <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, rgba(168, 85, 247, 0.4))' }} />
                  </div>
                  <div className="space-y-4">
                    {extendedBouts.filter(b => b.cardType === 'MAIN').map((b) => (
                      <div
                        key={b.id}
                        className="border-b pb-4 last:border-b-0 last:pb-0"
                        style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                      >
                        {/* Header Row: Timing and weight class */}
                        <div className="flex items-center justify-between text-[10px] font-mono mb-2" style={{ color: '#94a3b8' }}>
                          <span 
                            className="font-bold px-2 py-0.5 rounded border"
                            style={{ color: '#c084fc', backgroundColor: 'rgba(59, 7, 100, 0.4)', borderColor: 'rgba(107, 33, 168, 0.3)' }}
                          >
                            {b.walkoutTime} Walkout
                          </span>
                          <span className="uppercase font-semibold tracking-wider text-[9px]" style={{ color: '#c084fc' }}>
                            {b.sport} {b.weightClass} Division {b.confirmedWeight && `• ${b.confirmedWeight}`}
                          </span>
                        </div>

                        {/* VS Grid: [Red Corner Name] VS [Blue Corner Name] */}
                        <div className="grid grid-cols-11 items-center gap-2">
                          
                          {/* Red Corner */}
                          <div className="col-span-5 text-right">
                            <span className="block text-xs font-bold tracking-tight leading-tight" style={{ color: '#f1f5f9' }}>
                              {b.fighterRedName}
                            </span>
                            <span className="block text-[9px] font-mono tracking-wide uppercase mt-0.5" style={{ color: '#f87171' }}>
                              {b.fighterRedGym} &bull; Red
                            </span>
                          </div>

                          {/* VS separator */}
                          <div className="col-span-1 text-center">
                            <span 
                              className="text-[10px] font-bold font-mono tracking-tighter px-1 py-0.5 border rounded block text-center"
                              style={{ color: '#a855f7', backgroundColor: 'rgba(59, 7, 100, 0.2)', borderColor: 'rgba(147, 51, 234, 0.3)', minWidth: '22px' }}
                            >
                              VS
                            </span>
                          </div>

                          {/* Blue Corner */}
                          <div className="col-span-5 text-left">
                            <span className="block text-xs font-bold tracking-tight leading-tight" style={{ color: '#f1f5f9' }}>
                              {b.fighterBlueName}
                            </span>
                            <span className="block text-[9px] font-mono tracking-wide uppercase mt-0.5" style={{ color: '#60a5fa' }}>
                              {b.fighterBlueGym} &bull; Blue
                            </span>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Undercard */}
              {extendedBouts.filter(b => b.cardType === 'UNDER' || !b.cardType).length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="py-1 flex items-center justify-center gap-3">
                    <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(148, 163, 184, 0.15))' }} />
                    <span className="text-[9px] font-black font-mono tracking-[0.2em] text-slate-450 uppercase flex items-center gap-1">
                      ⚔️ UNDERCARD ⚔️
                    </span>
                    <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, rgba(148, 163, 184, 0.15))' }} />
                  </div>
                  <div className="space-y-4">
                    {extendedBouts.filter(b => b.cardType === 'UNDER' || !b.cardType).map((b) => (
                      <div
                        key={b.id}
                        className="border-b pb-4 last:border-b-0 last:pb-0"
                        style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
                      >
                        {/* Header Row: Timing and weight class */}
                        <div className="flex items-center justify-between text-[10px] font-mono mb-2" style={{ color: '#94a3b8' }}>
                          <span 
                            className="font-bold px-2 py-0.5 rounded border"
                            style={{ color: '#94a3b8', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderColor: 'rgba(71, 85, 105, 0.3)' }}
                          >
                            {b.walkoutTime} Walkout
                          </span>
                          <span className="uppercase font-semibold tracking-wider text-[9px]" style={{ color: '#94a3b8' }}>
                            {b.sport} {b.weightClass} Division {b.confirmedWeight && `• ${b.confirmedWeight}`}
                          </span>
                        </div>

                        {/* VS Grid: [Red Corner Name] VS [Blue Corner Name] */}
                        <div className="grid grid-cols-11 items-center gap-2">
                          
                          {/* Red Corner */}
                          <div className="col-span-5 text-right">
                            <span className="block text-xs font-bold tracking-tight leading-tight" style={{ color: '#f1f5f9' }}>
                              {b.fighterRedName}
                            </span>
                            <span className="block text-[9px] font-mono tracking-wide uppercase mt-0.5" style={{ color: '#f87171' }}>
                              {b.fighterRedGym} &bull; Red
                            </span>
                          </div>

                          {/* VS separator */}
                          <div className="col-span-1 text-center">
                            <span 
                              className="text-[10px] font-bold font-mono tracking-tighter px-1 py-0.5 border rounded block text-center"
                              style={{ color: '#94a3b8', backgroundColor: 'rgba(30, 41, 59, 0.2)', borderColor: 'rgba(71, 85, 105, 0.3)', minWidth: '22px' }}
                            >
                              VS
                            </span>
                          </div>

                          {/* Blue Corner */}
                          <div className="col-span-5 text-left">
                            <span className="block text-xs font-bold tracking-tight leading-tight" style={{ color: '#f1f5f9' }}>
                              {b.fighterBlueName}
                            </span>
                            <span className="block text-[9px] font-mono tracking-wide uppercase mt-0.5" style={{ color: '#60a5fa' }}>
                              {b.fighterBlueGym} &bull; Blue
                            </span>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sponsor Tray Element */}
            {showSponsors && (selectedSponsors.length > 0 || uploadedSponsors.length > 0) && (
              <div 
                className="w-full mt-8 pt-4 border-t flex flex-col items-center justify-center gap-2" 
                style={{ borderColor: 'rgba(148, 163, 184, 0.15)' }}
              >
                <span className="text-[7.5px] font-mono tracking-widest text-slate-500 uppercase">OFFICIAL EVENT SPONSORS</span>
                
                {selectedSponsors.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 text-[9px] font-bold font-sans text-slate-400">
                    {selectedSponsors.map(sp => {
                      let displaySponsor = sp;
                      if (sp === 'venum') displaySponsor = '⚡ VENUM';
                      if (sp === 'monster') displaySponsor = '❄ MONSTER';
                      if (sp === 'gatorade') displaySponsor = '✴ GATORADE';
                      if (sp === 'apexgear') displaySponsor = '⭐ APEX GEAR';
                      
                      return (
                        <span 
                          key={sp} 
                          className="px-2 py-0.5 rounded bg-slate-900 border text-[8px]"
                          style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                        >
                          {displaySponsor.toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Uploaded Graphical Sponsors */}
                {uploadedSponsors.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-1">
                    {uploadedSponsors.map(sp => (
                      <div 
                        key={sp.id} 
                        className="flex justify-center items-center h-6 select-none bg-slate-900/40 px-2 py-0.5 rounded border border-white/5"
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                      >
                        <img 
                          src={sp.dataUrl} 
                          alt={sp.name} 
                          style={{ 
                            height: '14px', 
                            maxWidth: '75px', 
                            objectFit: 'contain',
                            display: 'block'
                          }} 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer watermark */}
            <div 
              className="w-full text-center mt-8 pt-4 border-t text-[8px] font-mono uppercase tracking-widest"
              style={{ borderColor: 'rgba(148, 163, 184, 0.1)', color: '#475569' }}
            >
              Generated via TrueRank &bull; Prestige Analytics
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
