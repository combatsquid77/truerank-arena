import React, { useState } from 'react';
import { Upload, FileCode, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

interface CsvUploaderProps {
  onUploadSuccess: (newFighters: any[]) => void;
}

export default function CsvUploader({ onUploadSuccess }: CsvUploaderProps) {
  const [csvText, setCsvText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Template pre-populated CSV text for fast 1-click imports
  const handleLoadMockTemplate = () => {
    const mockContent = `Name,Gym,Location,Age,Gender,Class,BjjBelt,mmaRecord,bjjRecord,mtRecord,boxingRecord
"Jon Jones","JacksonWink","Albuquerque, NM",36,"MALE","100kg+","BROWN","27-1-0","0-0-0","0-0-0","0-0-0"
"Kamaru Usman","Elevation","Denver, CO",35,"MALE","-78kg","BLACK","20-3-0","5-0-0","0-0-0","0-0-0"
"Valentina Shevchenko","Tiger Muay Thai","Phuket, TH",35,"FEMALE","-63kg","BLACK","23-4-1","10-1-0","50-2-0","0-0-0"
"Weili Zhang","Black Tiger","Beijing, CN",34,"FEMALE","-63kg","PURPLE","24-3-0","6-0-0","0-0-0","0-0-0"
"Leandro Lo","Alliance","São Paulo, BR",32,"MALE","-85kg","BLACK","0-0-0","45-10-0","0-0-0","0-0-0"
"Saenchai P.K.","Yokkao Muay Thai","Bangkok, TH",43,"MALE","-63kg","WHITE","0-0-0","0-0-0","327-49-2","0-0-0"
"Canelo Alvarez","Canelo Team","Guadalajara, MX",33,"MALE","-78kg","WHITE","0-0-0","0-0-0","0-0-0","60-2-2"`;
    setCsvText(mockContent);
    setSuccessMsg(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!csvText.trim()) {
      setError('Please provide or load CSV data text first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvContent: csvText }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'CSV processing failed.');
      }

      const resData = await response.json();
      setSuccessMsg(resData.message);
      setCsvText('');
      onUploadSuccess(resData.fighters);
    } catch (err: any) {
      setError(err.message || 'CSV upload error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4" id="promoter-csv-uploader">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-purple-400" />
            Promoter CSV Fighter Batch Parser
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Bulk onboard competitors translating split files e.g. <strong className="text-purple-400">"14-3-1"</strong> directly into numerical records.
          </p>
        </div>

        <button
          onClick={handleLoadMockTemplate}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-purple-950/40 hover:bg-purple-900/40 text-purple-400 border border-purple-800/50 flex items-center gap-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Load Mock CSV Template
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          CSV Source Text Frame
        </label>
        <textarea
          rows={6}
          id="csv-text-area"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={`Name,Gym,Location,Age,Gender,Class,BjjBelt,mmaRecord,bjjRecord,mtRecord,boxingRecord\n"Fighter Name","Club","London, UK",26,"MALE","-73kg","PURPLE","14-3-1","0-0-0","0-0-0","0-0-0"`}
          className="w-full text-xs font-mono p-4 rounded-xl bg-slate-950 border border-slate-850 text-slate-200 focus:outline-none focus:border-purple-500 placeholder-slate-700 leading-relaxed"
        />
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-300 flex items-start gap-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 flex items-start gap-2.5 text-xs shadow-md">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="w-full py-2.5 text-xs font-bold rounded-lg text-white bg-purple-700 hover:bg-purple-600 border border-purple-500 shadow-md shadow-purple-950/20 transition-all"
      >
        {loading ? 'Batch Parsing Fighters...' : 'Excecute Batch CSV Import'}
      </button>

      {/* CSV Specifications Helper */}
      <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 text-[10.5px] text-slate-500 font-mono space-y-1">
        <span className="font-bold text-slate-400 block uppercase tracking-wide">Expected CSV headers:</span>
        <p>Name | Gym | Location | Age | Gender | Class (options: -63kg, -68kg, -73kg, -78kg, -85kg, -91kg, 100kg+) | BjjBelt | mmaRecord | bjjRecord | mtRecord | boxingRecord</p>
      </div>
    </div>
  );
}
