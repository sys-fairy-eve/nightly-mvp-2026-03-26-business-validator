import { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeIdea, type ValidationResult, type PhaseResult } from './analyzer';

const EXAMPLE_IDEAS = [
  "A SaaS tool that helps freelance designers track client feedback and revisions in one place",
  "A marketplace connecting local farmers with restaurants who want to source ingredients directly",
  "A subscription service that sends curated book recommendations with hand-written notes to seniors",
  "An app that helps remote teams run better async standups with AI-generated summaries",
  "A platform for fitness coaches to create and sell 30-day challenge programs to their clients",
];

const PHASE_COLORS: Record<number, string> = {
  1: 'border-indigo-500',
  2: 'border-emerald-500',
  3: 'border-amber-500',
  4: 'border-violet-500',
  5: 'border-red-500',
  6: 'border-amber-400',
  7: 'border-blue-500',
  8: 'border-emerald-400',
  9: 'border-lime-500',
  10: 'border-purple-500',
};

function ScoreGauge({ score, animate }: { score: number; animate: boolean }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [strokeDashoffset, setStrokeDashoffset] = useState(283);
  
  const getColor = (s: number) => {
    if (s < 33) return '#ef4444';
    if (s < 67) return '#f59e0b';
    return '#10b981';
  };
  
  useEffect(() => {
    if (!animate) return;
    
    let start: number | null = null;
    const duration = 2000;
    const circumference = 283;
    
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(eased * score);
      setDisplayScore(currentScore);
      setStrokeDashoffset(circumference - (circumference * currentScore / 100));
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  }, [score, animate]);
  
  const color = getColor(displayScore);
  const label = displayScore >= 75 ? 'Strong' : displayScore >= 50 ? 'Viable' : 'Developing';
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.3s ease', filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white">{displayScore}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <div className="mt-2 px-4 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: color + '20', color }}>
        {label}
      </div>
    </div>
  );
}

function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string; delay: number }[]>([]);
  
  useEffect(() => {
    if (!active) return;
    const emojis = ['🎉', '✨', '🚀', '💡', '🌟', '🎊', '💎', '🏆'];
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: window.innerHeight - 100,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      delay: Math.random() * 1000,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 3000);
  }, [active]);
  
  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: p.x,
            top: p.y,
            animationDelay: `${p.delay}ms`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </>
  );
}

function PhaseCard({ phase, index, active, onClick }: {
  phase: PhaseResult;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  const borderColor = PHASE_COLORS[phase.id] || 'border-slate-500';
  
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`phase-card cursor-pointer rounded-xl p-5 bg-slate-800 border-l-4 ${borderColor} 
        hover:bg-slate-750 transition-all duration-200
        ${active ? 'ring-2 ring-white/20 shadow-lg' : ''}
        ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        animationDelay: `${index * 80}ms`,
        animationPlayState: visible ? 'running' : 'paused',
      }}
      id={`phase-${phase.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{phase.icon}</span>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Phase {phase.id}</div>
            <h3 className="text-white font-semibold">{phase.title}</h3>
          </div>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`w-1.5 h-6 rounded-full transition-all ${
                i < phase.score ? 'opacity-100' : 'opacity-20'
              }`}
              style={{
                backgroundColor: i < phase.score ? phase.color : '#475569',
              }}
            />
          ))}
        </div>
      </div>
      
      <ul className="space-y-1.5 mb-3">
        {phase.insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <span className="text-slate-500 mt-0.5 flex-shrink-0">›</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
      
      <div className="mt-3 pt-3 border-t border-slate-700">
        <p className="text-sm text-slate-400 italic">
          <span className="text-slate-500 mr-1">→</span>
          {phase.actionPrompt}
        </p>
      </div>
    </div>
  );
}

function PhaseStepper({ phases, activePhase, onSelect }: {
  phases: PhaseResult[];
  activePhase: number;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
      {phases.map((phase, i) => (
        <button
          key={phase.id}
          onClick={() => onSelect(phase.id)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            activePhase === phase.id
              ? 'bg-white text-slate-900'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
          title={phase.title}
        >
          <span>{phase.icon}</span>
          <span className="hidden sm:inline">{phase.title}</span>
          {!phase.title && <span className="sm:hidden">{i + 1}</span>}
        </button>
      ))}
    </div>
  );
}

function ShareButton({ idea }: { idea: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleShare = useCallback(async () => {
    const url = new URL(window.location.href);
    url.hash = encodeURIComponent(idea);
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [idea]);
  
  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-all duration-200"
    >
      <span>{copied ? '✅' : '🔗'}</span>
      <span>{copied ? 'Copied!' : 'Share Results'}</span>
    </button>
  );
}

export default function App() {
  const [idea, setIdea] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [activePhase, setActivePhase] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gaugeAnimate, setGaugeAnimate] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  
  // Load idea from URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const decoded = decodeURIComponent(hash);
        setIdea(decoded);
        const r = analyzeIdea(decoded);
        setResult(r);
        setTimeout(() => {
          setGaugeAnimate(true);
          if (r.overallScore > 75) setShowConfetti(true);
        }, 300);
      } catch {
        // ignore
      }
    }
  }, []);
  
  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % EXAMPLE_IDEAS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  // Keyboard navigation
  useEffect(() => {
    if (!result) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActivePhase(p => Math.min(p + 1, result.phases.length));
        document.getElementById(`phase-${Math.min(activePhase + 1, result.phases.length)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (e.key === 'ArrowLeft') {
        setActivePhase(p => Math.max(p - 1, 1));
        document.getElementById(`phase-${Math.max(activePhase - 1, 1)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [result, activePhase]);
  
  const handleValidate = useCallback(() => {
    if (!idea.trim()) return;
    const r = analyzeIdea(idea);
    setResult(r);
    setGaugeAnimate(false);
    setShowConfetti(false);
    setActivePhase(1);
    setTimeout(() => {
      setGaugeAnimate(true);
      if (r.overallScore > 75) setShowConfetti(true);
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    // Update URL hash
    window.location.hash = encodeURIComponent(idea);
  }, [idea]);
  
  const handlePhaseSelect = useCallback((id: number) => {
    setActivePhase(id);
    document.getElementById(`phase-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Confetti active={showConfetti} />
      
      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <div>
              <h1 className="text-lg font-bold text-white">Idea Validator</h1>
              <p className="text-xs text-slate-500">Minimalist Entrepreneur Framework</p>
            </div>
          </div>
          <a
            href="https://www.minimalistentrepreneur.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            By Sahil Lavingia →
          </a>
        </div>
      </header>
      
      {/* Hero / Input */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Is your idea worth building?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Validate your startup idea through the 10-phase Minimalist Entrepreneur framework — 
            no BS, no hype, just honest signal.
          </p>
          
          <div className="bg-slate-900 rounded-2xl p-2 shadow-2xl border border-slate-800">
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              placeholder={EXAMPLE_IDEAS[placeholderIdx]}
              rows={3}
              className="w-full bg-transparent text-white placeholder-slate-600 resize-none p-4 text-base outline-none rounded-xl"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleValidate();
              }}
            />
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-xs text-slate-600">{idea.length} chars · ⌘↵ to validate</span>
              <button
                onClick={handleValidate}
                disabled={!idea.trim()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 text-sm shadow-lg shadow-indigo-900/40"
              >
                Validate My Idea →
              </button>
            </div>
          </div>
          
          <p className="text-xs text-slate-600 mt-4">100% client-side · No data stored · Free forever</p>
        </div>
      </section>
      
      {/* Results */}
      {result && result.phases.length > 0 && (
        <section id="results" className="px-4 pb-24">
          <div className="max-w-5xl mx-auto">
            
            {/* Score + Summary */}
            <div className="bg-slate-900 rounded-2xl p-6 md:p-8 mb-8 border border-slate-800">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="flex-shrink-0">
                  <ScoreGauge score={result.overallScore} animate={gaugeAnimate} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-white mb-1">Validation Results</h2>
                  <p className="text-slate-400 text-sm mb-1 truncate">
                    Idea type: <span className="text-indigo-400 capitalize">{result.ideaType}</span>
                  </p>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">"{idea}"</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Top Strengths</h3>
                      {result.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1">
                          <span className="text-emerald-500 flex-shrink-0">✓</span>
                          <span className="text-sm text-slate-300">{s}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Key Risks</h3>
                      {result.risks.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1">
                          <span className="text-amber-500 flex-shrink-0">⚠</span>
                          <span className="text-sm text-slate-300">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <ShareButton idea={idea} />
                    <button
                      onClick={() => {
                        setResult(null);
                        setIdea('');
                        window.location.hash = '';
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      ← New idea
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Next Steps */}
            <div className="bg-slate-900/50 rounded-xl p-5 mb-8 border border-slate-800">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>📋</span> Your Next Steps
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.nextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-indigo-500 flex-shrink-0 font-mono text-xs mt-0.5">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Phase Stepper */}
            <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm py-3 mb-6 -mx-4 px-4 border-b border-slate-800">
              <PhaseStepper
                phases={result.phases}
                activePhase={activePhase}
                onSelect={handlePhaseSelect}
              />
            </div>
            
            {/* Phase Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.phases.map((phase, i) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  index={i}
                  active={activePhase === phase.id}
                  onClick={() => setActivePhase(phase.id)}
                />
              ))}
            </div>
            
            <p className="text-center text-xs text-slate-600 mt-8">
              Framework inspired by{' '}
              <a
                href="https://www.minimalistentrepreneur.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-400 transition-colors underline"
              >
                The Minimalist Entrepreneur
              </a>{' '}
              by Sahil Lavingia · Built with ❤️ by Wilson
            </p>
          </div>
        </section>
      )}
      
      {/* Footer (when no results) */}
      {!result && (
        <footer className="px-4 py-8 text-center">
          <p className="text-xs text-slate-700">
            Framework by{' '}
            <a
              href="https://www.minimalistentrepreneur.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-500 transition-colors underline"
            >
              The Minimalist Entrepreneur
            </a>
            {' '}· All analysis is client-side only
          </p>
        </footer>
      )}
    </div>
  );
}
