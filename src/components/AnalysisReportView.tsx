import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { CheckCircle2, AlertTriangle, Lightbulb, Eye, Flame, Award, Smartphone, Type as TypeIcon, Sparkles, Wand2, Copy, Check, Brain } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { EvolutionaryPsychologyAudit } from './EvolutionaryPsychologyAudit';

interface AnalysisReportViewProps {
  data: AnalysisResult;
  onOpenSimulator: () => void;
  onGenerateNewConcept: () => void;
}

export const AnalysisReportView: React.FC<AnalysisReportViewProps> = ({
  data,
  onOpenSimulator,
  onGenerateNewConcept,
}) => {
  const { t } = useLanguage();
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const generateDetailedPrompt = (data: AnalysisResult): string => {
    if (data.aiImagePrompt && data.aiImagePrompt.trim().length > 30) {
      return data.aiImagePrompt;
    }

    const concept = data.abTestDetails?.thumbnailConcept;
    const mainObj = concept?.mainObject || `Expressive focal subject representing ${data.videoTitle || 'the video'}`;
    const bg = concept?.background || `Vibrant contrasting background with strong depth of field`;
    const lighting = concept?.lighting || `Dramatic cinematic lighting with intense contrast and vibrant glows`;
    const colors = concept?.colorPalette || `High-contrast vibrant YouTube thumbnail color palette`;
    const camera = concept?.cameraAngle || `Close-up dynamic angle with clear focal emphasis`;
    const emotion = concept?.targetEmotion || `Curiosity, shock, and high energy`;
    const textHook = concept?.textOverlay || '';

    const weaknessesStr = data.weaknesses && data.weaknesses.length > 0
      ? ` Designed to overcome key thumbnail flaws: ${data.weaknesses.join('; ')}.`
      : '';

    const textOverlayStr = textHook ? ` Clean bold text overlay reading "${textHook}" in high-contrast typography.` : '';

    return `High-CTR 16:9 YouTube thumbnail image for video titled "${data.videoTitle || 'YouTube Video'}". Main Subject: ${mainObj}. Background: ${bg}. Lighting: ${lighting}. Camera Angle: ${camera}. Color Palette: ${colors}. Target Emotion: ${emotion}.${textOverlayStr} Optimized for mobile feed readability, clear visual hierarchy, uncluttered composition, high contrast, vivid saturation, photorealistic 8k quality, professional YouTube thumbnail aesthetics, no watermarks, --ar 16:9.${weaknessesStr}`;
  };

  const promptText = generateDetailedPrompt(data);

  const perceptionData = data.perceptionAnalysis || {
    primitiveBrainScore: Math.round(
      (data.visualImpact ?? data.visualHierarchyScore ?? 65) * 0.45 +
        (data.curiosity ?? data.emotionScore ?? 65) * 0.55
    ),
    perceptionManagementScore: Math.round(
      (data.clarity ?? data.focalPointScore ?? 65) * 0.5 +
        (data.readability ?? data.readabilityScore ?? 65) * 0.5
    ),
    first50msGistComprehension:
      data.summary?.slice(0, 140) ||
      'Subconscious visual cortex immediately extracts primary high-contrast subject and dominant hue.',
    cognitiveLoadVerdict:
      (data.clarity ?? 60) > 70
        ? 'OPTIMAL_MINIMALIST'
        : (data.clarity ?? 60) > 45
        ? 'BALANCED'
        : 'COGNITIVE_OVERLOAD',
    figureGroundSalience:
      'Clear subject-to-background luminance separation prevents visual camouflage in mobile feed.',
    framingPsychology:
      (data.curiosity ?? 60) > 65 ? 'Reward-Seeking & Curiosity Void' : 'Informational / Neutral Framing',
    visualScanpath: [
      'Fixation 1: Primary high-contrast focal subject',
      'Fixation 2: Core emotional facial expression / action element',
      'Fixation 3: Text hook or secondary background context',
    ],
    evolutionaryTriggers: [
      {
        triggerName: 'Threat & Amygdala Alertness',
        score: Math.min(100, Math.max(20, Math.round((data.curiosity ?? 65) * 0.9))),
        status: (data.curiosity ?? 65) > 75 ? 'OPTIMAL' : 'MODERATE',
        analysis: 'Visual tension and contrast stimulate subconscious survival alertness.',
        evolutionaryMechanism:
          'Ancestral humans evolved acute sensitivity to sudden changes in contrast and unexpected high-stakes visual cues.',
      },
      {
        triggerName: 'Gaze Direction & Cooperative Eye Tracking',
        score: Math.min(100, Math.max(30, Math.round((data.visualImpact ?? 65) * 0.85))),
        status: 'MODERATE',
        analysis: 'Facial orientation and eye lines guide viewer ocular trajectory across the frame.',
        evolutionaryMechanism:
          'The human cooperative eye hypothesis: white sclera evolved specifically to broadcast gaze direction and establish joint attention.',
      },
      {
        triggerName: 'Dopamine Prediction Error & Curiosity Void',
        score: Math.min(100, Math.max(25, Math.round((data.curiosity ?? 65) * 0.95))),
        status: (data.curiosity ?? 65) > 70 ? 'OPTIMAL' : 'UNDERUTILIZED',
        analysis: 'The visual creates an incomplete narrative that compels the viewer to click for closure.',
        evolutionaryMechanism:
          'Unresolved visual gaps are treated by the paleomammalian brain as information deficits requiring immediate resolution.',
      },
      {
        triggerName: 'Luminescence & Resource Vitality',
        score: Math.min(100, Math.max(20, Math.round((data.visualImpact ?? 65) * 0.9))),
        status: (data.visualImpact ?? 65) > 70 ? 'OPTIMAL' : 'MODERATE',
        analysis: 'Color vibrancy and saturation levels stimulate biological reward circuits.',
        evolutionaryMechanism:
          'Primates developed trichromatic vision specifically to detect ripe, high-energy food sources and potable water against foliage.',
      },
    ],
    actionableNeuroHacks:
      data.actionableTips && data.actionableTips.length > 0
        ? data.actionableTips.slice(0, 3)
        : [
            'Amplify subject-to-background luminance contrast by at least 25% to trigger immediate saccadic eye movement.',
            'Align the gaze direction of any faces directly toward the primary curiosity object or text hook (joint attention).',
            'Sharpen the curiosity void by showing the high-stakes consequence without revealing the resolution.',
          ],
    executiveSummary:
      'The thumbnail stimulates core ancestral attention mechanisms through contrast and focal subject placement, with opportunities to sharpen gaze tracking and informational void tension.',
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'from-emerald-500 to-teal-400 text-emerald-400 border-emerald-500/30';
    if (grade.startsWith('B')) return 'from-amber-500 to-yellow-400 text-amber-400 border-amber-500/30';
    return 'from-rose-500 to-red-400 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8 text-slate-100">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Main Thumbnail Preview if available */}
          {data.uploadedImage && (
            <div className="w-full md:w-72 aspect-video rounded-xl overflow-hidden border border-slate-700 bg-black shadow-lg shrink-0 relative group">
              <img src={data.uploadedImage} alt="Analyzed thumbnail" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-slate-900/80 text-xs px-2 py-0.5 rounded text-slate-300 font-mono">
                {t.analyzedThumbnail}
              </div>
            </div>
          )}

          {/* Title & CTR Score Display */}
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-rose-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.reportBadge}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              "{data.videoTitle || 'YouTube Video'}"
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
              {data.videoTopic}
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={onOpenSimulator}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>{t.btnSimulator}</span>
              </button>

              <button
                onClick={onGenerateNewConcept}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 rounded-lg text-xs font-semibold text-rose-300 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span>{t.btnAlternative}</span>
              </button>
            </div>
          </div>

          {/* Big Score Badge */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950/80 rounded-2xl border border-slate-800 min-w-[190px]">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">{t.ctrPotential}</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-4xl font-extrabold text-white">{data.overallCtrScore}</span>
              <span className="text-sm text-slate-400">/100</span>
            </div>
            <div className={`mt-2 px-3 py-0.5 text-xs font-extrabold rounded-full border bg-slate-900 ${getGradeColor(data.ctrGrade)}`}>
              {t.gradeLabel}: {data.ctrGrade}
            </div>
            <span className="mt-1.5 text-[10px] text-slate-400 font-mono text-center">
              Heuristic Assessment
            </span>
          </div>
        </div>
      </div>

      {/* Prominent Title–Thumbnail Mismatch / Disconnect Warning (Only for genuine mismatches) */}
      {(((data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 100) < 60) && Boolean(data.alignmentWarning)) && (
        <div className={`rounded-2xl border-2 p-5 sm:p-6 shadow-2xl relative overflow-hidden animate-in fade-in ${
          (data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 100) < 40
            ? 'bg-rose-950/90 border-rose-500/80 shadow-rose-950/40'
            : 'bg-amber-950/85 border-amber-500/80 shadow-amber-950/40'
        }`}>
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-xl border shrink-0 mt-0.5 ${
              (data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 100) < 40
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}>
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${
                  (data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 100) < 40
                    ? 'text-rose-100'
                    : 'text-amber-100'
                }`}>
                  <span>
                    {(data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 100) < 40
                      ? 'Direct Title–Thumbnail Disconnect'
                      : 'Noticeable Semantic Alignment Gap'}
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                    (data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 100) < 40
                      ? 'bg-rose-900/80 text-rose-300 border-rose-700/60'
                      : 'bg-amber-900/80 text-amber-300 border-amber-700/60'
                  }`}>
                    Alignment: {data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 0}/100
                  </span>
                </div>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${
                (data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 100) < 40
                  ? 'text-rose-200'
                  : 'text-amber-200'
              }`}>
                {data.alignmentWarning ||
                  data.alignmentDetails?.alignmentExplanation ||
                  'The thumbnail imagery does not clearly connect with the video title. Align the visual hook with the title premise to maintain viewer trust.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5-Criteria Deterministic Metrics Grid with Transparent Formula */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-300">Deterministic Scoring Breakdown (Weighted Sum = Overall Score)</span>
          <span className="font-mono text-[11px] text-slate-400">
            Formula: 20% Visual + 15% Readability + 20% Curiosity + 15% Clarity + 30% Alignment
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: 'Visual Impact',
              weight: '20%',
              score: data.visualImpact ?? data.visualHierarchyScore ?? 0,
              icon: Award,
              desc: 'Contrast & punch',
            },
            {
              label: 'Readability',
              weight: '15%',
              score: data.readability ?? data.readabilityScore ?? 0,
              icon: TypeIcon,
              desc: 'Text/subject legibility (text-free allowed)',
            },
            {
              label: 'Curiosity',
              weight: '20%',
              score: data.curiosity ?? data.emotionScore ?? 0,
              icon: Flame,
              desc: 'Intrigue & hook',
            },
            {
              label: 'Clarity',
              weight: '15%',
              score: data.clarity ?? data.focalPointScore ?? 0,
              icon: Eye,
              desc: 'Fast comprehension',
            },
            {
              label: 'Title Alignment',
              weight: '30%',
              score: data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 0,
              icon: Sparkles,
              desc: (data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 0) < 40
                ? 'Severe Mismatch'
                : (data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 0) < 60
                ? 'Semantic Gap'
                : 'Complementary Synergy',
              isWarning: (data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 0) < 40,
            },
          ].map((metric, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                metric.isWarning
                  ? 'bg-rose-950/50 border-rose-500/60 shadow-lg shadow-rose-950/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className={`font-semibold ${metric.isWarning ? 'text-rose-300' : 'text-slate-300'}`}>
                  {metric.label}
                </span>
                <metric.icon className={`w-4 h-4 ${metric.isWarning ? 'text-rose-400' : 'text-slate-500'}`} />
              </div>

              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline space-x-1">
                  <span className={`text-2xl font-bold ${metric.isWarning ? 'text-rose-200' : 'text-white'}`}>
                    {metric.score}
                  </span>
                  <span className="text-[10px] text-slate-500">/100</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {metric.weight}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    metric.isWarning || metric.score < 40
                      ? 'bg-rose-500'
                      : metric.score < 60
                      ? 'bg-amber-500'
                      : metric.score >= 80
                      ? 'bg-emerald-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.max(3, Math.min(100, metric.score))}%` }}
                />
              </div>

              <p className={`text-[10px] truncate ${metric.isWarning ? 'text-rose-400 font-medium' : 'text-slate-500'}`}>
                {metric.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Title & Cover Semantic Harmony Audit Card */}
      <div className="bg-slate-900/95 rounded-2xl border border-indigo-500/30 p-6 space-y-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Title & Cover Complementary Harmony Audit</span>
              </h3>
              <p className="text-xs text-slate-400">
                Evaluating title and thumbnail as a complementary storytelling pair (representative moments recognized)
              </p>
            </div>
          </div>

          {/* Verdict Badge */}
          {(() => {
            const alignScore = data.titleThumbnailAlignment ?? data.titleSynergyScore ?? 50;
            const rawVerdict = data.alignmentDetails?.verdict || '';
            const verdict = rawVerdict.toUpperCase();

            let badgeConfig = {
              label: `${alignScore}/100 Synergy`,
              bg: 'bg-slate-800 text-slate-300 border-slate-700',
            };

            if (verdict.includes('PERFECT') || alignScore >= 90) {
              badgeConfig = { label: 'Flawless Synergy (90-100)', bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' };
            } else if (verdict.includes('COMPLEMENTARY') || verdict.includes('REPRESENTATIVE')) {
              badgeConfig = { label: 'Complementary / Representative Moment (75-95)', bg: 'bg-teal-950/90 text-teal-300 border-teal-500/50' };
            } else if (verdict.includes('STRONG') || alignScore >= 75) {
              badgeConfig = { label: 'Strong Congruence (75-89)', bg: 'bg-teal-950/90 text-teal-300 border-teal-500/50' };
            } else if (verdict.includes('MODERATE') || alignScore >= 51) {
              badgeConfig = { label: 'Moderate Alignment (51-74)', bg: 'bg-amber-950/90 text-amber-300 border-amber-500/50' };
            } else if (verdict.includes('WEAK') || verdict.includes('ABSTRACT') || alignScore >= 26) {
              badgeConfig = { label: 'Weak / Abstract Metaphor (26-50)', bg: 'bg-orange-950/90 text-orange-300 border-orange-500/50' };
            } else {
              badgeConfig = { label: 'Direct Contradiction / Unrelated (0-25)', bg: 'bg-rose-950/90 text-rose-300 border-rose-500/50' };
            }

            return (
              <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${badgeConfig.bg}`}>
                {badgeConfig.label}
              </span>
            );
          })()}
        </div>

        {/* 2-Column Comparison: Visual Depiction vs Title Promise */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block">
              🖼️ Visual Content Detected in Thumbnail
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {data.alignmentDetails?.detectedVisualElements ||
                'Key visual subjects, focal elements, text overlays, and background composition identified in the uploaded thumbnail.'}
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block">
              🎯 Video Title Promise & Core Premise
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {data.alignmentDetails?.titleCorePromise ||
                (data.videoTitle ? `"${data.videoTitle}"` : 'The central subject, value proposition, and topic promised to the audience.')}
            </p>
          </div>
        </div>

        {/* Relationship Classification & Missing Context Notice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.alignmentDetails?.relationshipType && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 block">
                🔗 Storytelling Relationship Type
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {data.alignmentDetails.relationshipType === 'REPRESENTATIVE_MOMENT'
                  ? 'Representative Moment: Illustrates one emotional or key part of the broader story (missing literal elements like full crowd counts is not a mismatch).'
                  : data.alignmentDetails.relationshipType === 'COMPLEMENTARY_PAIR'
                  ? 'Complementary Pair: Title and thumbnail reinforce each other with intrigue without literal redundancy.'
                  : data.alignmentDetails.relationshipType === 'DIRECT_REINFORCEMENT'
                  ? 'Direct Reinforcement: Visual elements directly mirror the main subject promised.'
                  : data.alignmentDetails.relationshipType === 'DIRECT_CONTRADICTION'
                  ? 'Direct Contradiction: Visuals directly conflict with facts stated in the title.'
                  : 'Unrelated / Abstract: Distant thematic connection.'}
              </p>
            </div>
          )}

          {data.alignmentDetails?.missingContextNotice && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-500/20 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                ℹ️ Missing Video Context Acknowledged
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {data.alignmentDetails.missingContextNotice}
              </p>
            </div>
          )}
        </div>

        {/* Logical Consistency Breakdown */}
        {data.alignmentDetails?.logicalConsistency && (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
              🧠 Complementary Logic & Cognitive Continuity
            </span>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {data.alignmentDetails.logicalConsistency}
            </p>
          </div>
        )}

        {/* Detailed Assessment */}
        {data.alignmentDetails?.alignmentExplanation && (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              📋 Semantic Alignment Evaluation
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {data.alignmentDetails.alignmentExplanation}
            </p>
          </div>
        )}

        {/* Actionable Alignment Recommendation */}
        {data.alignmentDetails?.alignmentRecommendation && (
          <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/30 space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block">
              💡 Actionable Harmony Fix
            </span>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              {data.alignmentDetails.alignmentRecommendation}
            </p>
          </div>
        )}
      </div>

      {/* Evolutionary Psychology & Perception Management Audit */}
      <EvolutionaryPsychologyAudit data={perceptionData} videoTitle={data.videoTitle} />

      {/* Summary Paragraph */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-3">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <span>{t.summaryTitle}</span>
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {data.summary}
        </p>
      </div>

      {/* Strengths & Weaknesses side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Güçlü Yanlar */}
        <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/20 p-6 space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2 border-b border-slate-800 pb-3">
            <CheckCircle2 className="w-5 h-5" />
            <span>{t.strengthsTitle}</span>
          </h3>
          <ul className="space-y-3">
            {data.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Zayıf Kısımlar / CTR Riskleri */}
        <div className="bg-slate-900/90 rounded-2xl border border-rose-500/20 p-6 space-y-4">
          <h3 className="text-sm font-bold text-rose-400 flex items-center space-x-2 border-b border-slate-800 pb-3">
            <AlertTriangle className="w-5 h-5" />
            <span>{t.weaknessesTitle}</span>
          </h3>
          <ul className="space-y-3">
            {data.weaknesses.map((weak, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-2" />
                <span>{weak}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detailed Analysis Cards (Color, Text, Face, Mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">{t.cardColor}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{data.colorPsychologyAnalysis}</p>
        </div>

        <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">{t.cardText}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{data.textOverlayFeedback}</p>
        </div>

        <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">{t.cardFace}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{data.faceExpressionFeedback}</p>
        </div>

        <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t.cardMobile}</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">{data.mobileFeedVisibility}</p>
        </div>
      </div>

      {/* Prioritized Design Improvements (Max 3, no invented filler) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <span>{t.fixStepsTitle}</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Observation • Action • Tradeoff
          </span>
        </div>

        {data.prioritizedImprovements && data.prioritizedImprovements.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5">
            {data.prioritizedImprovements.slice(0, 3).map((item, idx) => (
              <div key={idx} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    Action: <span className="text-amber-300 font-semibold">{item.suggestedAction}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">👁️ Observation</span>
                    <p className="text-slate-300 leading-relaxed">{item.observation}</p>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">💡 Rationale</span>
                    <p className="text-slate-300 leading-relaxed">{item.reason}</p>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">⚖️ Tradeoff / Uncertainty</span>
                    <p className="text-slate-300 leading-relaxed">{item.tradeoffOrUncertainty}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {data.actionableTips.map((tip, idx) => (
              <div key={idx} className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* A/B Test Alternative Suggestion (Presented as an Untested Hypothesis) */}
      {data.abTestDetails ? (
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl border border-amber-500/40 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Title */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl font-bold">
                🧪
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                  <span>{t.abTestTitle}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {t.abTestSub}
                </p>
              </div>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-bold tracking-wide">
              {t.highCtrPotentialBadge}
            </span>
          </div>

          {/* Hypothesis Diagnostic Card */}
          {data.abTestDetails.hypothesis && (
            <div className="bg-slate-950/90 p-4 sm:p-5 rounded-xl border border-amber-500/30 space-y-3 relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span>🔬 Hypothesis Framework (Single-Variable Test)</span>
                </span>
                <div className="flex items-center gap-2">
                  {data.abTestDetails.hypothesis.variableTested && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                      Variable: {data.abTestDetails.hypothesis.variableTested}
                    </span>
                  )}
                  {data.abTestDetails.hypothesis.metricToMonitor && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-300 font-mono">
                      Monitor: {data.abTestDetails.hypothesis.metricToMonitor}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-sky-400 block">Specific Change</span>
                  <p className="text-slate-200">{data.abTestDetails.hypothesis.specificChange}</p>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Why It Might Help</span>
                  <p className="text-slate-200">{data.abTestDetails.hypothesis.whyItMightHelp}</p>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-rose-400 block">What It Might Weaken</span>
                  <p className="text-slate-200">{data.abTestDetails.hypothesis.whatItMightWeaken}</p>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">Proposed Comparison</span>
                  <p className="text-slate-200">{data.abTestDetails.hypothesis.testComparison}</p>
                </div>
              </div>
            </div>
          )}

          {/* Alternatif Başlık */}
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-2 relative z-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
              <span>{t.altTitleLabel}</span>
            </h3>
            <p className="text-base sm:text-lg font-extrabold text-white bg-slate-950/80 p-3.5 rounded-lg border border-slate-800/80 tracking-tight">
              "{data.abTestDetails.alternativeTitle}"
            </p>
          </div>

          {/* Alternatif Kapak Konsepti */}
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-4 relative z-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-2">
              <span>{t.altConceptLabel}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/60 space-y-1">
                <span className="text-slate-400 font-semibold block">{t.mainObjectLabel}</span>
                <p className="text-slate-200 font-medium">{data.abTestDetails.thumbnailConcept.mainObject}</p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/60 space-y-1">
                <span className="text-slate-400 font-semibold block">{t.bgLabel}</span>
                <p className="text-slate-200 font-medium">{data.abTestDetails.thumbnailConcept.background}</p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/60 space-y-1">
                <span className="text-slate-400 font-semibold block">{t.colorPaletteLabel}</span>
                <p className="text-slate-200 font-medium">{data.abTestDetails.thumbnailConcept.colorPalette}</p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/60 space-y-1">
                <span className="text-slate-400 font-semibold block">{t.lightingLabel}</span>
                <p className="text-slate-200 font-medium">{data.abTestDetails.thumbnailConcept.lighting}</p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/60 space-y-1">
                <span className="text-slate-400 font-semibold block">{t.textOverlayLabel}</span>
                <p className="text-amber-300 font-bold uppercase tracking-wide">{data.abTestDetails.thumbnailConcept.textOverlay}</p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/60 space-y-1">
                <span className="text-slate-400 font-semibold block">{t.cameraAngleLabel}</span>
                <p className="text-slate-200 font-medium">{data.abTestDetails.thumbnailConcept.cameraAngle}</p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/60 space-y-1">
                <span className="text-slate-400 font-semibold block">{t.focalPointLabel}</span>
                <p className="text-slate-200 font-medium">{data.abTestDetails.thumbnailConcept.focalPoint}</p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/60 space-y-1">
                <span className="text-slate-400 font-semibold block">{t.targetEmotionLabel}</span>
                <p className="text-slate-200 font-medium">{data.abTestDetails.thumbnailConcept.targetEmotion}</p>
              </div>
            </div>
          </div>

          {/* Neden Bu Hipotez? */}
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-3 relative z-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-2">
              <span>{t.whyStrongerTitle}</span>
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/60 space-y-1">
                <span className="text-slate-300 font-bold text-xs uppercase text-sky-300">{t.attentionReasonLabel}</span>
                <p className="text-slate-200 leading-relaxed">{data.abTestDetails.whyItsStronger.attentionReason}</p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/60 space-y-1">
                <span className="text-slate-300 font-bold text-xs uppercase text-sky-300">{t.psychPrinciplesLabel}</span>
                <p className="text-slate-200 leading-relaxed">{data.abTestDetails.whyItsStronger.psychologicalPrinciples}</p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/60 space-y-1">
                <span className="text-slate-300 font-bold text-xs uppercase text-sky-300">{t.firstTwoSecLabel}</span>
                <p className="text-slate-200 leading-relaxed">{data.abTestDetails.whyItsStronger.firstTwoSecondsImpact}</p>
              </div>
            </div>
          </div>

          {/* Beklenen Etki (Heuristic ratings, not guaranteed CTR) */}
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-4 relative z-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
              <span>{t.expectedImpactTitle}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">{t.ctrImpactPotentialLabel}</span>
                <div className="text-amber-400 text-base font-bold">
                  {'★'.repeat(Math.min(5, Math.max(1, data.abTestDetails.expectedImpact.ctrPotentialStars || 4)))}
                  <span className="text-slate-600">
                    {'☆'.repeat(5 - Math.min(5, Math.max(1, data.abTestDetails.expectedImpact.ctrPotentialStars || 4)))}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">{t.curiosityLabel}</span>
                <div className="text-amber-400 text-base font-bold">
                  {'★'.repeat(Math.min(5, Math.max(1, data.abTestDetails.expectedImpact.curiosityStars || 4)))}
                  <span className="text-slate-600">
                    {'☆'.repeat(5 - Math.min(5, Math.max(1, data.abTestDetails.expectedImpact.curiosityStars || 4)))}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">{t.visualAttentionLabel}</span>
                <div className="text-amber-400 text-base font-bold">
                  {'★'.repeat(Math.min(5, Math.max(1, data.abTestDetails.expectedImpact.visualAttentionStars || 4)))}
                  <span className="text-slate-600">
                    {'☆'.repeat(5 - Math.min(5, Math.max(1, data.abTestDetails.expectedImpact.visualAttentionStars || 4)))}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">{t.emotionalImpactLabel}</span>
                <div className="text-amber-400 text-base font-bold">
                  {'★'.repeat(Math.min(5, Math.max(1, data.abTestDetails.expectedImpact.emotionalImpactStars || 4)))}
                  <span className="text-slate-600">
                    {'☆'.repeat(5 - Math.min(5, Math.max(1, data.abTestDetails.expectedImpact.emotionalImpactStars || 4)))}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-center space-y-1 flex flex-col justify-center items-center">
                <span className="text-[11px] text-slate-400 font-semibold block">{t.abPriorityLabel}</span>
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-bold text-xs uppercase">
                  {data.abTestDetails.expectedImpact.abTestPriority || 'Medium'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 rounded-2xl border border-amber-500/30 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center space-x-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>{t.abTestTitle}</span>
            </h3>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
              {t.highCtrPotentialBadge}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">{t.altTitleLabel}</span>
              <p className="text-sm font-bold text-white">"{data.suggestedABTestTitle}"</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">{t.altConceptLabel}</span>
              <p className="text-xs text-slate-300 leading-relaxed">{data.suggestedABTestThumbnailConcept}</p>
            </div>
          </div>
        </div>
      )}

      {/* 🤖 AI IMAGE GENERATION PROMPT SECTION */}
      <div className="bg-slate-900/90 rounded-2xl border border-rose-500/30 p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <span>{t.aiPromptCardTitle}</span>
              </h2>
              <p className="text-xs text-rose-300/90 font-medium">
                {t.aiPromptCardBadge}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCopyPrompt(promptText)}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>{t.copiedText}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t.copyPromptBtn}</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed relative z-10">
          {t.aiPromptCardSub}
        </p>

        <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800/90 font-mono text-xs text-slate-200 leading-relaxed break-words selection:bg-rose-500 selection:text-white relative z-10 shadow-inner">
          {promptText}
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400 relative z-10">
          <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-rose-300 font-bold">--ar 16:9</span>
          <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">High Visual Contrast</span>
          <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">Mobile Feed Optimized</span>
          <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">Photorealistic 8k</span>
          <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">High Contrast</span>
          <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">Clear Focal Point</span>
        </div>
      </div>
    </div>
  );
};

