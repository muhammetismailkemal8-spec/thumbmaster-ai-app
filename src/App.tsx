import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ThumbnailForm } from './components/ThumbnailForm';
import { AnalysisReportView } from './components/AnalysisReportView';
import { ConceptGuideView } from './components/ConceptGuideView';
import { YouTubeFeedPreview } from './components/YouTubeFeedPreview';
import { IdeaStrategyView } from './components/IdeaStrategyView';
import { HistoryView } from './components/HistoryView';
import { VideoInput, AnalysisResult, ConceptResult, SavedAudit } from './types';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'app' | 'simulator' | 'strategy' | 'history'>('app');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [currentConcept, setCurrentConcept] = useState<ConceptResult | null>(null);
  const [lastInput, setLastInput] = useState<VideoInput | null>(null);

  const [savedAudits, setSavedAudits] = useState<SavedAudit[]>(() => {
    try {
      const stored = localStorage.getItem('thumbmaster_audits');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const saveToLocalStorage = (audits: SavedAudit[]) => {
      try {
        localStorage.setItem('thumbmaster_audits', JSON.stringify(audits));
      } catch (e) {
        // Quota exceeded (likely due to large base64 image strings). Sanitize images and try again.
        try {
          const sanitized = audits.map((audit) => {
            const clean = { ...audit };
            if (clean.thumbnailUrl && clean.thumbnailUrl.startsWith('data:image/') && clean.thumbnailUrl.length > 30000) {
              clean.thumbnailUrl = undefined;
            }
            if (clean.analysis && clean.analysis.uploadedImage && clean.analysis.uploadedImage.startsWith('data:image/') && clean.analysis.uploadedImage.length > 30000) {
              clean.analysis = { ...clean.analysis, uploadedImage: undefined };
            }
            if (clean.concept && clean.concept.generatedImageUrl && clean.concept.generatedImageUrl.startsWith('data:image/') && clean.concept.generatedImageUrl.length > 30000) {
              clean.concept = { ...clean.concept, generatedImageUrl: undefined };
            }
            return clean;
          });
          localStorage.setItem('thumbmaster_audits', JSON.stringify(sanitized));
        } catch {
          // If still failing, keep only the 5 most recent sanitized audits
          try {
            const minimal = audits.slice(0, 5).map((a) => ({
              ...a,
              thumbnailUrl: undefined,
              analysis: a.analysis ? { ...a.analysis, uploadedImage: undefined } : undefined,
              concept: a.concept ? { ...a.concept, generatedImageUrl: undefined } : undefined,
            }));
            localStorage.setItem('thumbmaster_audits', JSON.stringify(minimal));
          } catch {
            // Ignore if localStorage is completely disabled or full
          }
        }
      }
    };

    saveToLocalStorage(savedAudits.slice(0, 20));
  }, [savedAudits]);

  const postApiJson = async (url: string, payload: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let resData: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        resData = await response.json();
      } catch {
        resData = null;
      }
    } else {
      const text = await response.text();
      console.warn(`Non-JSON response received from ${url}:`, text.slice(0, 150));
    }

    if (!response.ok) {
      const errorMsg =
        resData?.error ||
        `Server returned an error (${response.status}: ${response.statusText || 'Error'}). Please try again.`;
      throw new Error(errorMsg);
    }

    if (!resData || !resData.success) {
      throw new Error(resData?.error || 'Invalid or missing data in server response.');
    }

    return resData;
  };

  const handleFormSubmit = async (input: VideoInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLastInput(input);

    try {
      if (input.hasOwnThumbnail) {
        // Mode A: Analyze existing thumbnail
        const resData = await postApiJson('/api/analyze-thumbnail', {
          videoTitle: input.videoTitle,
          videoTopic: input.videoTopic,
          targetAudience: input.targetAudience,
          category: input.category,
          imageBase64: input.thumbnailImage,
        });

        const analysisData: AnalysisResult = {
          ...resData.data,
          uploadedImage: input.thumbnailImage,
          videoTitle: input.videoTitle,
          videoTopic: input.videoTopic,
        };

        setCurrentAnalysis(analysisData);
        setCurrentConcept(null);

        // Save to audit history
        const newAudit: SavedAudit = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          videoTitle: input.videoTitle,
          videoTopic: input.videoTopic,
          hasImage: true,
          thumbnailUrl: input.thumbnailImage,
          ctrScore: analysisData.overallCtrScore,
          ctrGrade: analysisData.ctrGrade,
          analysis: analysisData,
        };

        setSavedAudits((prev) => [newAudit, ...prev]);
      } else {
        // Mode B: Generate Thumbnail Concept
        const resData = await postApiJson('/api/generate-thumbnail-concept', {
          videoTitle: input.videoTitle,
          videoTopic: input.videoTopic,
          targetAudience: input.targetAudience,
          category: input.category,
          emotionGoal: input.emotionGoal,
          customStyle: input.customStyle,
        });

        const conceptData: ConceptResult = {
          ...resData.data,
          videoTitle: input.videoTitle,
          videoTopic: input.videoTopic,
        };

        setCurrentConcept(conceptData);
        setCurrentAnalysis(null);

        // Save to audit history
        const newAudit: SavedAudit = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          videoTitle: input.videoTitle,
          videoTopic: input.videoTopic,
          hasImage: false,
          concept: conceptData,
        };

        setSavedAudits((prev) => [newAudit, ...prev]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Server error occurred, please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAudit = (audit: SavedAudit) => {
    if (audit.analysis) {
      setCurrentAnalysis(audit.analysis);
      setCurrentConcept(null);
    } else if (audit.concept) {
      setCurrentConcept(audit.concept);
      setCurrentAnalysis(null);
    }
    setActiveTab('app');
  };

  const handleClearHistory = () => {
    if (confirm('All saved history records will be deleted. Are you sure?')) {
      setSavedAudits([]);
    }
  };

  const handleRemoveAudit = (id: string) => {
    setSavedAudits((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} savedCount={savedAudits.length} />

      {/* Main Content View Switcher */}
      <main className="flex-1 pb-16">
        {activeTab === 'app' && (
          <div className="py-8 space-y-10">
            {/* Form Inputs */}
            <ThumbnailForm onSubmit={handleFormSubmit} isLoading={isLoading} />

            {/* Error Message */}
            {errorMessage && (
              <div className="max-w-4xl mx-auto px-4">
                <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-4 flex items-center space-x-3 text-rose-300 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Analysis Result View */}
            {currentAnalysis && (
              <AnalysisReportView
                data={currentAnalysis}
                onOpenSimulator={() => setActiveTab('simulator')}
                onGenerateNewConcept={() => {
                  if (lastInput) {
                    handleFormSubmit({ ...lastInput, hasOwnThumbnail: false });
                  }
                }}
              />
            )}

            {/* Concept Blueprint View */}
            {currentConcept && (
              <ConceptGuideView
                data={currentConcept}
                onOpenSimulator={() => setActiveTab('simulator')}
              />
            )}
          </div>
        )}

        {activeTab === 'simulator' && (
          <YouTubeFeedPreview
            thumbnailUrl={
              currentAnalysis?.uploadedImage || currentConcept?.generatedImageUrl || lastInput?.thumbnailImage
            }
            videoTitle={lastInput?.videoTitle || currentAnalysis?.videoTitle || currentConcept?.videoTitle}
          />
        )}

        {activeTab === 'strategy' && <IdeaStrategyView />}

        {activeTab === 'history' && (
          <HistoryView
            audits={savedAudits}
            onSelectAudit={handleSelectAudit}
            onClearHistory={handleClearHistory}
            onRemoveAudit={handleRemoveAudit}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>{t.footerText}</p>
      </footer>
    </div>
  );
}

