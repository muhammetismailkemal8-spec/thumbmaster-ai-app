import React, { useState } from 'react';
import { ConceptResult } from '../types';
import {
  Wand2,
  Download,
  Copy,
  Check,
  Eye,
  Layers,
  Palette,
  Type as TypeIcon,
  Sparkles,
  Focus,
  Sun,
  Image as ImageIcon,
  Brain,
  CheckCircle2,
  Zap,
  AlertCircle,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ConceptGuideViewProps {
  data: ConceptResult;
  onOpenSimulator: () => void;
  onRegenerateImage?: (prompt: string) => Promise<string | null>;
}

export const ConceptGuideView: React.FC<ConceptGuideViewProps> = ({
  data,
  onOpenSimulator,
}) => {
  const { t } = useLanguage();
  const [imageUrl] = useState<string | null>(data.generatedImageUrl || null);
  const [showBetaNotice, setShowBetaNotice] = useState<boolean>(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const bp = data.blueprintDetails;

  const handleGenerateImage = () => {
    setShowBetaNotice(true);
  };

  const copyToClipboard = (text: string, type: 'hex' | 'prompt') => {
    navigator.clipboard.writeText(text);
    if (type === 'hex') {
      setCopiedHex(text);
      setTimeout(() => setCopiedHex(null), 2000);
    } else {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const renderStars = (count: number) => {
    const validCount = Math.min(5, Math.max(1, count || 5));
    return (
      <div className="text-amber-400 text-sm font-bold flex items-center space-x-0.5 justify-center">
        {'★'.repeat(validCount)}
        <span className="text-slate-700">{'☆'.repeat(5 - validCount)}</span>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-10 text-slate-100">
      {/* Banner & Preview */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          {/* AI Generated Image or Placeholder */}
          <div className="w-full lg:w-96 space-y-3 shrink-0">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-black shadow-2xl group">
              {imageUrl ? (
                <img src={imageUrl} alt="AI Generated Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950">
                  <Wand2 className="w-10 h-10 text-rose-500 animate-pulse" />
                  <p className="text-xs text-slate-400">
                    {t.noImageYetNotice}
                  </p>
                </div>
              )}

              <div className="absolute top-3 left-3 bg-slate-900/90 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center space-x-1">
                <span>{t.aiThumbnailBadge}</span>
                <span className="bg-rose-500/80 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ml-1">BETA</span>
              </div>
            </div>

            {/* Image Action Buttons */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-rose-600/80 via-rose-500/80 to-amber-500/80 hover:from-rose-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md border border-rose-400/30"
                >
                  <Wand2 className="w-4 h-4 text-rose-200" />
                  <span>{t.btnGenerateImage}</span>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
                    {t.betaBadgeText}
                  </span>
                </button>

                {imageUrl && (
                  <a
                    href={imageUrl}
                    download="youtube_thumbnail_concept.png"
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* BETA Notice Alert */}
              {showBetaNotice && (
                <div className="bg-slate-950/95 border border-amber-500/50 rounded-xl p-3.5 space-y-2.5 text-xs animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{t.featureNotAvailable}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBetaNotice(false)}
                      className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {t.featureNotAvailableSub}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bp?.aiImagePromptEnglish || data.imagePromptForAI, 'prompt')}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">{t.copiedText}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-rose-400" />
                        <span>{t.copyPromptBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Rationale & Text Hook */}
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>🎨 {t.blueprintTitle}</span>
            </div>

            <h1 className="text-2xl font-bold text-white">{data.conceptTitle}</h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {bp?.generalConcept || data.conceptRationale}
            </p>

            {/* Text Overlay Hook Badge */}
            <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                {t.textOverlayHookLabel}
              </span>
              <div className="text-xl font-extrabold text-white tracking-wide font-sans">
                "{bp?.textOverlay.text || data.textHookOnThumbnail}"
              </div>
              <p className="text-[11px] text-slate-400">
                Font: {bp?.textOverlay.fontType || 'Bold Sans-Serif'} • Color: {bp?.textOverlay.color || 'High Contrast Yellow/White'} • Outline: {bp?.textOverlay.stroke || 'Black Stroke'}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenSimulator}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-amber-300 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>{t.btnViewInSimulator}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🎨 AI THUMBNAIL BLUEPRINT MAIN SECTION */}
      <div className="bg-slate-900/90 rounded-2xl border border-rose-500/30 p-6 sm:p-8 space-y-8 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-xl font-bold">
              🎨
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t.blueprintTitle}</h2>
              <p className="text-xs text-slate-400">{t.blueprintSubtitle}</p>
            </div>
          </div>
          <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full font-bold">
            High-CTR Standards
          </span>
        </div>

        {/* 1. Genel Konsept */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>{t.generalConceptLabel}</span>
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {bp?.generalConcept || data.conceptRationale}
          </p>
        </div>

        {/* Grid for Obje, Arka Plan, Işıklandırma, Yazı */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ana Obje */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Focus className="w-4 h-4" />
              <span>{t.mainObjectTitle}</span>
            </h3>
            {bp?.mainObject ? (
              <ul className="space-y-2 text-xs text-slate-300">
                <li><strong className="text-slate-100">• {t.objSize}:</strong> {bp.mainObject.size}</li>
                <li><strong className="text-slate-100">• {t.objPos}:</strong> {bp.mainObject.position}</li>
                <li><strong className="text-slate-100">• {t.objPose}:</strong> {bp.mainObject.pose}</li>
                <li><strong className="text-slate-100">• {t.objExpression}:</strong> {bp.mainObject.facialExpression}</li>
                <li><strong className="text-slate-100">• {t.objAngle}:</strong> {bp.mainObject.cameraAngle}</li>
                <li><strong className="text-slate-100">• {t.objFeatures}:</strong> {bp.mainObject.keyFeaturesToHighlight}</li>
              </ul>
            ) : (
              <p className="text-xs text-slate-300">{data.mainFocalSubject}</p>
            )}
          </div>

          {/* Arka Plan */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
              <ImageIcon className="w-4 h-4" />
              <span>{t.bgTitle}</span>
            </h3>
            {bp?.background ? (
              <ul className="space-y-2 text-xs text-slate-300">
                <li><strong className="text-slate-100">• {t.bgEnv}:</strong> {bp.background.environment}</li>
                <li><strong className="text-slate-100">• {t.bgAtmos}:</strong> {bp.background.atmosphere}</li>
                <li><strong className="text-slate-100">• {t.bgColors}:</strong> {bp.background.colors}</li>
                <li><strong className="text-slate-100">• {t.bgBlur}:</strong> {bp.background.blurLevel}</li>
                <li><strong className="text-slate-100">• {t.bgEffects}:</strong> {bp.background.effects}</li>
              </ul>
            ) : (
              <p className="text-xs text-slate-300">{data.backgroundDescription}</p>
            )}
          </div>

          {/* Işıklandırma */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Sun className="w-4 h-4" />
              <span>{t.lightingTitle}</span>
            </h3>
            {bp?.lighting ? (
              <ul className="space-y-2 text-xs text-slate-300">
                <li><strong className="text-slate-100">• {t.lightMain}:</strong> {bp.lighting.mainLight}</li>
                <li><strong className="text-slate-100">• {t.lightRim}:</strong> {bp.lighting.rimLight}</li>
                <li><strong className="text-slate-100">• {t.lightGlow}:</strong> {bp.lighting.glow}</li>
                <li><strong className="text-slate-100">• {t.lightShadow}:</strong> {bp.lighting.shadowAndContrast}</li>
              </ul>
            ) : (
              <p className="text-xs text-slate-300">Dramatic key lighting, neon rim lighting, and rich shadows.</p>
            )}
          </div>

          {/* Yazı (Max 2-4 Kelime) */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
              <TypeIcon className="w-4 h-4" />
              <span>{t.textOverlayTitle}</span>
            </h3>
            {bp?.textOverlay ? (
              <ul className="space-y-2 text-xs text-slate-300">
                <li><strong className="text-slate-100">• {t.textText}:</strong> <span className="text-amber-300 font-bold">"{bp.textOverlay.text}"</span></li>
                <li><strong className="text-slate-100">• {t.textFont}:</strong> {bp.textOverlay.fontType}</li>
                <li><strong className="text-slate-100">• {t.textWeight}:</strong> {bp.textOverlay.weight}</li>
                <li><strong className="text-slate-100">• {t.textColor}:</strong> {bp.textOverlay.color}</li>
                <li><strong className="text-slate-100">• {t.textStroke}:</strong> {bp.textOverlay.stroke}</li>
                <li><strong className="text-slate-100">• {t.textPosition}:</strong> {bp.textOverlay.position} / {bp.textOverlay.size}</li>
              </ul>
            ) : (
              <p className="text-xs text-slate-300 font-bold text-amber-300">"{data.textHookOnThumbnail}"</p>
            )}
          </div>
        </div>

        {/* Renk Paleti */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Palette className="w-4 h-4" />
            <span>{t.colorPaletteTitle}</span>
          </h3>

          {bp?.colorPalette ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block">• {t.palPrimary}:</span>
                <p className="text-slate-200">{bp.colorPalette.primaryColors?.join(', ') || 'Dark Blue, Black'}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold block">• {t.palAccent}:</span>
                <p className="text-slate-200">{bp.colorPalette.accentColors?.join(', ') || 'Neon Yellow, Red'}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-rose-400 font-bold block">• {t.palAvoid}:</span>
                <p className="text-slate-200">{bp.colorPalette.colorsToAvoid?.join(', ') || 'Matte Gray, Dull Brown'}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.colorPalette.map((col, idx) => (
                <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center space-x-2">
                  <div className="w-6 h-6 rounded border border-white/20" style={{ backgroundColor: col.hex }} />
                  <span className="font-mono text-xs font-bold">{col.hex}</span>
                  <span className="text-[10px] text-slate-400">({col.role})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* İzleyicinin Bakış Rotası (Eye Tracking Path) */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{t.eyeTrackingTitle}</span>
          </h3>
          <p className="text-xs text-slate-400">
            {t.eyeTrackingSub}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(bp?.eyeTrackingPath || [
              '1. Main Object',
              '2. Facial Expression',
              '3. Text Overlay',
              '4. Focal Detail',
            ]).map((stepItem, idx) => (
              <div key={idx} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <span className="text-xs font-medium text-slate-200">{stepItem}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Kullanılan Psikolojik Prensipler */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Brain className="w-4 h-4 text-sky-400" />
            <span>{t.psychPrinciplesTitle}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {(
              bp?.psychologicalPrinciples || [
                { principle: 'Curiosity Gap', reason: 'Tiggers viewer impulse to find out the answer.' },
                { principle: 'Pattern Interrupt', reason: 'Stands out from ordinary feed thumbnails.' },
                { principle: 'High Emotion', reason: 'Expressive facial reaction triggers empathy.' },
                { principle: 'Visual Hierarchy', reason: 'Ensures primary message is understood in 0.5s.' },
              ]
            ).map((item, idx) => (
              <div key={idx} className="bg-slate-900 p-3.5 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-sky-300 font-bold uppercase tracking-wider block">• {item.principle}:</span>
                <p className="text-slate-300 leading-relaxed">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🤖 AI IMAGE PROMPT SECTION */}
      <div className="bg-slate-950 rounded-2xl border border-rose-500/30 p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🤖</span>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              {t.aiPromptTitle}
            </h2>
          </div>
          <button
            onClick={() => copyToClipboard(bp?.aiImagePromptEnglish || data.imagePromptForAI, 'prompt')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-md"
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

        <p className="text-xs text-slate-400">
          {t.aiPromptSub}
        </p>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/90 font-mono text-xs text-slate-200 leading-relaxed break-words selection:bg-rose-500 selection:text-white">
          {bp?.aiImagePromptEnglish || data.imagePromptForAI}
        </div>

        {/* Tag pills */}
        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">--ar 16:9</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">High CTR</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">No Watermark</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">No Text</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">Cinematic Lighting</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">8k Ultra Realistic</span>
        </div>
      </div>

      {/* 📋 NEDEN BU TASARIM DAHA GÜÇLÜ? */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <span className="text-xl">📋</span>
          <span>{t.whyDesignStrongerTitle}</span>
        </h2>

        <div className="space-y-2.5">
          {(
            bp?.whyItsStrongerPoints || [
              'High contrast main object and bright rim lighting makes it instantly recognizable on mobile in 0.5s.',
              'Creates an un-exaggerated Curiosity Gap triggering immediate click motivation.',
              'Uses a clean 2-4 word text hook instead of crowded long text.',
              'Directs eyes seamlessly to the title with strong gaze direction.',
              'Saturated color palette stands out in competitive YouTube home feeds.',
            ]
          ).map((point, idx) => (
            <div key={idx} className="flex items-start space-x-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 📈 BEKLENEN ETKİ */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <span className="text-xl">📈</span>
          <span>{t.expectedImpactTitle}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold block">{t.ctrImpactPotentialLabel}</span>
            {renderStars(bp?.expectedImpact?.ctrPotentialStars || 5)}
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold block">{t.curiosityLabel}</span>
            {renderStars(bp?.expectedImpact?.curiosityStars || 5)}
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold block">{t.visualAttentionLabel}</span>
            {renderStars(bp?.expectedImpact?.visualAttentionStars || 5)}
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold block">{t.emotionalImpactLabel}</span>
            {renderStars(bp?.expectedImpact?.emotionalImpactStars || 4)}
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1 flex flex-col justify-center items-center">
            <span className="text-xs text-slate-400 font-semibold block">{t.abPriorityLabel}</span>
            <span className="mt-1 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-bold text-xs uppercase">
              {bp?.expectedImpact?.abTestPriority || 'High'}
            </span>
          </div>
        </div>
      </div>

      {/* Canva/Photoshop Tutorial Steps */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-amber-400" />
          <span>{t.tutorialTitle}</span>
        </h3>

        <div className="space-y-3">
          {data.compositionSteps.map((step, idx) => (
            <div key={idx} className="flex items-start space-x-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium mt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Titles */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-3">
        <h4 className="text-sm font-bold text-emerald-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
          <Sparkles className="w-4 h-4" />
          <span>{t.altTitlesTitle}</span>
        </h4>
        <ul className="space-y-2">
          {data.titleVariants.map((title, idx) => (
            <li key={idx} className="text-xs sm:text-sm text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 font-medium">
              "{title}"
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};


