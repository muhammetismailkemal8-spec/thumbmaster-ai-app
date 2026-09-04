import React from 'react';
import { IDEA_ANALYSIS_DATA } from '../data/ideaAnalysisData';
import { AlertTriangle, Rocket, Clock, ShieldCheck, Zap, Code2, CheckCircle2, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const IdeaStrategyView: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 text-slate-100">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>{t.strategyHeroBadge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            {IDEA_ANALYSIS_DATA.projectTitle}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {IDEA_ANALYSIS_DATA.summary}
          </p>
        </div>
      </div>

      {/* Grid: Weaknesses & Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zayıf Kısımlar (Risks) */}
        <div className="bg-slate-900/80 rounded-2xl border border-rose-500/30 p-6 space-y-6 backdrop-blur-sm">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.weaknessesTitle}</h2>
              <p className="text-xs text-slate-400">{t.weaknessesSubtitle}</p>
            </div>
          </div>

          <div className="space-y-4">
            {IDEA_ANALYSIS_DATA.weaknesses.map((item, idx) => (
              <div key={idx} className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-rose-300 text-sm">{item.subtitle}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-950 text-rose-400 border border-rose-800">
                    Impact: {item.impact}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                {item.solutionOrTip && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-start space-x-2 text-xs text-emerald-400">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span><strong>Recommended Solution:</strong> {item.solutionOrTip}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Geliştirme Önerileri (Opportunities) */}
        <div className="bg-slate-900/80 rounded-2xl border border-amber-500/30 p-6 space-y-6 backdrop-blur-sm">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.improvementsTitle}</h2>
              <p className="text-xs text-slate-400">{t.improvementsSubtitle}</p>
            </div>
          </div>

          <div className="space-y-4">
            {IDEA_ANALYSIS_DATA.improvements.map((item, idx) => (
              <div key={idx} className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-amber-300 text-sm">{item.subtitle}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                    Value: {item.impact}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MVP Timeline Roadmap */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{t.mvpTitle}</h2>
            <p className="text-xs text-slate-400">{t.mvpSubtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {IDEA_ANALYSIS_DATA.mvpSteps.map((step, idx) => (
            <div key={idx} className="bg-slate-950/70 rounded-xl p-5 border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 absolute top-0 left-0" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{step.phase}</span>
                <span className="flex items-center space-x-1 text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />
                  <span>{step.duration}</span>
                </span>
              </div>

              <ul className="space-y-2.5">
                {step.tasks.map((task, tidx) => (
                  <li key={tidx} className="flex items-start space-x-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack & Architecture */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <Code2 className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-bold text-white">{t.techStackTitle}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {IDEA_ANALYSIS_DATA.techStack.map((tech, idx) => (
            <div key={idx} className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-xs text-slate-200 font-medium">{tech}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

