import React, { useState } from 'react';
import { PerceptionManagementDetails, EvolutionaryTriggerItem } from '../types';
import {
  Brain,
  Eye,
  Zap,
  Target,
  ShieldAlert,
  Flame,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Compass,
  Activity,
  Award,
} from 'lucide-react';

interface EvolutionaryPsychologyAuditProps {
  data: PerceptionManagementDetails;
  videoTitle?: string;
}

export const EvolutionaryPsychologyAudit: React.FC<EvolutionaryPsychologyAuditProps> = ({
  data,
  videoTitle,
}) => {
  const [expandedTrigger, setExpandedTrigger] = useState<number | null>(null);

  const getLoadBadge = (verdict: string) => {
    const v = (verdict || '').toUpperCase();
    if (v.includes('MINIMALIST') || v.includes('OPTIMAL')) {
      return {
        label: 'Optimal Cognitive Load (Minimal Friction)',
        style: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
      };
    }
    if (v.includes('BALANCED')) {
      return {
        label: 'Balanced Cognitive Load',
        style: 'bg-teal-950/80 text-teal-300 border-teal-500/50',
      };
    }
    return {
      label: 'High Cognitive Load (Visual Overstimulation)',
      style: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
    };
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('OPTIMAL')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
    if (s.includes('MODERATE')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    if (s.includes('OVERSTIMULATING')) {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-teal-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-teal-400';
    if (score >= 60) return 'bg-gradient-to-r from-teal-500 to-cyan-400';
    if (score >= 40) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
    return 'bg-gradient-to-r from-rose-500 to-red-500';
  };

  const loadBadge = getLoadBadge(data.cognitiveLoadVerdict);

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-purple-500/30 p-6 sm:p-8 space-y-7 shadow-2xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/25 via-pink-500/20 to-cyan-500/25 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Viewer Psychology & Attention Assessment</span>
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Design Heuristics
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Estimated focal emphasis, Gestalt composition, and viewer interest heuristics (heuristic model, not measured eye-tracking)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${loadBadge.style}`}>
            {loadBadge.label}
          </span>
        </div>
      </div>

      {/* Executive Summary */}
      {data.executiveSummary && (
        <div className="bg-gradient-to-r from-purple-950/40 via-slate-950 to-cyan-950/40 p-4 sm:p-5 rounded-xl border border-purple-500/20 space-y-2 relative z-10">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Viewer Psychology & Attention Summary</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
            {data.executiveSummary}
          </p>
        </div>
      )}

      {/* Top 2 Score Cards + Immediate Glance Impression */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {/* Score 1: Visual Attention Heuristic */}
        <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-3 relative group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-purple-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              Visual Attention Heuristic
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Focal Saliency</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold ${getScoreColor(data.visualAttentionHeuristicScore ?? data.primitiveBrainScore)}`}>
              {data.visualAttentionHeuristicScore ?? data.primitiveBrainScore}
            </span>
            <span className="text-xs text-slate-500">/100</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(data.visualAttentionHeuristicScore ?? data.primitiveBrainScore)}`}
              style={{ width: `${Math.max(5, Math.min(100, data.visualAttentionHeuristicScore ?? data.primitiveBrainScore))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Estimated visual prominence, contrast distinctiveness, and facial salience in feed environments.
          </p>
        </div>

        {/* Score 2: Composition & Clarity Heuristic */}
        <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-3 relative group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              Composition & Clarity
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Visual Hierarchy</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold ${getScoreColor(data.compositionClarityScore ?? data.perceptionManagementScore)}`}>
              {data.compositionClarityScore ?? data.perceptionManagementScore}
            </span>
            <span className="text-xs text-slate-500">/100</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(data.compositionClarityScore ?? data.perceptionManagementScore)}`}
              style={{ width: `${Math.max(5, Math.min(100, data.compositionClarityScore ?? data.perceptionManagementScore))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Balance of focal separation, Gestalt figure-ground clarity, and uncluttered composition.
          </p>
        </div>

        {/* Card 3: Immediate Glance Impression */}
        <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-2.5 relative group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-400" />
              Immediate Visual Impression
            </span>
            <span className="text-[10px] text-amber-400/90 font-mono">Glance Test</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            "{data.immediateGlanceImpression || data.first50msGistComprehension}"
          </p>
          <p className="text-[10px] text-slate-500">
            Estimated primary elements extracted during a rapid mobile scroll before conscious examination.
          </p>
        </div>
      </div>

      {/* Estimated Visual Flow (Focal Emphasis Order) */}
      {(data.estimatedVisualFlow?.length || data.visualScanpath?.length) ? (
        <div className="bg-slate-950/90 p-5 sm:p-6 rounded-xl border border-slate-800/90 space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-300">
                Estimated Visual Emphasis Hierarchy (Based on Composition)
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Composition Flow</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(data.estimatedVisualFlow || data.visualScanpath).map((step, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 p-3.5 rounded-lg border border-slate-800 flex items-start space-x-3 relative overflow-hidden"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {idx === 0 ? 'Primary Focal Anchor' : idx === 1 ? 'Secondary Narrative Detail' : 'Supporting Context'}
                  </span>
                  <p className="text-xs text-slate-200 font-medium leading-snug">
                    {step.replace(/\s*\(\d+[-–]\d+\s*ms\)/gi, '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Viewer Attention & Psychological Factors */}
      {data.evolutionaryTriggers && data.evolutionaryTriggers.length > 0 && (
        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                Viewer Attention & Psychological Factors
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {data.evolutionaryTriggers.length} Cognitive Factors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.evolutionaryTriggers.map((trg: EvolutionaryTriggerItem, idx: number) => {
              const isExpanded = expandedTrigger === idx;
              return (
                <div
                  key={idx}
                  className="bg-slate-950/80 rounded-xl border border-slate-800 hover:border-purple-500/40 transition-all p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm font-bold text-white">{trg.triggerName}</span>
                      </div>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold border ${getStatusBadge(trg.status)}`}>
                        {trg.status}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end space-x-1">
                        <span className={`text-lg font-extrabold ${getScoreColor(trg.score)}`}>
                          {trg.score}
                        </span>
                        <span className="text-[10px] text-slate-500">/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Meter */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getBarColor(trg.score)}`}
                      style={{ width: `${Math.max(5, Math.min(100, trg.score))}%` }}
                    />
                  </div>

                  {/* Specific Thumbnail Analysis */}
                  <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      🔎 Visual Observation:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-normal">
                      {trg.analysis}
                    </p>
                  </div>

                  {/* Psychological Context */}
                  {(trg.psychologicalContext || trg.evolutionaryMechanism) && (
                    <div className="pt-1">
                      <button
                        onClick={() => setExpandedTrigger(isExpanded ? null : idx)}
                        className="text-[11px] text-purple-300 hover:text-purple-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Cpu className="w-3 h-3 text-purple-400" />
                        <span>{isExpanded ? 'Hide Psychological Context' : 'View Psychological Context'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 bg-purple-950/30 p-3 rounded-lg border border-purple-500/20 text-xs text-purple-200 leading-relaxed animate-in fade-in">
                          <span className="font-semibold text-purple-300 block mb-1">
                            🧠 Cognitive Principle:
                          </span>
                          {trg.psychologicalContext || trg.evolutionaryMechanism}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gestalt Salience & Framing Psychology */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        <div className="bg-slate-950/80 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Gestalt Figure-Ground Separation</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {data.figureGroundSalience}
          </p>
        </div>

        <div className="bg-slate-950/80 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Cognitive Framing & Story Hook</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {data.framingPsychology}
          </p>
        </div>
      </div>

      {/* Actionable Design Suggestions */}
      {((data.prioritizedDesignSuggestions && data.prioritizedDesignSuggestions.length > 0) ||
        (data.actionableNeuroHacks && data.actionableNeuroHacks.length > 0)) && (
        <div className="bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-900 rounded-xl border border-purple-500/30 p-5 sm:p-6 space-y-4 relative z-10 shadow-lg">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              Grounded Attention & Visual Framing Suggestions
            </h3>
          </div>

          <div className="space-y-2.5">
            {(data.prioritizedDesignSuggestions || data.actionableNeuroHacks).map((hack, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-3 bg-slate-900/80 p-3.5 rounded-lg border border-purple-500/20"
              >
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                  {hack}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
