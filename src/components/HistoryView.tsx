import React from 'react';
import { SavedAudit } from '../types';
import { History, Trash2, ArrowRight, Award } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HistoryViewProps {
  audits: SavedAudit[];
  onSelectAudit: (audit: SavedAudit) => void;
  onClearHistory: () => void;
  onRemoveAudit: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  audits,
  onSelectAudit,
  onClearHistory,
  onRemoveAudit,
}) => {
  const { t } = useLanguage();

  if (audits.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <History className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">{t.noHistoryTitle}</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          {t.noHistorySub}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-sky-400" />
            <span>{t.historyTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.historySub(audits.length)}
          </p>
        </div>

        <button
          onClick={onClearHistory}
          className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t.btnClearAll}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {audits.map((audit) => (
          <div
            key={audit.id}
            className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(audit.timestamp).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <h3 className="text-sm font-bold text-white line-clamp-1 mt-0.5">"{audit.videoTitle}"</h3>
                </div>

                {audit.ctrScore !== undefined && (
                  <div className="flex items-center space-x-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-white">{audit.ctrScore}/100</span>
                  </div>
                )}
              </div>

              {/* Thumbnail preview if exists */}
              {audit.thumbnailUrl && (
                <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black">
                  <img src={audit.thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                </div>
              )}

              <p className="text-xs text-slate-300 line-clamp-2">{audit.videoTopic}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <button
                onClick={() => onRemoveAudit(audit.id)}
                className="text-slate-500 hover:text-rose-400 text-xs flex items-center space-x-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.btnDelete}</span>
              </button>

              <button
                onClick={() => onSelectAudit(audit)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <span>{t.btnOpenReport}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

