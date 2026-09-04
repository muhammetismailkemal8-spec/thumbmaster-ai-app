import React, { useState } from 'react';
import { Smartphone, Monitor, Moon, Sun, Flame, CheckCircle2, Eye, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface YouTubeFeedPreviewProps {
  thumbnailUrl?: string | null;
  videoTitle?: string;
  channelName?: string;
}

export const YouTubeFeedPreview: React.FC<YouTubeFeedPreviewProps> = ({
  thumbnailUrl,
  videoTitle = 'How I Built an AI YouTube Thumbnail Generator',
  channelName = 'Creative Coding Studio',
}) => {
  const { t } = useLanguage();
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [editableTitle, setEditableTitle] = useState<string>(videoTitle);
  const [editableChannel, setEditableChannel] = useState<string>(channelName);
  const [duration, setDuration] = useState<string>('12:48');

  const defaultImage = thumbnailUrl || 'https://picsum.photos/seed/ytthumb/1280/720';

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6 text-slate-100">
      {/* Controls Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Eye className="w-5 h-5 text-amber-400" />
            <span>{t.simulatorTitle}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {t.simulatorSubtitle}
          </p>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Device Toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => setDevice('mobile')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                device === 'mobile' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t.deviceMobile}</span>
            </button>
            <button
              onClick={() => setDevice('desktop')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                device === 'desktop' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{t.deviceDesktop}</span>
            </button>
          </div>

          {/* Theme Toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                theme === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span>{t.themeDark}</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                theme === 'light' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.themeLight}</span>
            </button>
          </div>

          {/* Heatmap Simulation Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showHeatmap
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.heatmapToggle}</span>
          </button>
        </div>
      </div>

      {/* Edit Form for Title / Duration inside preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-medium">{t.simTestTitleLabel}:</label>
          <input
            type="text"
            value={editableTitle}
            onChange={(e) => setEditableTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">{t.simChannelNameLabel}:</label>
          <input
            type="text"
            value={editableChannel}
            onChange={(e) => setEditableChannel(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">{t.simVideoDurationLabel}:</label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* YouTube Feed Container Sandbox */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 transition-colors ${
          theme === 'dark' ? 'bg-[#0f0f0f] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Mock YouTube Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-6 border-slate-700/40">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-5 bg-red-600 rounded-md flex items-center justify-center">
              <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[7px] border-l-white ml-0.5" />
            </div>
            <span className={`font-bold tracking-tight text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              YouTube
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs opacity-70">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Simulation Mode</span>
          </div>
        </div>

        {/* Feed Card Rendering */}
        <div className="flex justify-center">
          <div
            className={`space-y-3 transition-all ${
              device === 'mobile' ? 'w-[360px]' : 'w-full max-w-[420px]'
            }`}
          >
            {/* Thumbnail Box */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg group">
              <img src={defaultImage} alt="Feed thumbnail" className="w-full h-full object-cover" />

              {/* YouTube Duration Badge in bottom-right corner */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shadow">
                {duration}
              </div>

              {/* Eye Heatmap Overlay (simulated) */}
              {showHeatmap && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-red-500/60 via-amber-400/50 to-transparent blur-xl animate-pulse" />
                  <div className="absolute text-center bg-slate-900/90 text-white text-[10px] px-2 py-0.5 rounded border border-amber-400">
                    Primary Focus Zone
                  </div>
                </div>
              )}
            </div>

            {/* Video Details Row */}
            <div className="flex space-x-3 pt-1">
              {/* Channel Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow">
                {editableChannel.charAt(0).toUpperCase()}
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 space-y-1">
                <h3 className={`font-semibold text-sm leading-snug line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {editableTitle}
                </h3>
                <div className={`text-xs flex items-center space-x-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>{editableChannel}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 inline" />
                </div>
                <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  184K views • 3 days ago
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Warning Box */}
        <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            {t.simDurationWarning(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};

