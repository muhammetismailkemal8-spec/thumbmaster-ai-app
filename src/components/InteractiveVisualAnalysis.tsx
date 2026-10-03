import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import {
  Eye,
  Type as TypeIcon,
  Crosshair,
  Layers,
  Smile,
  Link2,
  AlertOctagon,
  Smartphone,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface InteractiveVisualAnalysisProps {
  data: AnalysisResult;
  imageUrl?: string | null;
}

type CategoryKey =
  | 'attention'
  | 'readability'
  | 'visualFocus'
  | 'clutter'
  | 'emotionalImpact'
  | 'titleMatch'
  | 'contradictions'
  | 'mobileView';

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isAvailable: boolean;
  score?: number;
  badge?: string;
  badgeColor?: string;
}

const getEmotionalToneLabel = (tone: any): string => {
  if (!tone) return 'Emotional Hook';
  if (typeof tone === 'string') return tone;
  if (typeof tone === 'object') {
    if (tone.thumbnailTone) return String(tone.thumbnailTone);
    if (tone.titleTone) return String(tone.titleTone);
  }
  return 'Emotional Hook';
};

const getOcrTextDisplay = (ocr: any): string => {
  if (!ocr) return '';
  if (Array.isArray(ocr)) return ocr.filter(Boolean).join(', ');
  if (typeof ocr === 'string') return ocr;
  return String(ocr);
};

export const InteractiveVisualAnalysis: React.FC<InteractiveVisualAnalysisProps> = ({
  data,
  imageUrl,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>('attention');
  const [isMobileSimulated, setIsMobileSimulated] = useState<boolean>(false);

  const thumbnailSrc = imageUrl || data.uploadedImage || 'https://picsum.photos/seed/analysis/1280/720';

  // Contradictions check
  const hasContradictions = Boolean(
    (data.contradictions && data.contradictions.length > 0) || data.isCapped
  );

  // Readability check
  const hasReadabilityData = Boolean(
    data.readability !== undefined ||
      data.textOverlayFeedback ||
      data.structuredExtraction?.thumbnailTextAmount ||
      data.structuredExtraction?.ocrText
  );

  // Emotional impact check
  const hasEmotionData = Boolean(
    data.structuredExtraction?.emotionalTone ||
      data.faceExpressionFeedback ||
      data.curiosity !== undefined
  );

  // Title match check
  const hasTitleMatchData = Boolean(
    data.alignmentDetails ||
      data.titleThumbnailAlignment !== undefined ||
      data.videoTitle
  );

  // Visual focus check
  const hasVisualFocusData = Boolean(
    data.perceptionAnalysis?.visualScanpath ||
      data.perceptionAnalysis?.estimatedVisualFlow ||
      data.clarity !== undefined
  );

  // Clutter check
  const hasClutterData = Boolean(
    data.perceptionAnalysis?.cognitiveLoadVerdict ||
      data.clarity !== undefined ||
      (data.weaknesses && data.weaknesses.length > 0)
  );

  // Build category list based only on available data
  const rawCategories: CategoryConfig[] = [
    {
      key: 'attention' as CategoryKey,
      label: 'Attention',
      icon: Eye,
      isAvailable: true,
      score: data.visualImpact ?? data.perceptionAnalysis?.visualAttentionHeuristicScore,
      badge: 'Estimated Attention Area',
      badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    },
    {
      key: 'readability' as CategoryKey,
      label: 'Readability',
      icon: TypeIcon,
      isAvailable: hasReadabilityData,
      score: data.readability,
      badge: data.structuredExtraction?.thumbnailTextAmount
        ? `Text: ${data.structuredExtraction.thumbnailTextAmount}`
        : undefined,
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    },
    {
      key: 'visualFocus' as CategoryKey,
      label: 'Visual Focus',
      icon: Crosshair,
      isAvailable: hasVisualFocusData,
      score: data.clarity,
      badge: 'Hierarchy',
      badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
    },
    {
      key: 'clutter' as CategoryKey,
      label: 'Clutter',
      icon: Layers,
      isAvailable: hasClutterData,
      badge: data.perceptionAnalysis?.cognitiveLoadVerdict?.replace('_', ' ') || 'Load',
      badgeColor:
        data.perceptionAnalysis?.cognitiveLoadVerdict === 'COGNITIVE_OVERLOAD'
          ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
          : 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    },
    {
      key: 'emotionalImpact' as CategoryKey,
      label: 'Emotional Impact',
      icon: Smile,
      isAvailable: hasEmotionData,
      score: data.curiosity,
      badge: getEmotionalToneLabel(data.structuredExtraction?.emotionalTone),
      badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    },
    {
      key: 'titleMatch' as CategoryKey,
      label: 'Title Match',
      icon: Link2,
      isAvailable: hasTitleMatchData,
      score: data.titleThumbnailAlignment,
      badge: data.alignmentDetails?.verdict?.replace(/_/g, ' ') || 'Alignment',
      badgeColor:
        data.titleThumbnailAlignment && data.titleThumbnailAlignment < 40
          ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
          : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    },
    // Contradictions category is only included if contradictions actually exist
    ...(hasContradictions
      ? [
          {
            key: 'contradictions' as CategoryKey,
            label: 'Contradictions',
            icon: AlertOctagon,
            isAvailable: true,
            badge: `${data.contradictions?.length || 1} Conflict(s)`,
            badgeColor: 'border-red-500/60 text-red-400 bg-red-500/20 font-bold',
          },
        ]
      : []),
    {
      key: 'mobileView' as CategoryKey,
      label: 'Mobile View',
      icon: Smartphone,
      isAvailable: true,
      badge: 'Feed Scalability',
      badgeColor: 'border-slate-500/40 text-slate-300 bg-slate-500/10',
    },
  ];

  const categories = rawCategories.filter((c) => c.isAvailable);

  const handleCategoryClick = (key: CategoryKey) => {
    setSelectedCategory((prev) => (prev === key ? null : key));
  };

  const handleClear = () => {
    setSelectedCategory(null);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 space-y-6 text-slate-100">
      {/* Section Header */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-rose-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Section 2 • Interactive Visual Diagnostic Layer</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Interactive Visual Analysis
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect your thumbnail with targeted visual diagnostic overlays. Select any category to view its estimated focal regions and design considerations.
            </p>
          </div>

          {/* Quick Clear Action */}
          <div className="flex items-center space-x-2">
            {selectedCategory && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Markers</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Selection Filter Pills */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.key;
            const isRedAlert = cat.key === 'contradictions';

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategoryClick(cat.key)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                  isActive
                    ? isRedAlert
                      ? 'bg-red-600 text-white shadow-red-600/30 shadow-md ring-2 ring-red-400'
                      : 'bg-rose-600 text-white shadow-rose-600/30 shadow-md ring-2 ring-rose-400'
                    : isRedAlert
                    ? 'bg-red-950/40 text-red-300 border border-red-800/60 hover:bg-red-900/40'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{cat.label}</span>
                {cat.score !== undefined && (
                  <span
                    className={`ml-1 text-[11px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.score}
                  </span>
                )}
                {cat.badge && cat.score === undefined && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${
                      isActive ? 'bg-white/20 text-white' : cat.badgeColor || 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage: Thumbnail Canvas & Side Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scalable Thumbnail with Overlay System */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
          {/* Active Category Status Banner */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Current Overlay:</span>
              {selectedCategory ? (
                <span className="font-bold text-white capitalize bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {selectedCategory === 'visualFocus'
                    ? 'Visual Focus'
                    : selectedCategory === 'titleMatch'
                    ? 'Title Match'
                    : selectedCategory === 'mobileView'
                    ? 'Mobile View'
                    : selectedCategory}
                </span>
              ) : (
                <span className="text-slate-500 italic">None (Clean Image View)</span>
              )}
            </div>

            {selectedCategory === 'mobileView' && (
              <button
                type="button"
                onClick={() => setIsMobileSimulated((prev) => !prev)}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-medium underline"
              >
                {isMobileSimulated ? 'Show standard size' : 'Simulate 140px phone size'}
              </button>
            )}
          </div>

          {/* Scalable 16:9 Thumbnail Sandbox */}
          <div className="flex justify-center items-center">
            <div
              className={`relative aspect-video rounded-xl overflow-hidden bg-black shadow-inner transition-all duration-300 ${
                isMobileSimulated && selectedCategory === 'mobileView'
                  ? 'w-[200px] border-2 border-slate-700 shadow-2xl'
                  : 'w-full'
              }`}
            >
              {/* Underlying Clean Image */}
              <img
                src={thumbnailSrc}
                alt="Interactive analyzed thumbnail"
                className="w-full h-full object-cover select-none"
              />

              {/* OVERLAY: ATTENTION */}
              {selectedCategory === 'attention' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                  {/* Soft vignetted edge to direct attention toward center focus */}
                  <div className="absolute inset-0 bg-radial-vignette opacity-40" />

                  {/* Estimated Attention Area Focal Ring */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-amber-400/80 bg-amber-400/10 shadow-[0_0_25px_rgba(251,191,36,0.3)] animate-pulse flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border border-amber-300 bg-amber-400/20" />
                    </div>
                    <div className="mt-2 bg-slate-950/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/60 shadow">
                      Estimated Attention Area
                    </div>
                  </div>

                  {/* Informational Disclaimer Tag */}
                  <div className="absolute bottom-2 left-2 bg-slate-950/85 text-slate-300 text-[10px] px-2 py-1 rounded border border-slate-800">
                    Heuristic attention estimate • Not measured eye tracking
                  </div>
                </div>
              )}

              {/* OVERLAY: READABILITY */}
              {selectedCategory === 'readability' && (
                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                  {/* Text Region Indicator Box (lower or upper band) */}
                  <div className="border-2 border-emerald-400/80 bg-emerald-500/10 rounded-lg p-2.5 backdrop-blur-[1px] max-w-sm shadow-lg">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 mb-1">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Text Readability Zone
                      </span>
                      <span className="font-mono text-[10px] bg-slate-950/80 px-1.5 py-0.5 rounded">
                        Score: {data.readability ?? 70}/100
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-200 line-clamp-2">
                      {data.structuredExtraction?.ocrText && getOcrTextDisplay(data.structuredExtraction.ocrText)
                        ? `Detected OCR: "${getOcrTextDisplay(data.structuredExtraction.ocrText)}"`
                        : 'Typography analyzed for glance clarity and contrast.'}
                    </p>
                  </div>

                  {/* Bottom-right safe zone warning */}
                  <div className="self-end bg-slate-950/90 border border-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded flex items-center space-x-1">
                    <Info className="w-3 h-3 text-sky-400" />
                    <span>Safe from YouTube timestamp corner</span>
                  </div>
                </div>
              )}

              {/* OVERLAY: VISUAL FOCUS & SCANPATH */}
              {selectedCategory === 'visualFocus' && (
                <div className="absolute inset-0 pointer-events-none p-4">
                  {/* Numbered hierarchy markers */}
                  <div className="absolute top-[25%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg ring-2 ring-white">
                      1
                    </div>
                    <span className="bg-slate-950/90 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/50 shadow">
                      Primary Subject
                    </span>
                  </div>

                  <div className="absolute top-[55%] left-[65%] -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg ring-2 ring-white">
                      2
                    </div>
                    <span className="bg-slate-950/90 text-cyan-200 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-400/50 shadow">
                      Expression / Action
                    </span>
                  </div>

                  <div className="absolute bottom-[20%] left-[40%] -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-cyan-300 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-lg ring-2 ring-white">
                      3
                    </div>
                    <span className="bg-slate-950/90 text-cyan-100 text-[10px] font-medium px-2 py-0.5 rounded border border-cyan-300/40 shadow">
                      Context / Text
                    </span>
                  </div>
                </div>
              )}

              {/* OVERLAY: CLUTTER & COGNITIVE LOAD */}
              {selectedCategory === 'clutter' && (
                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md border shadow-md flex items-center space-x-1.5 ${
                        data.perceptionAnalysis?.cognitiveLoadVerdict === 'COGNITIVE_OVERLOAD'
                          ? 'bg-rose-950/90 text-rose-300 border-rose-500'
                          : 'bg-emerald-950/90 text-emerald-300 border-emerald-500'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>
                        Cognitive Load: {data.perceptionAnalysis?.cognitiveLoadVerdict || 'OPTIMAL'}
                      </span>
                    </div>

                    <div className="bg-slate-950/90 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                      Clarity Score: {data.clarity ?? 75}/100
                    </div>
                  </div>

                  {/* Peripheral noise boundary indicator */}
                  <div className="border border-dashed border-amber-400/40 rounded-xl m-2 p-2 bg-amber-500/5">
                    <span className="text-[10px] text-amber-300 font-medium bg-slate-950/90 px-1.5 py-0.5 rounded border border-amber-400/30">
                      Clean focal boundaries prevent visual distraction
                    </span>
                  </div>
                </div>
              )}

              {/* OVERLAY: EMOTIONAL IMPACT */}
              {selectedCategory === 'emotionalImpact' && (
                <div className="absolute inset-0 pointer-events-none p-4 flex items-center justify-center">
                  <div className="border-2 border-purple-400/80 bg-purple-500/10 rounded-xl p-3 shadow-xl max-w-xs text-center backdrop-blur-[1px]">
                    <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-300 mb-1">
                      <Smile className="w-4 h-4 text-purple-400" />
                      <span>
                        Emotional Tone: {getEmotionalToneLabel(data.structuredExtraction?.emotionalTone)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-200">
                      {data.faceExpressionFeedback || 'Facial cues stimulate viewer curiosity and emotional mirror neurons.'}
                    </p>
                  </div>
                </div>
              )}

              {/* OVERLAY: TITLE MATCH */}
              {selectedCategory === 'titleMatch' && (
                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                  <div
                    className={`inline-flex items-center space-x-1.5 self-start px-2.5 py-1 rounded-md text-[10px] font-bold border shadow ${
                      data.titleThumbnailAlignment && data.titleThumbnailAlignment < 40
                        ? 'bg-rose-950/95 text-rose-300 border-rose-500'
                        : 'bg-emerald-950/95 text-emerald-300 border-emerald-500'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>
                      Title Synergy: {data.titleThumbnailAlignment ?? 85}/100 (
                      {data.alignmentDetails?.verdict?.replace(/_/g, ' ') || 'ALIGNED'})
                    </span>
                  </div>

                  <div className="bg-slate-950/90 border border-slate-700 rounded-lg p-2 max-w-sm shadow">
                    <p className="text-[10px] text-slate-300">
                      <strong>Promise:</strong> {data.alignmentDetails?.titleCorePromise || data.videoTitle || 'Stated title topic'}
                    </p>
                  </div>
                </div>
              )}

              {/* OVERLAY: CONTRADICTIONS */}
              {selectedCategory === 'contradictions' && hasContradictions && (
                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between border-2 border-red-500/80 bg-red-950/20">
                  <div className="flex items-center justify-between">
                    <div className="bg-red-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded shadow flex items-center space-x-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-white" />
                      <span>Direct Conflict Detected</span>
                    </div>

                    {data.isCapped && data.appliedCap !== undefined && (
                      <div className="bg-red-950/90 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500">
                        Score Capped at {data.appliedCap}/100
                      </div>
                    )}
                  </div>

                  {data.contradictions && data.contradictions.length > 0 && (
                    <div className="bg-slate-950/95 border border-red-500/60 rounded-lg p-2.5 max-w-md shadow-xl text-left">
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                        {data.contradictions[0].type.replace(/_/g, ' ')}
                      </div>
                      <p className="text-[11px] text-slate-200">
                        {data.contradictions[0].description}
                      </p>
                      {data.contradictions[0].titleValue && data.contradictions[0].thumbnailValue && (
                        <div className="mt-1.5 text-[10px] grid grid-cols-2 gap-2 text-slate-300 border-t border-slate-800 pt-1">
                          <div>
                            <span className="text-red-400 font-bold">Title:</span> {data.contradictions[0].titleValue}
                          </div>
                          <div>
                            <span className="text-amber-400 font-bold">Thumbnail:</span> {data.contradictions[0].thumbnailValue}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* OVERLAY: MOBILE VIEW */}
              {selectedCategory === 'mobileView' && (
                <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
                  <div className="bg-slate-950/90 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700 self-start">
                    Mobile Viewport Scale
                  </div>

                  {/* YouTube duration badge overlay in bottom-right corner */}
                  <div className="self-end bg-black/90 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ring-1 ring-amber-400/50 flex items-center space-x-1">
                    <span>12:48</span>
                    <span className="text-[9px] text-amber-400 ml-1 font-sans">(Timestamp Zone)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Diagnostic Explanations */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Diagnostic Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            {selectedCategory === 'attention' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-blue-400">
                  <Eye className="w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-white text-sm">Attention & Focal Salience</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {data.perceptionAnalysis?.immediateGlanceImpression ||
                    data.perceptionAnalysis?.figureGroundSalience ||
                    data.summary}
                </p>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Visual Impact Score:</span>
                    <span className="font-bold text-white">{data.visualImpact ?? 75}/100</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Glance Speed:</span>
                    <span className="text-emerald-400 font-medium">Subconscious Rapid Parse</span>
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === 'readability' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <TypeIcon className="w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-white text-sm">Text & Typography Feedback</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {data.textOverlayFeedback || 'Clear text overlay helps communicate the video hook in rapid scrolling.'}
                </p>
                {data.structuredExtraction?.thumbnailTextAmount && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Detected Text Volume:</span>
                      <span className="font-bold text-white">
                        {data.structuredExtraction.thumbnailTextAmount}
                      </span>
                    </div>
                    {data.structuredExtraction.ocrText && getOcrTextDisplay(data.structuredExtraction.ocrText) && (
                      <div className="pt-1 text-slate-400 border-t border-slate-850">
                        <span className="block text-[11px] text-slate-500">OCR Extracted Text:</span>
                        <span className="font-mono text-emerald-300 text-[11px]">
                          "{getOcrTextDisplay(data.structuredExtraction.ocrText)}"
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedCategory === 'visualFocus' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400">
                  <Crosshair className="w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-white text-sm">Visual Hierarchy & Scanpath</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Viewers naturally trace high-contrast focal points before resolving secondary elements.
                </p>
                <div className="space-y-2">
                  {(data.perceptionAnalysis?.visualScanpath || [
                    'Fixation 1: Primary high-contrast focal subject',
                    'Fixation 2: Facial expression or key action item',
                    'Fixation 3: Supporting text or contextual cues',
                  ]).map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300"
                    >
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCategory === 'clutter' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-amber-400">
                  <Layers className="w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-white text-sm">Clutter & Cognitive Load</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Excess visual noise slows down comprehension and decreases click propensity on small mobile feeds.
                </p>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Clarity Metric:</span>
                    <span className="font-bold text-white">{data.clarity ?? 75}/100</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Load Verdict:</span>
                    <span className="font-bold text-amber-300">
                      {data.perceptionAnalysis?.cognitiveLoadVerdict?.replace('_', ' ') || 'OPTIMAL'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === 'emotionalImpact' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-purple-400">
                  <Smile className="w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-white text-sm">Emotional Resonance</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {data.faceExpressionFeedback ||
                    'Emotional tension and curiosity gaps evoke click action by challenging viewer expectations.'}
                </p>
                {data.structuredExtraction?.emotionalTone && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Detected Tone:</span>
                      <span className="font-bold text-purple-300">
                        {getEmotionalToneLabel(data.structuredExtraction.emotionalTone)}
                      </span>
                    </div>
                    {typeof data.structuredExtraction.emotionalTone === 'object' &&
                      data.structuredExtraction.emotionalTone.isOpposite && (
                        <p className="text-[11px] text-rose-400 font-medium pt-1 border-t border-slate-800">
                          ⚠️ Polar opposite emotional tone detected between title and thumbnail
                        </p>
                      )}
                  </div>
                )}
              </div>
            )}

            {selectedCategory === 'titleMatch' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Link2 className="w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-white text-sm">Title-Thumbnail Synergy</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {data.alignmentDetails?.alignmentExplanation ||
                    'Strong synergy occurs when the thumbnail delivers visual evidence for the promise made in the title.'}
                </p>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Synergy Score:</span>
                    <span className="font-bold text-white">
                      {data.titleThumbnailAlignment ?? 85}/100
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Verdict:</span>
                    <span className="font-bold text-emerald-400">
                      {data.alignmentDetails?.verdict?.replace(/_/g, ' ') || 'MATCH'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedCategory === 'contradictions' && hasContradictions && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-red-400">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-white text-sm">Contradiction Analysis</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Direct conflicts between title promises and thumbnail evidence damage viewer trust and trigger hard scoring caps.
                </p>
                {data.contradictions?.map((c, i) => (
                  <div
                    key={i}
                    className="bg-red-950/40 p-3 rounded-xl border border-red-800/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-red-300 font-bold uppercase text-[10px]">
                      <span>{c.type.replace(/_/g, ' ')}</span>
                      <span>{c.severity}</span>
                    </div>
                    <p className="text-slate-200 text-xs">{c.description}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedCategory === 'mobileView' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Smartphone className="w-5 h-5 shrink-0" />
                  <h3 className="font-bold text-white text-sm">Mobile Feed Scaling</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {data.mobileFeedVisibility ||
                    '70%+ of YouTube views occur on mobile devices where thumbnails display at approximately 120-160px width.'}
                </p>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Duration Badge Safe Zone</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Ensure no vital faces or key punchline words are positioned in the bottom-right corner where YouTube places video timestamps.
                  </p>
                </div>
              </div>
            )}

            {!selectedCategory && (
              <div className="text-center py-6 space-y-2 text-slate-400">
                <Info className="w-6 h-6 mx-auto text-slate-500" />
                <p className="text-xs">Click any category pill above to view diagnostic visual markers.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
