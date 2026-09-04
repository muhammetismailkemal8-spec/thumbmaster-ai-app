import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, X, Wand2, Flame } from 'lucide-react';
import { VideoInput } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ThumbnailFormProps {
  onSubmit: (data: VideoInput) => void;
  isLoading: boolean;
}

export const ThumbnailForm: React.FC<ThumbnailFormProps> = ({ onSubmit, isLoading }) => {
  const { t, language } = useLanguage();

  const DEMO_PRESETS = [
    {
      title: t.presetDemo1Title,
      topic: t.presetDemo1Topic,
      category: t.catFinance,
      audience: 'Entrepreneurs & Developers',
      hasImage: false,
      emotion: t.emotionShock,
    },
    {
      title: t.presetDemo2Title,
      topic: t.presetDemo2Topic,
      category: t.catGaming,
      audience: 'Youth & Gamers',
      hasImage: false,
      emotion: t.emotionEnergy,
    },
    {
      title: t.presetDemo3Title,
      topic: t.presetDemo3Topic,
      category: t.catEducation,
      audience: 'Students & Career Changers',
      hasImage: false,
      emotion: t.emotionTrust,
    },
  ];

  const [videoTitle, setVideoTitle] = useState('');
  const [videoTopic, setVideoTopic] = useState('');
  const [category, setCategory] = useState(t.catTech);
  const [targetAudience, setTargetAudience] = useState('General YouTube Audience');
  const [hasOwnThumbnail, setHasOwnThumbnail] = useState<boolean>(true);
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [emotionGoal, setEmotionGoal] = useState(t.emotionShock);
  const [customStyle, setCustomStyle] = useState('Dramatic Lighting, High Contrast, Minimalist Text');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file format. Please upload a JPEG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(t.alertMax10mb);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const applyPreset = (preset: (typeof DEMO_PRESETS)[0]) => {
    setVideoTitle(preset.title);
    setVideoTopic(preset.topic);
    setCategory(preset.category);
    setTargetAudience(preset.audience);
    setHasOwnThumbnail(preset.hasImage);
    setEmotionGoal(preset.emotion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim() || !videoTopic.trim()) {
      alert(t.alertFillFields);
      return;
    }

    if (hasOwnThumbnail && !thumbnailImage) {
      alert(t.alertUploadImage);
      return;
    }

    onSubmit({
      videoTitle,
      videoTopic,
      category,
      targetAudience,
      hasOwnThumbnail,
      thumbnailImage,
      emotionGoal,
      customStyle,
    });
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl max-w-4xl mx-auto space-y-6">
      {/* Header & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <span>{t.formTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t.formSubtitle}</p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 flex items-center space-x-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.presetsLabel}</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
              >
                {p.category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Video Title */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
              {t.field1Label} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder={t.field1Placeholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              required
            />
          </div>

          {/* Video Topic / Description */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
              {t.field2Label} <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={videoTopic}
              onChange={(e) => setVideoTopic(e.target.value)}
              rows={3}
              placeholder={t.field2Placeholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">{t.categoryLabel}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value={t.catTech}>{t.catTech}</option>
              <option value={t.catFinance}>{t.catFinance}</option>
              <option value={t.catGaming}>{t.catGaming}</option>
              <option value={t.catEducation}>{t.catEducation}</option>
              <option value={t.catVlog}>{t.catVlog}</option>
              <option value={t.catComedy}>{t.catComedy}</option>
              <option value={t.catScience}>{t.catScience}</option>
              <option value={t.catSports}>{t.catSports}</option>
            </select>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">{t.audienceLabel}</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder={t.audiencePlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Thumbnail Choice Mode */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
            {t.modeLabel}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setHasOwnThumbnail(true)}
              className={`flex items-start space-x-3 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                hasOwnThumbnail
                  ? 'bg-rose-950/40 border-rose-500 text-white shadow-lg shadow-rose-950/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  hasOwnThumbnail ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-sm block text-white">{t.modeHasImageTitle}</span>
                <span className="text-xs text-slate-400 block mt-0.5">{t.modeHasImageSub}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setHasOwnThumbnail(false)}
              className={`flex items-start space-x-3 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                !hasOwnThumbnail
                  ? 'bg-rose-950/40 border-rose-500 text-white shadow-lg shadow-rose-950/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  !hasOwnThumbnail ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-sm block text-white">{t.modeNoImageTitle}</span>
                <span className="text-xs text-slate-400 block mt-0.5">{t.modeNoImageSub}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Mode A: Image Upload Area */}
        {hasOwnThumbnail ? (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">{t.uploadLabel}</label>

            {thumbnailImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 max-w-lg mx-auto bg-black aspect-video group">
                <img src={thumbnailImage} alt="Uploaded thumbnail" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setThumbnailImage(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-center text-xs text-emerald-400 font-medium">
                  {t.imageUploaded}
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-950/50 space-y-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-rose-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.dragDrop}</p>
                  <p className="text-xs text-slate-400 mt-1">{t.sizeRec}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Mode B: Creative Direction Inputs */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">{t.emotionLabel}</label>
              <select
                value={emotionGoal}
                onChange={(e) => setEmotionGoal(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value={t.emotionShock}>{t.emotionShock}</option>
                <option value={t.emotionEnergy}>{t.emotionEnergy}</option>
                <option value={t.emotionTrust}>{t.emotionTrust}</option>
                <option value={t.emotionUrgency}>{t.emotionUrgency}</option>
                <option value={t.emotionDrama}>{t.emotionDrama}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">{t.styleLabel}</label>
              <input
                type="text"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                placeholder={t.stylePlaceholder}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center space-x-2 transition-all shadow-lg ${
            isLoading
              ? 'bg-slate-800 cursor-not-allowed text-slate-400'
              : 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 shadow-rose-950/40 cursor-pointer active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t.loadingText}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>{hasOwnThumbnail ? t.submitAnalyze : t.submitGenerate}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

