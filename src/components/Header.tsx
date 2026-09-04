import React from 'react';
import { Sparkles, Eye, Lightbulb, History, Youtube } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  activeTab: 'app' | 'simulator' | 'strategy' | 'history';
  setActiveTab: (tab: 'app' | 'simulator' | 'strategy' | 'history') => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, savedCount }) => {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('app')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  ThumbMaster
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                  AI v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">{t.brandSubtitle}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2">
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveTab('app')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'app'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-rose-300" />
                <span className="hidden sm:inline">{t.tabAnalysis}</span>
                <span className="sm:hidden">{t.tabAnalysisShort}</span>
              </button>

              <button
                onClick={() => setActiveTab('simulator')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'simulator'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">{t.tabSimulator}</span>
                <span className="sm:hidden">{t.tabSimulatorShort}</span>
              </button>

              <button
                onClick={() => setActiveTab('strategy')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'strategy'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">{t.tabStrategy}</span>
                <span className="md:hidden">{t.tabStrategyShort}</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4 text-sky-400" />
                <span className="hidden lg:inline">{t.tabHistory}</span>
                {savedCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {savedCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

