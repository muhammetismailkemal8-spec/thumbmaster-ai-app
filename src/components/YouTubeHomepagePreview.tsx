import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  Moon,
  Sun,
  Search,
  Mic,
  Bell,
  Video,
  CheckCircle2,
  Shuffle,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface YouTubeHomepagePreviewProps {
  thumbnailUrl?: string | null;
  videoTitle?: string;
  channelName?: string;
}

interface SurroundingVideo {
  id: string;
  title: string;
  channel: string;
  avatarColor: string;
  views: string;
  timeAgo: string;
  duration: string;
  verified: boolean;
  bgGradient: string;
  topicTag: string;
  accentText?: string;
}

const STATIC_SURROUNDING_VIDEOS: SurroundingVideo[] = [
  {
    id: 's1',
    title: 'How I Built a $10M Software Company in 1 Year (The Truth)',
    channel: 'Tech Foundry',
    avatarColor: 'from-blue-600 to-indigo-600',
    views: '842K views',
    timeAgo: '3 days ago',
    duration: '18:45',
    verified: true,
    bgGradient: 'from-slate-900 via-indigo-950 to-blue-900',
    topicTag: 'Tech',
    accentText: '$10M JOURNEY',
  },
  {
    id: 's2',
    title: 'Why 99% of Developers Do Not Understand Neural Networks',
    channel: 'Aris AI Lab',
    avatarColor: 'from-purple-600 to-pink-600',
    views: '310K views',
    timeAgo: '1 week ago',
    duration: '12:10',
    verified: true,
    bgGradient: 'from-purple-950 via-slate-900 to-fuchsia-950',
    topicTag: 'AI & Code',
    accentText: 'HOW IT WORKS',
  },
  {
    id: 's3',
    title: 'Surviving 100 Days in Hardcore Minecraft Apocalypse',
    channel: 'CraftMaster',
    avatarColor: 'from-emerald-600 to-teal-600',
    views: '1.9M views',
    timeAgo: '2 weeks ago',
    duration: '34:12',
    verified: true,
    bgGradient: 'from-emerald-950 via-slate-900 to-stone-900',
    topicTag: 'Gaming',
    accentText: 'DAY 100',
  },
  {
    id: 's4',
    title: 'How Apple Actually Designs Hardware (The Secret Process)',
    channel: 'Design Decoded',
    avatarColor: 'from-zinc-600 to-slate-700',
    views: '520K views',
    timeAgo: '5 days ago',
    duration: '15:33',
    verified: true,
    bgGradient: 'from-zinc-900 via-slate-900 to-neutral-900',
    topicTag: 'Design',
    accentText: 'INSIDE APPLE',
  },
  {
    id: 's5',
    title: 'The Truth About Building Real Wealth in Your 20s',
    channel: 'Modern Capital',
    avatarColor: 'from-amber-600 to-yellow-600',
    views: '1.1M views',
    timeAgo: '1 month ago',
    duration: '21:04',
    verified: true,
    bgGradient: 'from-amber-950 via-slate-950 to-orange-950',
    topicTag: 'Finance',
    accentText: 'THE BLUEPRINT',
  },
  {
    id: 's6',
    title: '10 Camera Hacks That Make Your Videos Look High Budget',
    channel: 'Cinematic Frame',
    avatarColor: 'from-red-600 to-rose-600',
    views: '430K views',
    timeAgo: '6 days ago',
    duration: '09:50',
    verified: true,
    bgGradient: 'from-rose-950 via-slate-900 to-red-950',
    topicTag: 'Filmmaking',
    accentText: '10 HACKS',
  },
  {
    id: 's7',
    title: 'The Ultimate Minimalist Desk Setup for Deep Work (2026)',
    channel: 'Studio Minimal',
    avatarColor: 'from-cyan-600 to-blue-700',
    views: '760K views',
    timeAgo: '2 weeks ago',
    duration: '14:18',
    verified: false,
    bgGradient: 'from-slate-900 via-cyan-950 to-slate-950',
    topicTag: 'Productivity',
    accentText: 'DESK TOUR',
  },
];

export const YouTubeHomepagePreview: React.FC<YouTubeHomepagePreviewProps> = ({
  thumbnailUrl,
  videoTitle,
  channelName = 'Your Channel',
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeChip, setActiveChip] = useState<string>('All');
  const [userSlotIndex, setUserSlotIndex] = useState<number>(1); // 0-indexed position in grid (default: position 2)

  const displayTitle = videoTitle && videoTitle.trim() ? videoTitle : 'Your Video Title';
  const effectiveThumbnail = thumbnailUrl || 'https://picsum.photos/seed/thumbmaster/1280/720';

  const filterChips = ['All', 'Technology', 'Gaming', 'Productivity', 'Podcasts', 'Recently uploaded', 'Watched'];

  // Insert user's video at userSlotIndex among surrounding videos
  const combinedVideos = [...STATIC_SURROUNDING_VIDEOS];
  const clampedIndex = Math.min(Math.max(0, userSlotIndex), combinedVideos.length);

  return (
    <section className="max-w-6xl mx-auto px-4 space-y-5 text-slate-100">
      {/* Section Header */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-rose-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Section 1 • Realistic Feed Simulation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              See Your Thumbnail in Context
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Your thumbnail is shown among other videos to simulate how it may appear on the YouTube homepage.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Device Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  device === 'desktop' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop 3-4 column grid"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  device === 'mobile' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile stacked feed"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            {/* Theme Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  theme === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="YouTube Dark Theme"
              >
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  theme === 'light' ? 'bg-slate-200 text-slate-900 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="YouTube Light Theme"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Light</span>
              </button>
            </div>

            {/* Shuffle Position */}
            <button
              type="button"
              onClick={() => setUserSlotIndex((prev) => (prev + 1) % 4)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Change your card position in feed"
            >
              <Shuffle className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Slot {clampedIndex + 1}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Realistic YouTube Sandbox Container */}
      <div
        className={`rounded-2xl border transition-colors shadow-2xl overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#0f0f0f] border-slate-800 text-white'
            : 'bg-[#f9f9f9] border-slate-200 text-slate-900'
        }`}
      >
        {/* Mock YouTube Top Header Bar */}
        <div
          className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-4 ${
            theme === 'dark' ? 'border-[#272727] bg-[#0f0f0f]' : 'border-slate-200 bg-white'
          }`}
        >
          {/* Logo & Hamburger */}
          <div className="flex items-center space-x-4">
            <button type="button" className="text-slate-400 hover:text-white transition-colors" aria-label="Menu">
              <SlidersHorizontal className="w-5 h-5 rotate-90" />
            </button>
            <div className="flex items-center space-x-1 cursor-default select-none">
              <div className="w-7 h-5 bg-red-600 rounded-md flex items-center justify-center shadow-sm">
                <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[7px] border-l-white ml-0.5" />
              </div>
              <span className={`font-black tracking-tighter text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                YouTube
              </span>
            </div>
          </div>

          {/* Search Bar (center) */}
          <div className="hidden md:flex items-center flex-1 max-w-lg mx-6">
            <div
              className={`flex items-center w-full rounded-full border overflow-hidden ${
                theme === 'dark'
                  ? 'border-[#303030] bg-[#121212] focus-within:border-blue-500'
                  : 'border-slate-300 bg-white focus-within:border-blue-500'
              }`}
            >
              <input
                type="text"
                readOnly
                value="Search"
                className={`w-full px-4 py-2 text-xs bg-transparent outline-none cursor-default select-none ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <button
                type="button"
                className={`px-5 py-2 border-l ${
                  theme === 'dark'
                    ? 'border-[#303030] bg-[#222222] text-slate-300 hover:bg-[#2a2a2a]'
                    : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              className={`ml-2 p-2 rounded-full ${
                theme === 'dark' ? 'bg-[#222222] text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              className={`p-1.5 rounded-full ${
                theme === 'dark' ? 'hover:bg-[#272727] text-slate-300' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              type="button"
              className={`p-1.5 rounded-full ${
                theme === 'dark' ? 'hover:bg-[#272727] text-slate-300' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              Y
            </div>
          </div>
        </div>

        {/* Mock Filter Chips Bar */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-b overflow-x-auto scrollbar-none flex items-center space-x-2 ${
            theme === 'dark' ? 'border-[#272727] bg-[#0f0f0f]' : 'border-slate-200 bg-white'
          }`}
        >
          {filterChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setActiveChip(chip)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeChip === chip
                  ? theme === 'dark'
                    ? 'bg-white text-black'
                    : 'bg-black text-white'
                  : theme === 'dark'
                  ? 'bg-[#272727] text-white hover:bg-[#383838]'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Video Cards Grid */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div
            className={`grid gap-x-4 gap-y-7 transition-all ${
              device === 'mobile'
                ? 'grid-cols-1 max-w-sm mx-auto'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {/* Render cards with user's video at clampedIndex */}
            {(() => {
              const cards: React.ReactNode[] = [];
              let surroundingIdx = 0;

              for (let i = 0; i <= combinedVideos.length; i++) {
                if (i === clampedIndex) {
                  // User's Video Card
                  cards.push(
                    <div
                      key="user-video-card"
                      className="group flex flex-col space-y-2.5 transition-transform duration-200 hover:-translate-y-1 relative"
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-md border-2 border-rose-500/80 ring-2 ring-rose-500/20">
                        <img
                          src={effectiveThumbnail}
                          alt="Your uploaded thumbnail"
                          className="w-full h-full object-cover"
                        />

                        {/* YouTube Timestamp Badge */}
                        <div className="absolute bottom-2 right-2 bg-black/85 text-white font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shadow">
                          12:48
                        </div>

                        {/* Non-intrusive "YOUR THUMBNAIL" Badge */}
                        <div className="absolute top-2 left-2 flex items-center space-x-1.5 bg-rose-600/95 backdrop-blur-sm text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md ring-1 ring-white/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>Your Thumbnail</span>
                        </div>
                      </div>

                      {/* Video Details */}
                      <div className="flex space-x-3 pt-1">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm ring-1 ring-rose-400/40">
                          {channelName.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <h3
                            className={`font-semibold text-sm leading-snug line-clamp-2 ${
                              theme === 'dark' ? 'text-white' : 'text-slate-900'
                            }`}
                            title={displayTitle}
                          >
                            {displayTitle}
                          </h3>

                          <div
                            className={`text-xs flex items-center space-x-1 ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            <span className="truncate">{channelName}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 inline shrink-0" />
                          </div>

                          <div
                            className={`text-xs ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            14K views • 2 hours ago
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (surroundingIdx < combinedVideos.length) {
                  const video = combinedVideos[surroundingIdx];
                  surroundingIdx++;

                  cards.push(
                    <div
                      key={video.id}
                      className="group flex flex-col space-y-2.5 transition-transform duration-200 hover:-translate-y-1"
                    >
                      {/* Mock Thumbnail Image Card */}
                      <div
                        className={`relative aspect-video rounded-xl overflow-hidden shadow-md bg-gradient-to-br ${video.bgGradient} flex flex-col justify-between p-3 border border-slate-700/30 select-none`}
                      >
                        {/* Accent visual topic pill */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/60 text-slate-200 backdrop-blur-sm">
                            {video.topicTag}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 bg-black/40 px-1.5 py-0.5 rounded">
                            HD
                          </span>
                        </div>

                        {/* Center bold mock graphic hook */}
                        {video.accentText && (
                          <div className="text-center my-auto">
                            <span className="font-black text-xs sm:text-sm tracking-tight text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-2 py-1 rounded bg-black/30 border border-white/10">
                              {video.accentText}
                            </span>
                          </div>
                        )}

                        {/* Bottom row */}
                        <div className="flex items-center justify-between">
                          <div className="w-2 h-2 rounded-full bg-red-500/80 animate-pulse" />
                          <div className="bg-black/85 text-white font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shadow">
                            {video.duration}
                          </div>
                        </div>
                      </div>

                      {/* Video Details */}
                      <div className="flex space-x-3 pt-1">
                        <div
                          className={`w-9 h-9 rounded-full bg-gradient-to-tr ${video.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}
                        >
                          {video.channel.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <h3
                            className={`font-semibold text-sm leading-snug line-clamp-2 ${
                              theme === 'dark' ? 'text-white' : 'text-slate-900'
                            }`}
                            title={video.title}
                          >
                            {video.title}
                          </h3>

                          <div
                            className={`text-xs flex items-center space-x-1 ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            <span className="truncate">{video.channel}</span>
                            {video.verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 inline shrink-0" />
                            )}
                          </div>

                          <div
                            className={`text-xs ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {video.views} • {video.timeAgo}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              }

              return cards;
            })()}
          </div>
        </div>

        {/* Informational Guidance Footer */}
        <div
          className={`px-6 py-3.5 border-t text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            theme === 'dark'
              ? 'border-[#272727] bg-[#141414] text-slate-400'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>
              <strong>Browsing Glance Test:</strong> Does your thumbnail create immediate visual contrast against competing videos?
            </span>
          </div>
          <span className="text-[11px] opacity-75">
            16:9 Aspect Ratio • Standard YouTube Display Density
          </span>
        </div>
      </div>
    </section>
  );
};
