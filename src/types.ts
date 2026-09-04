export interface VideoInput {
  videoTitle: string;
  videoTopic: string;
  targetAudience: string;
  category: string;
  hasOwnThumbnail: boolean;
  thumbnailImage: string | null; // Base64
  emotionGoal?: string;
  customStyle?: string;
}

export interface ColorPaletteItem {
  hex: string;
  role: string;
  reason: string;
}

export interface ABTestDetails {
  alternativeTitle: string;
  thumbnailConcept: {
    mainObject: string;
    background: string;
    colorPalette: string;
    lighting: string;
    textOverlay: string;
    cameraAngle: string;
    focalPoint: string;
    targetEmotion: string;
  };
  whyItsStronger: {
    attentionReason: string;
    psychologicalPrinciples: string;
    firstTwoSecondsImpact: string;
  };
  expectedImpact: {
    ctrPotentialStars: number;
    curiosityStars: number;
    visualAttentionStars: number;
    emotionalImpactStars: number;
    abTestPriority: 'High' | 'Medium' | 'Low' | string;
  };
}

export interface AnalysisResult {
  id?: string;
  timestamp?: number;
  overallCtrScore: number;
  ctrGrade: string;
  visualHierarchyScore: number;
  readabilityScore: number;
  emotionScore: number;
  focalPointScore: number;
  titleSynergyScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  actionableTips: string[];
  colorPsychologyAnalysis: string;
  textOverlayFeedback: string;
  faceExpressionFeedback: string;
  mobileFeedVisibility: string;
  suggestedABTestTitle: string;
  suggestedABTestThumbnailConcept: string;
  abTestDetails?: ABTestDetails;
  aiImagePrompt?: string;
  uploadedImage?: string | null;
  videoTitle?: string;
  videoTopic?: string;
}

export interface DetailedConceptBlueprint {
  generalConcept: string;
  mainObject: {
    size: string;
    position: string;
    pose: string;
    facialExpression: string;
    cameraAngle: string;
    keyFeaturesToHighlight: string;
  };
  background: {
    environment: string;
    atmosphere: string;
    colors: string;
    blurLevel: string;
    effects: string;
  };
  lighting: {
    mainLight: string;
    rimLight: string;
    glow: string;
    shadowAndContrast: string;
  };
  textOverlay: {
    text: string;
    fontType: string;
    weight: string;
    color: string;
    stroke: string;
    position: string;
    size: string;
  };
  colorPalette: {
    primaryColors: string[];
    accentColors: string[];
    colorsToAvoid: string[];
  };
  eyeTrackingPath: string[];
  psychologicalPrinciples: {
    principle: string;
    reason: string;
  }[];
  aiImagePromptEnglish: string;
  whyItsStrongerPoints: string[];
  expectedImpact: {
    ctrPotentialStars: number;
    curiosityStars: number;
    visualAttentionStars: number;
    emotionalImpactStars: number;
    abTestPriority: 'High' | 'Medium' | 'Low' | string;
  };
}

export interface ConceptResult {
  id?: string;
  timestamp?: number;
  conceptTitle: string;
  conceptRationale: string;
  textHookOnThumbnail: string;
  mainFocalSubject: string;
  backgroundDescription: string;
  colorPalette: ColorPaletteItem[];
  compositionSteps: string[];
  recommendedFontsAndEffects: string;
  titleVariants: string[];
  imagePromptForAI: string;
  blueprintDetails?: DetailedConceptBlueprint;
  generatedImageUrl?: string | null;
  videoTitle?: string;
  videoTopic?: string;
}

export interface SavedAudit {
  id: string;
  timestamp: number;
  videoTitle: string;
  videoTopic: string;
  hasImage: boolean;
  thumbnailUrl?: string | null;
  ctrScore?: number;
  ctrGrade?: string;
  analysis?: AnalysisResult;
  concept?: ConceptResult;
}
