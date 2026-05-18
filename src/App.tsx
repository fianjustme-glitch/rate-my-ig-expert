import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Star, Instagram, ChevronRight, CheckCircle2, AlertCircle, Loader2, Sparkles, Image as ImageIcon, X } from 'lucide-react';

interface ReviewResult {
  firstImpression: string;
  bioReview: string;
  feedAesthetic: string;
  finalScore: number;
  finalScoreReason: string;
  proTips: string[];
}

export default function App() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/rate-ig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });

      if (!response.ok) throw new Error("Gagal menganalisis. Coba lagi.");
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-brand selection:text-white bg-dark text-[#F5F5F5] overflow-x-hidden">
      {!result ? (
        <div className="max-w-4xl mx-auto px-6 py-20">
          {/* Landing Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16 relative"
          >
            <div className="absolute inset-0 grid-pattern opacity-10 -z-10"></div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
              <Instagram className="w-4 h-4 text-brand" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Professional IG Audit</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-bold mb-4 tracking-tight leading-none">
              AUDIT<br/><span className="text-brand">PROPOSAL.</span>
            </h1>
            <p className="font-serif-italic text-zinc-400 text-2xl mt-4">Curated for Creative Minds</p>
          </motion.header>

          {/* Main Action */}
          <main>
            <section className="glass rounded-[40px] p-8 md:p-16 relative overflow-hidden group">
              <div className="absolute inset-0 grid-pattern opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="absolute -top-12 -right-12 p-8 opacity-5">
                <Camera className="w-64 h-64" />
              </div>

              <div className="relative z-10 text-center">
                <h2 className="text-3xl font-display font-bold mb-10 text-white tracking-tight">Upload Your Profile & Feed Screenshots</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  {images.map((img, idx) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={idx} 
                      className="relative aspect-[9/16] rounded-2xl overflow-hidden group/img ring-1 ring-white/10"
                    >
                      <img src={img} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-xl rounded-full opacity-0 group-hover/img:opacity-100 transition-all hover:scale-110"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </motion.div>
                  ))}
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[9/16] rounded-2xl border border-dashed border-zinc-800 flex flex-col items-center justify-center gap-4 hover:border-brand hover:bg-zinc-900/50 transition-all group/btn"
                  >
                    <div className="p-4 rounded-full bg-zinc-900 group-hover/btn:bg-brand transition-colors">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Add Snapshot</span>
                  </button>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                />

                <div className="flex justify-center">
                  <button
                    disabled={images.length === 0 || loading}
                    onClick={startAnalysis}
                    className="relative px-12 py-5 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-full flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-brand" />
                        <span>Commence Audit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-center gap-3 text-red-400 justify-center"
              >
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium text-sm">{error}</p>
              </motion.div>
            )}
          </main>
        </div>
      ) : (
        /* Split Result Layout */
        <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
          {/* LEFT: Preview Panel */}
          <div className="lg:w-5/12 w-full lg:h-full bg-panel border-r border-white/5 p-12 overflow-y-auto relative flex flex-col">
            <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none"></div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative z-10 flex-1"
            >
              <button 
                onClick={() => {
                  setResult(null);
                  setImages([]);
                }}
                className="mb-12 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to Upload
              </button>

              <div className="flex items-center gap-6 mb-12">
                <div className="w-20 h-20 rounded-full border-2 border-brand p-1">
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-yellow-400 via-brand to-purple-600 flex items-center justify-center">
                    <div className="w-[92%] h-[92%] rounded-full bg-zinc-900 flex items-center justify-center font-display font-black text-2xl text-white">IG</div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-display font-bold tracking-tight text-white">Profile Context</h2>
                  <p className="font-serif-italic text-zinc-500 text-lg">Visual Audit Assets</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-white/5 ring-1 ring-white/5">
                    <img src={img} className="w-full h-full object-cover" alt="Audit Asset" />
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 glass rounded-2xl">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Audit Context</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Deep learning analysis completed using Artistic Flair profile v3.0. Static snapshot verification active.
                </p>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Audit Report */}
          <div className="lg:w-7/12 w-full lg:h-full p-8 md:p-16 overflow-y-auto relative bg-dark">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-3xl"
            >
              <header className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
                <div>
                  <h1 className="text-6xl font-display font-bold leading-tight tracking-tighter">AUDIT<br/><span className="text-brand">VERDICT.</span></h1>
                  <p className="font-serif-italic text-zinc-400 text-2xl mt-4">Professional Assessment</p>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-8xl font-display font-black score-glow text-white leading-none">{result.finalScore}</div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mt-2">Overall Quality Score</div>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-brand">01. First Impression</h3>
                  <p className="text-zinc-300 leading-relaxed font-medium">
                    {result.firstImpression}
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-brand">02. Bio & Profile Picture</h3>
                  <p className="text-zinc-300 leading-relaxed font-medium">
                    {result.bioReview}
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-brand">03. Feed Aesthetic</h3>
                  <p className="text-zinc-300 leading-relaxed font-medium">
                    {result.feedAesthetic}
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-brand">04. Verdict Summary</h3>
                  <p className="text-zinc-300 leading-relaxed font-medium">
                    {result.finalScoreReason}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[32px] p-10 text-black mb-16 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-black opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
                  <Sparkles className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <Sparkles className="w-5 h-5 text-brand" />
                    <h3 className="font-display font-bold uppercase text-xs tracking-widest">Expert Pro Tips</h3>
                  </div>
                  <ul className="grid grid-cols-1 gap-6">
                    {result.proTips.map((tip, i) => (
                      <li key={i} className="flex gap-4 items-start">
                        <span className="font-black text-brand text-xl leading-none">0{i+1}.</span>
                        <span className="font-bold text-base leading-tight tracking-tight">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <footer className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex gap-4">
                  <span className="text-[10px] px-3 py-1.5 bg-white/5 rounded-full border border-white/10 uppercase font-black tracking-widest text-zinc-400">Expert Mode</span>
                  <span className="text-[10px] px-3 py-1.5 bg-white/5 rounded-full border border-white/10 uppercase font-black tracking-widest text-zinc-400">Creative Audit</span>
                </div>
                <p className="text-xs text-zinc-500 font-serif-italic">Keep creating, the vision is clear. 🚀</p>
              </footer>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
