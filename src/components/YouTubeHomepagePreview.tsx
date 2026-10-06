import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Plus,
  Trash2,
  RotateCcw,
  Image as ImageIcon,
  X,
} from 'lucide-react';

interface YouTubeHomepagePreviewProps {
  thumbnailUrl?: string | null;
  videoTitle?: string;
  channelName?: string;
}

export interface SurroundingVideo {
  id: string;
  title: string;
  channel: string;
  avatarUrl: string;
  thumbnailUrl: string;
  views: string;
  timeAgo: string;
  duration: string;
  verified: boolean;
  category: string;
  isCustom?: boolean;
}

// Exactly the 10 verified YouTube covers uploaded by user
export const USER_EXACT_COVERS: SurroundingVideo[] = [
  {
    id: 'user-cover-1',
    title: '1 to 100 Years Old Fight For $500,000',
    channel: 'MrBeast',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    thumbnailUrl: '/covers/01_MrBeast_Yas_Yarisi.jpg',
    views: '284M views',
    timeAgo: '1 year ago',
    duration: '28:55',
    verified: true,
    category: 'Entertainment & Comedy',
  },
  {
    id: 'user-cover-2',
    title: 'I Caught A Casino Cheater With Smart Glasses',
    channel: 'Airrack',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    thumbnailUrl: '/covers/02_Airrack_Casino.jpg',
    views: '8.1M views',
    timeAgo: '2 years ago',
    duration: '18:42',
    verified: true,
    category: 'Entertainment & Comedy',
  },
  {
    id: 'user-cover-3',
    title: 'Real Life Rocket League Edition 2 | Dude Perfect',
    channel: 'Dude Perfect',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    thumbnailUrl: '/covers/03_DudePerfect_RocketLeague.jpg',
    views: '51M views',
    timeAgo: '3 years ago',
    duration: '10:35',
    verified: true,
    category: 'Entertainment & Comedy',
  },
  {
    id: 'user-cover-4',
    title: 'I Entered the World’s Most Dangerous Cheese Race (And Won?)',
    channel: 'Zac Alsop',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    thumbnailUrl: '/covers/04_ZacAlsop_Peynir_Yarisi.jpg',
    views: '4.8M views',
    timeAgo: '2 years ago',
    duration: '14:20',
    verified: true,
    category: 'Entertainment & Comedy',
  },
  {
    id: 'user-cover-5',
    title: 'I Climbed the World’s Steepest Hill on an Impossible Spiked Bike',
    channel: 'Zac Alsop',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    thumbnailUrl: '/covers/05_ZacAlsop_Tirmanis.jpg',
    views: '2.9M views',
    timeAgo: '1 year ago',
    duration: '17:15',
    verified: true,
    category: 'Entertainment & Comedy',
  },
  {
    id: 'user-cover-6',
    title: 'Sidemen $100,000 vs $100 Basketball Match (Pro vs Noobs)',
    channel: 'Sidemen',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
    thumbnailUrl: '/covers/06_Sidemen_Basketbol.jpg',
    views: '18M views',
    timeAgo: '2 years ago',
    duration: '1:22:40',
    verified: true,
    category: 'Entertainment & Comedy',
  },
  {
    id: 'user-cover-7',
    title: 'Extreme $1,000,000,000 Cruise Ship Hide and Seek (7/20 Found)',
    channel: 'Sidemen',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
    thumbnailUrl: '/covers/07_Sidemen_Gemi_Saklambac.jpg',
    views: '34M views',
    timeAgo: '1 year ago',
    duration: '1:12:15',
    verified: true,
    category: 'Entertainment & Comedy',
  },
  {
    id: 'user-cover-8',
    title: 'I Hired A Hollywood Stunt Double To Live My Life (Fake Bar Fight)',
    channel: 'Max Fosh',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    thumbnailUrl: '/covers/08_MaxFosh_Dublor.jpg',
    views: '6.2M views',
    timeAgo: '1 year ago',
    duration: '12:50',
    verified: true,
    category: 'Entertainment & Comedy',
  },
  {
    id: 'user-cover-9',
    title: 'Survive 100 Days Trapped In A Grocery Store, Win $500,000 (Day 201)',
    channel: 'MrBeast',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    thumbnailUrl: '/covers/09_MrBeast_Market.jpg',
    views: '240M views',
    timeAgo: '4 years ago',
    duration: '14:12',
    verified: true,
    category: 'Entertainment & Comedy',
  },
  {
    id: 'user-cover-10',
    title: 'I Trapped 100 People in a $10,000,000 Luxury Hotel (Call 911!)',
    channel: 'Airrack',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    thumbnailUrl: '/covers/10_Airrack_Otel.jpg',
    views: '9.4M views',
    timeAgo: '1 year ago',
    duration: '22:04',
    verified: true,
    category: 'Entertainment & Comedy',
  },
];

// Official category names matching the dropdown in photo 2
const OFFICIAL_CATEGORIES = [
  'All',
  'Tech & Software',
  'Finance & Business',
  'Gaming & Challenge',
  'Education & Tutorial',
  'Vlog & Lifestyle',
  'Entertainment & Comedy',
  'Science & Documentary',
  'Fitness & Sports',
];

export const YouTubeHomepagePreview: React.FC<YouTubeHomepagePreviewProps> = ({
  thumbnailUrl,
  videoTitle,
  channelName = 'Your Channel',
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeChip, setActiveChip] = useState<string>('All');
  const [userSlotIndex, setUserSlotIndex] = useState<number>(1);
  const [videosList, setVideosList] = useState<SurroundingVideo[]>(() => {
    try {
      const stored = localStorage.getItem('thumbmaster_user_covers_v4');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return USER_EXACT_COVERS;
  });

  // Modal & Edit State
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<string>('Entertainment & Comedy');
  const [customTitleInput, setCustomTitleInput] = useState<string>('');
  const [customChannelInput, setCustomChannelInput] = useState<string>('');
  const [customImageUrlInput, setCustomImageUrlInput] = useState<string>('');
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleReplaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('thumbmaster_user_covers_v4', JSON.stringify(videosList));
    } catch (e) {
      console.warn('Could not save covers to storage', e);
    }
  }, [videosList]);

  const displayTitle = videoTitle && videoTitle.trim() ? videoTitle : 'Your Video Title';
  const effectiveThumbnail =
    thumbnailUrl || '/covers/01_MrBeast_Yas_Yarisi.jpg';

  // Filter videos according to selected category chip
  const filteredVideos =
    activeChip === 'All'
      ? videosList
      : videosList.filter((v) => v.category.toLowerCase() === activeChip.toLowerCase());

  // Show filtered videos, or all if none in category
  const displaySurroundingVideos = filteredVideos.length > 0 ? filteredVideos : videosList;
  const clampedIndex = Math.min(Math.max(0, userSlotIndex), displaySurroundingVideos.length);

  // Handle file uploads
  const handleBatchImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files as FileList).forEach((file: File, index: number) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        if (!base64Data) return;

        const newVideo: SurroundingVideo = {
          id: `custom-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
          title:
            customTitleInput.trim() ||
            file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') ||
            `Kapak #${index + 1}`,
          channel: customChannelInput.trim() || 'Custom Creator',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
          thumbnailUrl: base64Data,
          views: `${Math.floor(Math.random() * 800 + 100)}K views`,
          timeAgo: `${Math.floor(Math.random() * 3 + 1)} weeks ago`,
          duration: `${Math.floor(Math.random() * 15 + 8)}:${Math.floor(Math.random() * 50 + 10)}`,
          verified: true,
          category: selectedUploadCategory,
          isCustom: true,
        };

        setVideosList((prev) => [newVideo, ...prev]);
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
    setCustomTitleInput('');
    setCustomChannelInput('');
  };

  // Replace single card image directly
  const handleSingleCardImageReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replaceTargetId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      if (!base64Data) return;

      setVideosList((prev) =>
        prev.map((item) =>
          item.id === replaceTargetId
            ? { ...item, thumbnailUrl: base64Data, isCustom: true }
            : item
        )
      );
      setReplaceTargetId(null);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  // Add cover from URL
  const handleAddFromUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customImageUrlInput.trim()) return;

    const newVideo: SurroundingVideo = {
      id: `custom-url-${Date.now()}`,
      title: customTitleInput.trim() || 'Özel Video Kapağı',
      channel: customChannelInput.trim() || 'Özel Kanal',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      thumbnailUrl: customImageUrlInput.trim(),
      views: '1.2M views',
      timeAgo: '2 weeks ago',
      duration: '14:20',
      verified: true,
      category: selectedUploadCategory,
      isCustom: true,
    };

    setVideosList((prev) => [newVideo, ...prev]);
    setCustomImageUrlInput('');
    setCustomTitleInput('');
    setCustomChannelInput('');
  };

  const handleResetToDefaults = () => {
    setVideosList(USER_EXACT_COVERS);
    localStorage.removeItem('thumbmaster_user_covers_v4');
  };

  const handleDeleteVideo = (id: string) => {
    setVideosList((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <section className="max-w-6xl mx-auto px-4 space-y-5 text-slate-100">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleBatchImageUpload}
      />
      <input
        ref={singleReplaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSingleCardImageReplace}
      />

      {/* Top Header Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-rose-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerçek YouTube Akış Simülatörü</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Kapağınızı Gerçek YouTube Akışında Test Edin
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Yüklediğiniz 10 adet orijinal YouTube kapağı arasında kendi kapağınızın nasıl öne çıktığını kategorilere göre inceleyin.
            </p>
          </div>

          {/* Action & Control Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Custom Cover Uploader Button */}
            <button
              type="button"
              onClick={() => setIsManageModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md hover:from-rose-500 hover:to-amber-500 transition-all cursor-pointer"
              title="Kapakları yönetin veya yenilerini ekleyin"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Kapakları Yönet ({videosList.length})</span>
            </button>

            {/* Device Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  device === 'desktop' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Masaüstü görünümü"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Masaüstü</span>
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  device === 'mobile' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Mobil görünüm"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobil</span>
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
                title="Koyu Tema"
              >
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Koyu</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  theme === 'light' ? 'bg-slate-200 text-slate-900 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Açık Tema"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Açık</span>
              </button>
            </div>

            {/* Shuffle Slot Position */}
            <button
              type="button"
              onClick={() => setUserSlotIndex((prev) => (prev + 1) % 4)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Kapağınızın sayfadaki sırasını değiştirin"
            >
              <Shuffle className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Sıra: {clampedIndex + 1}</span>
            </button>
          </div>
        </div>
      </div>

      {/* YouTube Sandbox Container */}
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

          {/* Search Bar */}
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
                value="Ara"
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

        {/* Category Filter Chips Bar - Exactly the 8 official categories */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-b overflow-x-auto scrollbar-none flex items-center space-x-2 ${
            theme === 'dark' ? 'border-[#272727] bg-[#0f0f0f]' : 'border-slate-200 bg-white'
          }`}
        >
          {OFFICIAL_CATEGORIES.map((chip) => {
            const isSelected = activeChip === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setActiveChip(chip)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? theme === 'dark'
                      ? 'bg-white text-black shadow'
                      : 'bg-black text-white shadow'
                    : theme === 'dark'
                    ? 'bg-[#272727] text-white hover:bg-[#383838]'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                <span>{chip}</span>
                {chip === 'Entertainment & Comedy' && (
                  <span className={`text-[10px] px-1 rounded font-bold ${isSelected ? 'bg-rose-600 text-white' : 'bg-rose-500/20 text-rose-300'}`}>
                    10
                  </span>
                )}
              </button>
            );
          })}
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
            {/* Render cards with user's video inserted at clampedIndex */}
            {(() => {
              const cards: React.ReactNode[] = [];
              let surroundingIdx = 0;

              for (let i = 0; i <= displaySurroundingVideos.length; i++) {
                if (i === clampedIndex) {
                  // User's Uploaded Video Card
                  cards.push(
                    <div
                      key="user-video-card"
                      className="group flex flex-col space-y-2.5 transition-transform duration-200 hover:-translate-y-1 relative"
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-md border-2 border-rose-500/90 ring-2 ring-rose-500/30">
                        <img
                          src={effectiveThumbnail}
                          alt="Sizin kapak görseliniz"
                          className="w-full h-full object-cover"
                        />

                        {/* YouTube Timestamp Badge */}
                        <div className="absolute bottom-2 right-2 bg-black/85 text-white font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shadow">
                          12:48
                        </div>

                        {/* Active Badge */}
                        <div className="absolute top-2 left-2 flex items-center space-x-1.5 bg-rose-600/95 backdrop-blur-sm text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md ring-1 ring-white/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>Sizin Kapağınız</span>
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
                            14K görüntüleme • 2 saat önce
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (surroundingIdx < displaySurroundingVideos.length) {
                  const video = displaySurroundingVideos[surroundingIdx];
                  surroundingIdx++;

                  cards.push(
                    <div
                      key={video.id}
                      className="group flex flex-col space-y-2.5 transition-transform duration-200 hover:-translate-y-1 relative"
                    >
                      {/* Thumbnail Image Container */}
                      <div className="relative aspect-video rounded-xl overflow-hidden shadow-md bg-slate-900 border border-slate-700/40 select-none">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />

                        {/* Top Category Badge */}
                        <div className="absolute top-2 left-2 flex items-center space-x-1">
                          <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-md bg-black/75 text-slate-200 backdrop-blur-md border border-white/10">
                            {video.category}
                          </span>
                        </div>

                        {/* Quick Replace Cover Button on Card Hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setReplaceTargetId(video.id);
                              singleReplaceInputRef.current?.click();
                            }}
                            className="p-1 rounded bg-black/80 hover:bg-rose-600 text-white text-[10px] backdrop-blur transition-colors"
                            title="Bu görseli değiştirin"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bottom Duration Badge */}
                        <div className="absolute bottom-2 right-2 bg-black/85 text-white font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shadow">
                          {video.duration}
                        </div>
                      </div>

                      {/* Video Details */}
                      <div className="flex space-x-3 pt-1">
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-sm border border-slate-700/50 bg-slate-800">
                          <img
                            src={video.avatarUrl}
                            alt={video.channel}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
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
              <strong>Göz Gezdirme Testi (Glance Test):</strong> Kapağınız, rakiplerin yoğun ve renkli tasarımları arasında ilk 2 saniyede fark ediliyor mu?
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] opacity-75">
            <span>Seçtiğiniz 10 Orijinal YouTube Kapağı</span>
            <span>•</span>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-rose-400 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Orijinal 10 Kapağa Sıfırla</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Manage & Upload Custom Covers */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-lg text-white">Kapakları Yönet & Yeni Kapak Ekle</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
              {/* Upload Form Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
                <h4 className="font-semibold text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Yeni Kapak Görseli Ekle</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Kategori:</label>
                    <select
                      value={selectedUploadCategory}
                      onChange={(e) => setSelectedUploadCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500 text-xs"
                    >
                      {OFFICIAL_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Video Başlığı (İsteğe bağlı):</label>
                    <input
                      type="text"
                      placeholder="Örn: 100 Gün Hayatta Kalma..."
                      value={customTitleInput}
                      onChange={(e) => setCustomTitleInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Kanal İsmi (İsteğe bağlı):</label>
                    <input
                      type="text"
                      placeholder="Örn: MrBeast, Airrack..."
                      value={customChannelInput}
                      onChange={(e) => setCustomChannelInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500 text-xs"
                    />
                  </div>
                </div>

                {/* Upload Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Bilgisayardan Görsel Seç</span>
                  </button>

                  <span className="text-xs text-slate-500">veya URL:</span>

                  <form onSubmit={handleAddFromUrl} className="flex-1 flex min-w-[200px] gap-2">
                    <input
                      type="url"
                      placeholder="https://... görsel linki"
                      value={customImageUrlInput}
                      onChange={(e) => setCustomImageUrlInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200"
                    >
                      Ekle
                    </button>
                  </form>
                </div>
              </div>

              {/* List of Current Covers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">Akıştaki Kapaklar ({videosList.length} Adet)</h4>
                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    className="text-xs text-rose-400 hover:underline flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Sıfırla (10 Kapak)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                  {videosList.map((video) => (
                    <div
                      key={video.id}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center space-x-3 group relative"
                    >
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-16 h-10 object-cover rounded-lg shrink-0 bg-slate-900"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs text-white truncate">{video.title}</p>
                        <p className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <span className="truncate font-semibold text-rose-400">{video.category}</span>
                          <span>•</span>
                          <span className="truncate">{video.channel}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(video.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors opacity-80 group-hover:opacity-100"
                        title="Bu kapağı sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Kapaklar tarayıcınıza kaydedilir ve akışta canlı gösterilir.
              </span>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
