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

export interface PrioritizedImprovement {
  observation: string;
  suggestedAction: string;
  reason: string;
  tradeoffOrUncertainty: string;
}

export interface HypothesisAnalysis {
  specificChange: string;
  whyItMightHelp: string;
  whatItMightWeaken: string;
  testComparison: string;
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
  hypothesisAnalysis?: HypothesisAnalysis;
  whyItsStronger?: {
    attentionReason?: string;
    psychologicalPrinciples?: string;
    firstTwoSecondsImpact?: string;
  };
  expectedImpact: {
    variableTested?: string;
    confidenceLevel?: 'Exploratory' | 'Moderate' | 'High' | string;
    primaryMetricToWatch?: string;
    tradeoffOrRisk?: string;
    abTestPriority: 'High' | 'Medium' | 'Low' | string;
    ctrPotentialStars?: number;
    curiosityStars?: number;
    visualAttentionStars?: number;
    emotionalImpactStars?: number;
  };
}

export interface EvolutionaryTriggerItem {
  triggerName: string;
  score: number;
  status: 'OPTIMAL' | 'MODERATE' | 'UNDERUTILIZED' | 'OVERSTIMULATING' | string;
  analysis: string;
  psychologicalContext?: string;
  evolutionaryMechanism?: string;
}

export interface PerceptionManagementDetails {
  // Grounded viewer psychology and attention fields
  visualAttentionHeuristicScore?: number;
  compositionClarityScore?: number;
  immediateGlanceImpression?: string;
  estimatedVisualFlow?: string[];
  prioritizedDesignSuggestions?: string[];

  // Backward compatibility aliases
  primitiveBrainScore: number;
  perceptionManagementScore: number;
  first50msGistComprehension: string;
  cognitiveLoadVerdict: 'OPTIMAL_MINIMALIST' | 'BALANCED' | 'COGNITIVE_OVERLOAD' | string;
  figureGroundSalience: string;
  framingPsychology: string;
  visualScanpath: string[];
  evolutionaryTriggers: EvolutionaryTriggerItem[];
  actionableNeuroHacks: string[];
  executiveSummary: string;
}

export interface SemanticAlignmentDetails {
  verdict:
    | 'PERFECT_MATCH'
    | 'STRONG_MATCH'
    | 'COMPLEMENTARY_PAIR'
    | 'REPRESENTATIVE_MOMENT'
    | 'MODERATE_ALIGNMENT'
    | 'WEAK_OR_ABSTRACT'
    | 'CONTRADICTORY_OR_UNRELATED'
    | string;
  relationshipType?:
    | 'DIRECT_CONTRADICTION'
    | 'UNRELATED'
    | 'REPRESENTATIVE_MOMENT'
    | 'COMPLEMENTARY_PAIR'
    | 'DIRECT_REINFORCEMENT'
    | string;
  detectedVisualElements: string;
  titleCorePromise: string;
  logicalConsistency: string;
  alignmentScore?: number;
  alignmentExplanation: string;
  alignmentRecommendation: string;
  missingContextNotice?: string;
}

export interface AnalysisResult {
  id?: string;
  timestamp?: number;
  overallCtrScore: number;
  overallAssessmentScore?: number;
  ctrGrade: string;
  rawScore?: number;
  isCapped?: boolean;
  appliedCap?: number | null;
  alignmentWarning?: string | null;
  alignmentDetails?: SemanticAlignmentDetails;
  perceptionAnalysis?: PerceptionManagementDetails;
  prioritizedImprovements?: PrioritizedImprovement[];
  scoringFormula?: string;

  // 5 Category Scores
  visualImpact?: number;
  readability?: number;
  curiosity?: number;
  clarity?: number;
  titleThumbnailAlignment?: number;

  // Legacy metric aliases
  visualHierarchyScore?: number;
  readabilityScore?: number;
  emotionScore?: number;
  focalPointScore?: number;
  titleSynergyScore?: number;

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
