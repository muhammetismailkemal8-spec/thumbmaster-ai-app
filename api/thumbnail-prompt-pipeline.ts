import { GoogleGenAI, Type } from '@google/genai';
import { cleanAndParseJson, generateContentWithFallback, sanitizeString } from './_lib.js';

// ============================================================================
// PIPELINE DATA CONTRACTS
// ============================================================================

export interface VideoUnderstanding {
  contentType: string;
  corePremise: string;
  viewerPromise: string;
  mainSubject: string;
  centralAction: string;
  stakes: string;
  emotionalArc: string;
  curiosityGap: string;
  strongestVisualMoments: string[];
  importantEntities: string[];
  factsThatMustRemainAccurate: string[];
  informationToWithhold: string[];
  uncertainties: string[];
  evidenceConfidence: 'high' | 'medium' | 'low';
}

export interface OriginalThumbnailSignature {
  identityReferencePresent: boolean;
  recognizableSubjects: string[];
  clothingAndDetails?: string;
  cameraAngle: string;
  shotType: string;
  mainSubjectPose: string;
  mainSubjectPosition: string;
  mainSubjectScale: string;
  backgroundStructure: string;
  environmentPlacement: string[];
  propsAndPositions: string[];
  sceneConcept?: string;
  keyVisualElements?: string[];
  textPlacement: string;
  colorStructure: string;
  visualNarrative: string;
  strengths: string[];
  weaknesses: string[];
}

export interface ThumbnailCandidateConcept {
  conceptSummary: string;
  storyMoment: string;
  curiosityMechanism: string;
  cameraAngle: string;
  shotType: string;
  subjectPose: string;
  subjectPosition: string;
  subjectScale: string;
  backgroundStructure: string;
  keyElements: string[];
  visualHierarchy: string;
  whyItFitsTheVideo: string;
}

export interface SimilarityCheckResult {
  candidateIndex: number;
  matchedDimensionsCount: number;
  matchedDimensions: string[];
  isRejected: boolean;
  reason: string;
}

export interface ThumbnailPipelineInput {
  videoTitle: string;
  videoTopic?: string;
  videoContext?: string;
  targetAudience?: string;
  category?: string;
  parsedImage?: { mimeType: string; data: string } | null;
  diagnosticWeaknesses?: string[];
  diagnosticImprovements?: Array<{
    observation?: string;
    suggestedAction?: string;
    reason?: string;
    tradeoffOrUncertainty?: string;
  }>;
  abTestHypothesis?: {
    specificChange?: string;
    whyItMightHelp?: string;
  };
  diagnosticScores?: {
    visualImpact?: number;
    readability?: number;
    curiosity?: number;
    clarity?: number;
    titleThumbnailAlignment?: number;
  };
}

// ============================================================================
// STAGE 1: INDEPENDENT VIDEO UNDERSTANDING (TEXT-ONLY)
// ============================================================================
export async function runStage1VideoUnderstanding(
  ai: GoogleGenAI,
  input: ThumbnailPipelineInput
): Promise<VideoUnderstanding> {
  const systemInstruction = `You are a professional YouTube narrative strategist and story diagnostic expert.
Your sole task is to deeply analyze the video's subject, stakes, audience expectation, and dramatic premise based ONLY on textual information.

EVIDENCE PRIORITY:
1. User-provided video context, key moments, or transcript (highest authority)
2. Video Title
3. Confirmed factual entities, numbers, and nouns
4. Conservative contextual inference

RULES:
- You must NOT generate thumbnail prompts or describe thumbnail layouts in this stage.
- Do NOT turn the title into a literal checklist of objects.
- Interpret the core premise, what the viewer is promised, the stakes, and the emotional hook.
- Determine what should be shown vs what must deliberately remain unanswered (the curiosity gap).
- Differentiate facts from assumptions. Reason conservatively.`;

  let prompt = `Video Title: "${input.videoTitle.replace(/"/g, '\\"')}"`;
  if (input.videoContext && input.videoContext.trim().length > 0) {
    prompt += `\nUser-Provided Video Context / Transcript / Key Moments: "${input.videoContext.replace(/"/g, '\\"')}"`;
  }
  if (input.videoTopic && input.videoTopic.trim().length > 0) {
    prompt += `\nVideo Topic / Summary: "${input.videoTopic.replace(/"/g, '\\"')}"`;
  }
  if (input.targetAudience) {
    prompt += `\nTarget Audience: "${input.targetAudience.replace(/"/g, '\\"')}"`;
  }
  if (input.category) {
    prompt += `\nCategory: "${input.category.replace(/"/g, '\\"')}"`;
  }

  prompt += `\n\nAnalyze this video's true premise and return the structured Video Understanding JSON.`;

  try {
    const responseText = await generateContentWithFallback(
      ai,
      {
        systemInstruction,
        contents: prompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contentType: { type: Type.STRING, description: 'Category: e.g. survival, challenge, tutorial, comparison, documentary, review, reaction, etc.' },
            corePremise: { type: Type.STRING, description: 'What the video is actually about in 1-2 concise sentences' },
            viewerPromise: { type: Type.STRING, description: 'The core payoff or experience promised to the viewer' },
            mainSubject: { type: Type.STRING, description: 'Primary human subject or central entity' },
            centralAction: { type: Type.STRING, description: 'Central conflict, struggle, test, or transformation' },
            stakes: { type: Type.STRING, description: 'What is at risk or what makes this high-stakes' },
            emotionalArc: { type: Type.STRING, description: 'Tone and emotional feeling (e.g. exhaustion, disbelief, tension, curiosity)' },
            curiosityGap: { type: Type.STRING, description: 'The unanswered question compelling a click without giving away the ending' },
            strongestVisualMoments: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 peak story moments that would make compelling, distinct thumbnail scenarios',
            },
            importantEntities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key people, products, places, or numbers that must remain consistent',
            },
            factsThatMustRemainAccurate: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Facts, numbers, or identities that cannot be distorted or invented',
            },
            informationToWithhold: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Outcomes or resolutions that should deliberately NOT be revealed in the thumbnail',
            },
            uncertainties: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Details not clearly known from the title/context',
            },
            evidenceConfidence: { type: Type.STRING, description: 'high, medium, or low' },
          },
          required: [
            'contentType',
            'corePremise',
            'viewerPromise',
            'mainSubject',
            'centralAction',
            'stakes',
            'emotionalArc',
            'curiosityGap',
            'strongestVisualMoments',
            'importantEntities',
            'factsThatMustRemainAccurate',
            'informationToWithhold',
            'evidenceConfidence',
          ],
        },
      },
      'stage1-video-understanding'
    );

    const parsed = cleanAndParseJson(responseText);
    return {
      contentType: sanitizeString(parsed.contentType, 100) || 'general',
      corePremise: sanitizeString(parsed.corePremise, 300) || input.videoTitle,
      viewerPromise: sanitizeString(parsed.viewerPromise, 300) || input.videoTitle,
      mainSubject: sanitizeString(parsed.mainSubject, 200) || 'Primary creator or subject',
      centralAction: sanitizeString(parsed.centralAction, 300) || 'Central struggle or demonstration',
      stakes: sanitizeString(parsed.stakes, 300) || 'High viewer engagement',
      emotionalArc: sanitizeString(parsed.emotionalArc, 200) || 'Curiosity and intrigue',
      curiosityGap: sanitizeString(parsed.curiosityGap, 300) || 'An intriguing unanswered story question',
      strongestVisualMoments: Array.isArray(parsed.strongestVisualMoments) && parsed.strongestVisualMoments.length > 0
        ? parsed.strongestVisualMoments.slice(0, 4).map((m: any) => sanitizeString(m, 200))
        : ['The climactic turning point', 'Immediate visceral conflict', 'Unexpected discovery'],
      importantEntities: Array.isArray(parsed.importantEntities) ? parsed.importantEntities.map((e: any) => sanitizeString(e, 100)) : [],
      factsThatMustRemainAccurate: Array.isArray(parsed.factsThatMustRemainAccurate) ? parsed.factsThatMustRemainAccurate.map((f: any) => sanitizeString(f, 150)) : [],
      informationToWithhold: Array.isArray(parsed.informationToWithhold) ? parsed.informationToWithhold.map((w: any) => sanitizeString(w, 150)) : ['The final outcome or victory'],
      uncertainties: Array.isArray(parsed.uncertainties) ? parsed.uncertainties.map((u: any) => sanitizeString(u, 150)) : [],
      evidenceConfidence: (parsed.evidenceConfidence === 'high' || parsed.evidenceConfidence === 'medium' || parsed.evidenceConfidence === 'low') ? parsed.evidenceConfidence : 'medium',
    };
  } catch (err: any) {
    console.warn('[stage1-video-understanding] Model call fallback due to error:', err?.message);
    return fallbackStage1Understanding(input);
  }
}

function fallbackStage1Understanding(input: ThumbnailPipelineInput): VideoUnderstanding {
  const title = input.videoTitle || 'YouTube Video';
  const combined = `${title} ${input.videoContext || ''} ${input.videoTopic || ''}`.toLowerCase();

  let contentType = 'general_story';
  if (/(surviv|extreme|stranded|trapped|deadly)/i.test(combined)) contentType = 'survival';
  else if (/\b(vs|versus|compare|comparison|cheapest|expensive)\b/i.test(combined)) contentType = 'comparison';
  else if (/(how to|tutorial|guide|learn)/i.test(combined)) contentType = 'tutorial';
  else if (/(challenge|experiment|24 hours|i tried)/i.test(combined)) contentType = 'challenge';
  else if (/(review|tested|unboxing)/i.test(combined)) contentType = 'product_review';
  else if (/(mystery|secret|truth|exposed)/i.test(combined)) contentType = 'mystery';

  return {
    contentType,
    corePremise: input.videoContext || input.videoTopic || title,
    viewerPromise: `Deliver on the high-stakes premise implied by "${title}"`,
    mainSubject: 'Featured creator or primary subject',
    centralAction: 'Engaging directly with the core premise',
    stakes: 'Overcoming the central challenge or revealing the mystery',
    emotionalArc: 'Tension, curiosity, and high energy',
    curiosityGap: 'What will happen at the critical climax of the premise?',
    strongestVisualMoments: [
      'The moment of highest physical or emotional tension',
      'The surprising revelation or turning point',
      'A dramatic contrast capturing the central struggle',
    ],
    importantEntities: [title],
    factsThatMustRemainAccurate: [title],
    informationToWithhold: ['The final result or solution'],
    uncertainties: [],
    evidenceConfidence: input.videoContext ? 'high' : 'medium',
  };
}

// ============================================================================
// STAGE 2: ORIGINAL THUMBNAIL AUDIT (VISION CALL - DIAGNOSTIC SIGNATURE ONLY)
// ============================================================================
export async function runStage2OriginalThumbnailAudit(
  ai: GoogleGenAI,
  parsedImage: { mimeType: string; data: string },
  videoTitle: string
): Promise<OriginalThumbnailSignature> {
  const systemInstruction = `You are a technical visual composition diagnostic scanner.
Analyze the provided thumbnail image to extract its exact visual signature and layout parameters.
DO NOT generate any new concept, critique, or replacement prompt. Only map what is physically present.`;

  const prompt = `Video Title context: "${videoTitle.replace(/"/g, '\\"')}"
Extract the exact structural composition signature of this uploaded image.`;

  try {
    const responseText = await generateContentWithFallback(
      ai,
      {
        systemInstruction,
        contents: {
          parts: [
            { inlineData: { mimeType: parsedImage.mimeType, data: parsedImage.data } },
            { text: prompt },
          ],
        },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identityReferencePresent: { type: Type.BOOLEAN, description: 'True if a specific creator or real person is visible' },
            recognizableSubjects: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Identities or subject names' },
            clothingAndDetails: { type: Type.STRING, description: 'Clothing colors, type, and physical state (mud, frost, cuts, sweat)' },
            cameraAngle: { type: Type.STRING, description: 'e.g. top-down overhead, eye-level, low angle, high angle, Dutch angle' },
            shotType: { type: Type.STRING, description: 'e.g. extreme close-up, close-up, medium shot, wide shot, full body' },
            mainSubjectPose: { type: Type.STRING, description: 'e.g. lying flat on back, sitting, standing, running, crouching' },
            mainSubjectPosition: { type: Type.STRING, description: 'e.g. dead center, left third, right third, lower third' },
            mainSubjectScale: { type: Type.STRING, description: 'e.g. small (under 25%), medium (25-50%), dominant (over 50%)' },
            backgroundStructure: { type: Type.STRING, description: 'e.g. three-way split, solid background, environmental landscape' },
            environmentPlacement: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Where environments are placed (e.g. snow at top, sand on left)' },
            propsAndPositions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Objects/props and locations (e.g. scorpion on left, snake on right)' },
            sceneConcept: { type: Type.STRING, description: 'The core creative concept and situation depicted in this thumbnail' },
            keyVisualElements: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 to 5 key visual elements that define this thumbnail' },
            textPlacement: { type: Type.STRING, description: 'Location of text or "none"' },
            colorStructure: { type: Type.STRING, description: 'Dominant colors and contrast' },
            visualNarrative: { type: Type.STRING, description: 'Summary of the specific visual situation depicted' },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Identified visual strengths' },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Identified visual weaknesses to solve' },
          },
          required: [
            'identityReferencePresent',
            'recognizableSubjects',
            'cameraAngle',
            'shotType',
            'mainSubjectPose',
            'mainSubjectPosition',
            'mainSubjectScale',
            'backgroundStructure',
            'environmentPlacement',
            'propsAndPositions',
            'visualNarrative',
          ],
        },
      },
      'stage2-thumbnail-audit'
    );

    const parsed = cleanAndParseJson(responseText);
    return {
      identityReferencePresent: Boolean(parsed.identityReferencePresent),
      recognizableSubjects: Array.isArray(parsed.recognizableSubjects) ? parsed.recognizableSubjects.map((s: any) => sanitizeString(s, 100)) : [],
      clothingAndDetails: sanitizeString(parsed.clothingAndDetails, 200) || '',
      cameraAngle: sanitizeString(parsed.cameraAngle, 100) || 'eye-level',
      shotType: sanitizeString(parsed.shotType, 100) || 'medium shot',
      mainSubjectPose: sanitizeString(parsed.mainSubjectPose, 150) || 'standing',
      mainSubjectPosition: sanitizeString(parsed.mainSubjectPosition, 100) || 'center',
      mainSubjectScale: sanitizeString(parsed.mainSubjectScale, 100) || 'medium',
      backgroundStructure: sanitizeString(parsed.backgroundStructure, 150) || 'single environment',
      environmentPlacement: Array.isArray(parsed.environmentPlacement) ? parsed.environmentPlacement.map((e: any) => sanitizeString(e, 100)) : [],
      propsAndPositions: Array.isArray(parsed.propsAndPositions) ? parsed.propsAndPositions.map((p: any) => sanitizeString(p, 100)) : [],
      sceneConcept: sanitizeString(parsed.sceneConcept, 300) || sanitizeString(parsed.visualNarrative, 300) || '',
      keyVisualElements: Array.isArray(parsed.keyVisualElements) ? parsed.keyVisualElements.map((k: any) => sanitizeString(k, 100)) : [],
      textPlacement: sanitizeString(parsed.textPlacement, 100) || 'none',
      colorStructure: sanitizeString(parsed.colorStructure, 150) || 'standard contrast',
      visualNarrative: sanitizeString(parsed.visualNarrative, 300) || 'Subject in scene',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map((s: any) => sanitizeString(s, 150)) : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map((w: any) => sanitizeString(w, 150)) : [],
    };
  } catch (err: any) {
    console.warn('[stage2-thumbnail-audit] Vision audit fallback:', err?.message);
    return {
      identityReferencePresent: true,
      recognizableSubjects: ['Creator'],
      cameraAngle: 'unknown angle',
      shotType: 'medium shot',
      mainSubjectPose: 'neutral',
      mainSubjectPosition: 'center',
      mainSubjectScale: 'medium',
      backgroundStructure: 'composite',
      environmentPlacement: [],
      propsAndPositions: [],
      textPlacement: 'none',
      colorStructure: 'standard',
      visualNarrative: 'Uploaded thumbnail composition',
      strengths: [],
      weaknesses: ['Needs clearer focal hierarchy and higher mobile contrast'],
    };
  }
}

// ============================================================================
// STAGE 3: INDEPENDENT CONCEPT GENERATION (ISOLATED FROM ORIGINAL IMAGE)
// ============================================================================
export async function runStage3IndependentConceptGeneration(
  ai: GoogleGenAI,
  videoUnderstanding: VideoUnderstanding,
  nonCompositionalConstraints: {
    identityReferencePresent: boolean;
    confirmedEntities: string[];
    weaknessesToSolve: string[];
    forbiddenPatterns?: string[];
  }
): Promise<ThumbnailCandidateConcept[]> {
  const systemInstruction = `You are the Creative Director of a premier YouTube thumbnail agency.
Your task is to generate at least THREE (3) radically distinct, high-CTR thumbnail concept candidates based EXCLUSIVELY on the video's dramatic premise.

CRITICAL ISOLATION RULE:
- You DO NOT have access to any previous thumbnail image or layout.
- You must NOT generate generic movie posters or collages.
- Each candidate must explore a DIFFERENT story moment, camera perspective, and curiosity mechanism.
- Every candidate must have ONE unmistakable focal point readable at small mobile size.
- Ensure 1-second comprehension with high silhouette contrast.`;

  let prompt = `VIDEO NARRATIVE BRIEF:
- Content Category: ${videoUnderstanding.contentType}
- Core Premise: ${videoUnderstanding.corePremise}
- Viewer Promise: ${videoUnderstanding.viewerPromise}
- Central Action / Conflict: ${videoUnderstanding.centralAction}
- Stakes: ${videoUnderstanding.stakes}
- Emotional Arc: ${videoUnderstanding.emotionalArc}
- Curiosity Gap: ${videoUnderstanding.curiosityGap}
- Candidate Story Moments: ${videoUnderstanding.strongestVisualMoments.join(' | ')}
- Facts That Must Remain Accurate: ${videoUnderstanding.factsThatMustRemainAccurate.join(', ')}
- Information to Withhold (Do not reveal outcome): ${videoUnderstanding.informationToWithhold.join(', ')}

NON-COMPOSITIONAL CONSTRAINTS:
- Creator Identity: ${nonCompositionalConstraints.identityReferencePresent ? 'The video features a specific creator; the concept must feature the same creator (preserving their identity in the final output).' : 'Feature a prominent relevant subject.'}
- Confirmed Entities: ${nonCompositionalConstraints.confirmedEntities.join(', ') || 'None'}
- Design Goals to Satisfy: ${nonCompositionalConstraints.weaknessesToSolve.join('; ') || 'Ensure high contrast and uncluttered mobile hierarchy'}`;

  if (nonCompositionalConstraints.forbiddenPatterns && nonCompositionalConstraints.forbiddenPatterns.length > 0) {
    prompt += `\n\nCRITICAL FORBIDDEN COMPOSITIONS (REJECTED AS TOO SIMILAR TO PREVIOUS ATTEMPTS):
${nonCompositionalConstraints.forbiddenPatterns.map((p) => `- DO NOT USE: ${p}`).join('\n')}
You MUST explore completely different camera angles, poses, and environmental arrangements!`;
  }

  prompt += `\n\nGenerate exactly 3 diverse thumbnail candidates in JSON format.`;

  try {
    const responseText = await generateContentWithFallback(
      ai,
      {
        systemInstruction,
        contents: prompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  conceptSummary: { type: Type.STRING, description: '1-sentence visual idea summary' },
                  storyMoment: { type: Type.STRING, description: 'Specific moment in the video captured' },
                  curiosityMechanism: { type: Type.STRING, description: 'How it creates an irresistible curiosity gap' },
                  cameraAngle: { type: Type.STRING, description: 'e.g. dynamic low angle, 3/4 medium angle, tight over-shoulder, eye-level' },
                  shotType: { type: Type.STRING, description: 'e.g. medium close-up, tight medium shot, close-up' },
                  subjectPose: { type: Type.STRING, description: 'Specific physical pose and action' },
                  subjectPosition: { type: Type.STRING, description: 'e.g. left-third, right-weighted, center-dynamic' },
                  subjectScale: { type: Type.STRING, description: 'Scale in frame (e.g. 45-55% prominent)' },
                  backgroundStructure: { type: Type.STRING, description: 'Unified depth composition without clutter' },
                  keyElements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2 to 4 key visual elements maximum',
                  },
                  visualHierarchy: { type: Type.STRING, description: 'Clear 1st, 2nd, and 3rd focal order' },
                  whyItFitsTheVideo: { type: Type.STRING, description: 'Why this concept uniquely sells the video' },
                },
                required: [
                  'conceptSummary',
                  'storyMoment',
                  'curiosityMechanism',
                  'cameraAngle',
                  'shotType',
                  'subjectPose',
                  'subjectPosition',
                  'subjectScale',
                  'backgroundStructure',
                  'keyElements',
                  'visualHierarchy',
                  'whyItFitsTheVideo',
                ],
              },
            },
          },
          required: ['candidates'],
        },
      },
      'stage3-concept-generation'
    );

    const parsed = cleanAndParseJson(responseText);
    if (Array.isArray(parsed.candidates) && parsed.candidates.length >= 2) {
      return parsed.candidates.map((c: any) => ({
        conceptSummary: sanitizeString(c.conceptSummary, 250),
        storyMoment: sanitizeString(c.storyMoment, 250),
        curiosityMechanism: sanitizeString(c.curiosityMechanism, 250),
        cameraAngle: sanitizeString(c.cameraAngle, 100),
        shotType: sanitizeString(c.shotType, 100),
        subjectPose: sanitizeString(c.subjectPose, 200),
        subjectPosition: sanitizeString(c.subjectPosition, 100),
        subjectScale: sanitizeString(c.subjectScale, 100),
        backgroundStructure: sanitizeString(c.backgroundStructure, 200),
        keyElements: Array.isArray(c.keyElements) ? c.keyElements.map((k: any) => sanitizeString(k, 100)) : [],
        visualHierarchy: sanitizeString(c.visualHierarchy, 200),
        whyItFitsTheVideo: sanitizeString(c.whyItFitsTheVideo, 250),
      }));
    }
    throw new Error('Insufficient candidates returned from model');
  } catch (err: any) {
    console.warn('[stage3-concept-generation] Fallback candidates due to:', err?.message);
    return fallbackStage3Candidates(videoUnderstanding);
  }
}

function fallbackStage3Candidates(videoUnderstanding: VideoUnderstanding): ThumbnailCandidateConcept[] {
  const cat = videoUnderstanding.contentType.toLowerCase();

  if (cat.includes('survival')) {
    return [
      {
        conceptSummary: 'Desperate Struggle against a Blinding Glacier Blizzard',
        storyMoment: 'Clinging to a frozen ice shelf while battling sub-zero winds with an emergency flare',
        curiosityMechanism: 'How can anyone survive in these brutal sub-zero conditions?',
        cameraAngle: 'Dynamic low angle',
        shotType: 'Medium close-up',
        subjectPose: 'Crouching low against whipping winds, shielding eyes with ice-crusted glove',
        subjectPosition: 'Left third leading into the storm',
        subjectScale: '45-50% frame presence',
        backgroundStructure: 'Deep glacial crevasses fading into blinding white storm haze',
        keyElements: ['Ice-crusted face with survival grit', 'Vivid orange emergency flare smoke', 'Looming jagged ice ridge'],
        visualHierarchy: '1. Exhausted face and eyes, 2. Glowing flare, 3. Looming ice chasm',
        whyItFitsTheVideo: 'Puts viewer right in the life-or-death freeze of the most extreme environment',
      },
      {
        conceptSummary: 'The Impossible Threshold: Baking Salt Flats Meeting Jagged Arctic Peaks',
        storyMoment: 'Crossing an extreme geological border where scorching heat haze meets freezing frost',
        curiosityMechanism: 'Contrasting deadly extremes in one unified, believable landscape',
        cameraAngle: 'Eye-level 3/4 dynamic perspective',
        shotType: 'Tight medium shot',
        subjectPose: 'Exhausted stride forward, gripping worn survival staff, looking ahead with disbelief',
        subjectPosition: 'Right-weighted',
        subjectScale: '40% frame presence',
        backgroundStructure: 'Cracked scorched earth in foreground meeting looming frozen peaks behind',
        keyElements: ['Creator in weather-worn jacket', 'Makeshift survival staff', 'Cracked white salt flats and frost mist'],
        visualHierarchy: '1. Creator expression, 2. Ground fissure transition, 3. Horizon peaks',
        whyItFitsTheVideo: 'Illustrates enduring multiple contrasting biomes without a cheap split-screen collage',
      },
      {
        conceptSummary: 'Venomous Standoff inside Extreme Canyon Shelter',
        storyMoment: 'Cornered in a blistering rock crevice during heatwave with imminent wildlife hazard',
        curiosityMechanism: 'Immediate physical peril right before an instinctive survival reaction',
        cameraAngle: 'Over-the-shoulder close-up',
        shotType: 'Close-up with deep focus',
        subjectPose: 'Frozen still in tension, holding breath, eyes locked on obstacle',
        subjectPosition: 'Dominant right foreground',
        subjectScale: '50% frame presence',
        backgroundStructure: 'Dark natural rock archway framing blinding scorched desert sun',
        keyElements: ['Sweat and dust on brow', 'Silhouette of desert predator on rock ledge', 'Blinding canyon exit'],
        visualHierarchy: '1. Shocked eyes/face, 2. Silhouette threat, 3. Blinding exit',
        whyItFitsTheVideo: 'Delivers immediate visceral danger and high stakes',
      },
    ];
  }

  return [
    {
      conceptSummary: `High-Stakes Dramatic Turning Point for ${videoUnderstanding.corePremise}`,
      storyMoment: 'The moment of maximum tension before the climax',
      curiosityMechanism: 'Viewer wonders what unexpected consequence just occurred',
      cameraAngle: 'Dynamic low angle',
      shotType: 'Medium close-up',
      subjectPose: 'Visceral reaction, hands poised in active engagement',
      subjectPosition: 'Left third',
      subjectScale: '45-50% frame presence',
      backgroundStructure: 'High depth of field contextual environment',
      keyElements: ['Primary focal subject', 'Key storytelling object of conflict'],
      visualHierarchy: '1. Subject face, 2. Story object, 3. Contextual background',
      whyItFitsTheVideo: 'Establishes clear stakes and instant 1-second intrigue',
    },
    {
      conceptSummary: 'Direct Contrast Juxtaposition',
      storyMoment: 'The stark reality gap at the core of the video',
      curiosityMechanism: 'Immediate visual disparity between expectation and reality',
      cameraAngle: 'Eye-level frontal',
      shotType: 'Tight medium shot',
      subjectPose: 'Direct engaged gesture pointing out the discrepancy',
      subjectPosition: 'Right-weighted',
      subjectScale: '40% frame presence',
      backgroundStructure: 'Clean environmental division with strong luminance separation',
      keyElements: ['Focal subject', 'High-contrast comparison element'],
      visualHierarchy: '1. Primary subject, 2. Contrasting element',
      whyItFitsTheVideo: 'Directly reinforces the video promise without visual clutter',
    },
    {
      conceptSummary: 'Intimate Discovery Moment',
      storyMoment: 'Uncovering the surprising central fact',
      curiosityMechanism: 'An unexpected visual clue that demands explanation',
      cameraAngle: 'Tight 3/4 close-up',
      shotType: 'Close-up',
      subjectPose: 'Intense focused observation',
      subjectPosition: 'Center-left',
      subjectScale: '50% frame presence',
      backgroundStructure: 'Atmospheric depth with warm-cool rim separation',
      keyElements: ['Focused emotional expression', 'The central mystery artifact'],
      visualHierarchy: '1. Facial intensity, 2. Central artifact',
      whyItFitsTheVideo: 'Triggers intense curiosity without revealing the solution',
    },
  ];
}

// ============================================================================
// STAGE 4: SIMILARITY REJECTION ENGINE (9-DIMENSIONAL COMPARISON)
// ============================================================================
export function evaluateCandidateSimilarity(
  candidate: ThumbnailCandidateConcept,
  original: OriginalThumbnailSignature | null | undefined,
  index: number
): SimilarityCheckResult {
  if (!original) {
    return {
      candidateIndex: index,
      matchedDimensionsCount: 0,
      matchedDimensions: [],
      isRejected: false,
      reason: 'No original thumbnail provided for comparison',
    };
  }

  const matchedDimensions: string[] = [];

  // Helper for fuzzy token matching
  const hasTokenOverlap = (strA: string, strB: string, keywords: string[]): boolean => {
    const a = (strA || '').toLowerCase();
    const b = (strB || '').toLowerCase();
    return keywords.some((k) => a.includes(k) && b.includes(k));
  };

  // 1. Camera Angle
  if (
    hasTokenOverlap(candidate.cameraAngle, original.cameraAngle, ['top-down', 'overhead', 'flat lay']) ||
    hasTokenOverlap(candidate.cameraAngle, original.cameraAngle, ['low angle', 'low-angle', 'upward']) ||
    hasTokenOverlap(candidate.cameraAngle, original.cameraAngle, ['high angle', 'birds eye']) ||
    hasTokenOverlap(candidate.cameraAngle, original.cameraAngle, ['dutch angle', 'tilted'])
  ) {
    matchedDimensions.push('Camera Angle');
  }

  // 2. Shot Type
  if (
    hasTokenOverlap(candidate.shotType, original.shotType, ['wide', 'full body', 'full-body', 'long shot']) ||
    hasTokenOverlap(candidate.shotType, original.shotType, ['extreme close-up', 'macro']) ||
    hasTokenOverlap(candidate.shotType, original.shotType, ['close-up', 'tight close'])
  ) {
    matchedDimensions.push('Shot Type');
  }

  // 3. Main Subject Pose
  if (
    hasTokenOverlap(candidate.subjectPose, original.mainSubjectPose, ['lying', 'laying', 'on back', 'prone']) ||
    hasTokenOverlap(candidate.subjectPose, original.mainSubjectPose, ['running', 'sprinting']) ||
    hasTokenOverlap(candidate.subjectPose, original.mainSubjectPose, ['sitting', 'kneeling', 'cross-legged'])
  ) {
    matchedDimensions.push('Main Subject Pose');
  }

  // 4. Main Subject Position
  if (
    hasTokenOverlap(candidate.subjectPosition, original.mainSubjectPosition, ['center', 'dead center', 'middle']) ||
    hasTokenOverlap(candidate.subjectPosition, original.mainSubjectPosition, ['left third', 'far left']) ||
    hasTokenOverlap(candidate.subjectPosition, original.mainSubjectPosition, ['right third', 'far right'])
  ) {
    matchedDimensions.push('Main Subject Position');
  }

  // 5. Main Subject Scale
  const candidateSmall = /small|20%|25%|distant/i.test(candidate.subjectScale);
  const originalSmall = /small|20%|25%|distant/i.test(original.mainSubjectScale);
  if (candidateSmall && originalSmall) {
    matchedDimensions.push('Main Subject Scale (both distant)');
  }

  // 6. Background Structure
  if (
    hasTokenOverlap(candidate.backgroundStructure, original.backgroundStructure, ['split', 'three-way', 'multi-panel', 'collage']) ||
    hasTokenOverlap(candidate.backgroundStructure, original.backgroundStructure, ['solid', 'studio', 'plain backdrop'])
  ) {
    matchedDimensions.push('Background Structure');
  }

  // 7. Environment Arrangement
  const originalEnvs = (original.environmentPlacement || []).join(' ').toLowerCase();
  const candidateEnvs = (candidate.keyElements || []).concat(candidate.backgroundStructure).join(' ').toLowerCase();
  if (
    (originalEnvs.includes('snow') && originalEnvs.includes('desert') && candidateEnvs.includes('snow') && candidateEnvs.includes('desert')) ||
    (originalEnvs.includes('top') && originalEnvs.includes('left') && candidateEnvs.includes('top') && candidateEnvs.includes('left'))
  ) {
    matchedDimensions.push('Environment Arrangement');
  }

  // 8. Prop Selection & Placement
  const originalProps = (original.propsAndPositions || []).join(' ').toLowerCase();
  const candidateProps = (candidate.keyElements || []).join(' ').toLowerCase();
  if (
    (originalProps.includes('scorpion') && candidateProps.includes('scorpion')) ||
    (originalProps.includes('snake') && candidateProps.includes('snake')) ||
    (originalProps.includes('spider') && candidateProps.includes('spider'))
  ) {
    matchedDimensions.push('Prop Selection & Placement');
  }

  // 9. Overall Visual Narrative
  if (
    hasTokenOverlap(candidate.storyMoment, original.visualNarrative, ['lying helpless', 'unconscious', 'stranded on back'])
  ) {
    matchedDimensions.push('Visual Narrative');
  }

  // Reject if closely matches the original in 3 or more major dimensions
  const isRejected = matchedDimensions.length >= 3;
  const reason = isRejected
    ? `Matches original thumbnail in ${matchedDimensions.length} major dimensions (${matchedDimensions.join(', ')}). Rejected to ensure genuine originality.`
    : `Sufficiently original (${matchedDimensions.length} matches: ${matchedDimensions.join(', ') || 'none'}).`;

  return {
    candidateIndex: index,
    matchedDimensionsCount: matchedDimensions.length,
    matchedDimensions,
    isRejected,
    reason,
  };
}

// ============================================================================
// STAGE 5: SELECT THE STRONGEST CONCEPT
// ============================================================================
export function selectStrongestConcept(
  candidates: ThumbnailCandidateConcept[],
  similarityResults: SimilarityCheckResult[],
  videoUnderstanding: VideoUnderstanding
): { winningConcept: ThumbnailCandidateConcept; selectedIndex: number; rationale: string } {
  // Filter for unrejected candidates
  const accepted = candidates
    .map((c, idx) => ({ candidate: c, index: idx, similarity: similarityResults[idx] }))
    .filter((item) => !item.similarity?.isRejected);

  const pool = accepted.length > 0
    ? accepted
    : candidates.map((c, idx) => ({ candidate: c, index: idx, similarity: similarityResults[idx] }));

  // Score pool candidates based on criteria:
  // - Premise alignment
  // - Curiosity gap
  // - Mobile readability (medium close-up, dynamic angle)
  // - Focal simplicity (under 4 key elements)
  let bestItem = pool[0];
  let highestScore = -1;

  for (const item of pool) {
    const c = item.candidate;
    let score = 50;

    // Favor medium close-up, close-up, or dynamic angles over distant
    if (/close-up|medium close-up|tight/i.test(c.shotType)) score += 15;
    if (/dynamic low angle|3\/4|over-the-shoulder/i.test(c.cameraAngle)) score += 10;
    if (/40%|45%|50%|55%/i.test(c.subjectScale)) score += 10;
    if (c.keyElements.length >= 2 && c.keyElements.length <= 4) score += 10;
    if (/curiosity|wonder|how|disbelief|tension/i.test(c.curiosityMechanism)) score += 10;

    // Bonus for fewest matches to original
    score += Math.max(0, (3 - (item.similarity?.matchedDimensionsCount || 0)) * 5);

    if (score > highestScore) {
      highestScore = score;
      bestItem = item;
    }
  }

  return {
    winningConcept: bestItem.candidate,
    selectedIndex: bestItem.index,
    rationale: `Selected concept #${bestItem.index + 1} ("${bestItem.candidate.conceptSummary}") for maximum narrative tension, 1-second mobile readability, and genuine visual differentiation.`,
  };
}

// ============================================================================
// STAGE 6: FINAL PRODUCTION IMAGE PROMPT COMPILATION
// ============================================================================
export async function compileFinalImagePrompt(
  ai: GoogleGenAI,
  winningConcept: ThumbnailCandidateConcept,
  videoUnderstanding: VideoUnderstanding,
  identityPreservationNeeded: boolean,
  videoTitle: string
): Promise<string> {
  const systemInstruction = `You are a world-class prompt engineer for text-to-image AI generators specializing exclusively in high-CTR 16:9 YouTube thumbnails.
Convert the chosen thumbnail concept into ONE directly usable, polished image-generation prompt.

CRITICAL IDENTITY RULE:
${identityPreservationNeeded
  ? 'The video features a real creator. Explicitly instruct: "Preserve the exact recognizable identity, facial structure, skin tone, and hairstyle of the same creator from the uploaded reference image, without copying the reference image\'s original pose, angle, crop, or background."'
  : 'Describe the primary subject with bold visual clarity.'}

PROMPT STRUCTURE ORDER (Output as one continuous, natural English prompt without markdown headings):
1. Thumbnail objective and connection to video title
2. Exact visual story moment and curiosity gap
3. Main subject and identity preservation instruction
4. Expression, pose, and active body language
5. Camera angle, shot distance, crop, subject position, and subject scale (40-50% of frame)
6. Supporting elements (max 1-2 secondary props)
7. Background environment with clean figure-ground luminance separation
8. High-contrast directional lighting with rim lighting
9. Mobile feed readability (150px scale instant comprehension)
10. Text instruction ("no text, clean visual only" or exact 2-4 words in quotation marks)
11. Specific negative constraints (no movie-poster styling, no generic glossy AI skin, no random floating particles, no cluttered backgrounds, no malformed anatomy)
12. Aspect ratio: --ar 16:9

FORBIDDEN BUZZWORDS:
DO NOT use empty buzzwords like "8K", "masterpiece", "epic", "ultra-detailed", "cinematic", "vibrant", or "photorealistic". Use concrete visual directives instead.`;

  const promptInput = `Video Title: "${videoTitle.replace(/"/g, '\\"')}"
Chosen Concept Summary: ${winningConcept.conceptSummary}
Story Moment: ${winningConcept.storyMoment}
Curiosity Mechanism: ${winningConcept.curiosityMechanism}
Camera Angle & Shot Type: ${winningConcept.cameraAngle}, ${winningConcept.shotType}
Subject Pose & Placement: ${winningConcept.subjectPose} (positioned ${winningConcept.subjectPosition}, scale ${winningConcept.subjectScale})
Key Elements: ${winningConcept.keyElements.join(', ')}
Background Structure: ${winningConcept.backgroundStructure}
Visual Hierarchy: ${winningConcept.visualHierarchy}
Why It Sells the Video: ${winningConcept.whyItFitsTheVideo}

Compile into the final polished English text-to-image prompt ending with --ar 16:9.`;

  try {
    const promptText = await generateContentWithFallback(
      ai,
      {
        systemInstruction,
        contents: promptInput,
      },
      'stage6-compile-prompt'
    );

    let cleaned = promptText.replace(/\b(8k|16k|masterpiece|ultra-detailed|hyper-realistic)\b/gi, '').replace(/\s{2,}/g, ' ').trim();
    if (!cleaned.includes('--ar 16:9')) {
      cleaned += ' --ar 16:9';
    }
    return cleaned;
  } catch (err: any) {
    console.warn('[stage6-compile-prompt] Fallback to deterministic prompt builder:', err?.message);
    return fallbackStage6Prompt(winningConcept, videoTitle, identityPreservationNeeded);
  }
}

function fallbackStage6Prompt(
  concept: ThumbnailCandidateConcept,
  videoTitle: string,
  identityPreservationNeeded: boolean
): string {
  const identityStr = identityPreservationNeeded
    ? 'Preserve the exact recognizable identity, facial structure, skin tone, and hairstyle of the creator from the uploaded reference image, without copying the reference image\'s original pose, angle, or background.'
    : 'Primary focal subject rendered with bold silhouettes and high focal clarity.';

  const propsStr = concept.keyElements && concept.keyElements.length > 1
    ? concept.keyElements.slice(1, 3).join(', ')
    : 'key contextual storytelling element';

  return `High-CTR YouTube thumbnail visual for video titled "${videoTitle}". Story Moment: ${concept.storyMoment}. ${identityStr} Main Subject: Positioned ${concept.subjectPosition} occupying ${concept.subjectScale} of the frame. Pose and Action: ${concept.subjectPose}. Camera and Framing: ${concept.cameraAngle}, ${concept.shotType} with tight framing ensuring instant recognition on mobile feeds. Supporting Elements: ${propsStr} placed in secondary plane to reinforce story context without cluttering the focal point. Background: ${concept.backgroundStructure} with strong figure-ground luminance separation and shallow depth of field. Lighting: High-contrast directional key lighting with crisp rim lighting to carve the subject silhouette against the environment. Mobile Feed Readability: High visual hierarchy and bold silhouette separation engineered for 1-second comprehension at 150px mobile scale. Text Overlay: No text, clean visual storytelling only. Negative Constraints: Avoid movie poster layouts, generic glossy AI skin, excessive sharpness everywhere, random floating particles, unnecessary lens flares, overcrowded backgrounds, distorted hands or anatomy, and duplicate elements. --ar 16:9`;
}

// ============================================================================
// STAGE 3B: ELEVATE ORIGINAL THUMBNAIL (SMART COMPOSITION REDESIGN)
// ============================================================================
export async function runElevateOriginalThumbnailPrompt(
  ai: GoogleGenAI,
  videoUnderstanding: VideoUnderstanding,
  sig: OriginalThumbnailSignature,
  videoTitle: string,
  diagnosticContext?: {
    weaknesses?: string[];
    improvements?: Array<{
      observation?: string;
      suggestedAction?: string;
      reason?: string;
      tradeoffOrUncertainty?: string;
    }>;
    abTestHypothesis?: {
      specificChange?: string;
      whyItMightHelp?: string;
    };
    scores?: {
      visualImpact?: number;
      readability?: number;
      curiosity?: number;
      clarity?: number;
      titleThumbnailAlignment?: number;
    };
  }
): Promise<string> {
  const weaknessesList = diagnosticContext?.weaknesses && diagnosticContext.weaknesses.length > 0
    ? diagnosticContext.weaknesses
    : sig.weaknesses || ['Improve mobile contrast and focal dominance'];

  const improvementsList = diagnosticContext?.improvements && diagnosticContext.improvements.length > 0
    ? diagnosticContext.improvements.map((imp) => `${imp.suggestedAction} (Reason: ${imp.reason})`)
    : ['Zoom in closer on the primary subject and boost rim light separation'];

  const systemInstruction = `You are the world's leading YouTube CTR Strategist, Thumbnail Art Director, and AI Prompt Engineer.
Your task is to take the creator's video premise, their original uploaded thumbnail, and the DIAGNOSTIC AUDIT RESULTS to synthesize a SMART, HIGH-CTR REDESIGN of the original thumbnail.

THE GOLDEN PRINCIPLE: SMART COMPOSITIONAL UPGRADE (NOT A LAZY COPY, NOT AN UNRELATED STORY!)
- **What Must Remain Consistent (Core DNA)**:
  - Video theme, creator's recognizable identity/face, clothing color palette, the specific biomes/environments, and key storytelling props/creatures (e.g. snow, desert, jungle, scorpion, yellow snake, red jacket).
  - DO NOT invent completely unrelated storylines or random sci-fi/movie hazards (no random volcanoes, space suits, gas masks, or hospital monitors).
- **What Must Smartly Change & Evolve (Active Design Upgrades)**:
  1. **Dynamic Camera Angle & Staging Upgrade**: Do NOT just copy a flat or passive camera angle. Elevate to an intense, dynamic angle (e.g. dramatic 3/4 low-angle or high-tension dynamic crop) that puts the viewer in the heart of the action.
  2. **Layered 3D Depth & Foreground Threat**: Stage the most dangerous element (e.g. scorpion pincer / coiled snake) dramatically into the near foreground plane with shallow depth of field, creating visceral 3D depth and imminent peril.
  3. **High-Contrast Dual-Tone Lighting**: Upgrade flat lighting into punchy dual-temperature lighting (e.g. cold icy-blue rim light on one side, warm fiery golden-amber rim light on the other) to carve the subject silhouette cleanly against the background.
  4. **Facial Expression Escalation**: Escalate facial emotion to peak authentic survival distress (wide-eyed shock, grit, mud streaks, frost crystals) commanding immediate empathy.
  5. **Focal Scale & Mobile Stopping Power**: Main subject commands 45-55% of the frame with high figure-ground luminance separation engineered for 150px mobile feeds.
  6. **Direct Diagnostic Resolution**: Specifically execute the fixes for the weaknesses and improvements identified in the audit.

CRITICAL DIRECTIVE: THIS IS A YOUTUBE THUMBNAIL, NOT A MOVIE POSTER!
- No distant panoramic vistas, no dark moody shadows that hide details on phone screens, no cinematic billing credits.
- Max 2-3 major visual elements total (creator + 1-2 primary threats/context elements).

PROMPT STRUCTURE ORDER (Output as one continuous, highly descriptive English prompt without markdown headings):
1. Thumbnail objective and connection to video title
2. Smart visual redesign concept preserving core story DNA while upgrading composition
3. Main subject description (preserving exact identity, facial structure, skin tone, hair, escalated authentic distress, and clothing)
4. Dynamic camera angle, framing, and subject position (occupying 45-50% of frame)
5. Layered environmental composition (seamlessly converging biomes)
6. Supporting threats/props staged with dynamic foreground/midground depth
7. High-contrast dual-tone directional lighting & rim light separation
8. Mobile readability & silhouette clarity
9. Text instruction ("no text, clean visual only" or exact phrase in quotes)
10. Negative constraints (no generic glossy AI skin, no flat lighting, no deformed anatomy, no extra random creatures, no movie poster layouts, no watermarks)
11. Aspect ratio: --ar 16:9`;

  const promptInput = `Video Title: "${videoTitle.replace(/"/g, '\\"')}"
Video Core Premise: ${videoUnderstanding.corePremise}
Content Category: ${videoUnderstanding.contentType}

ORIGINAL THUMBNAIL SCAN (CORE DNA TO PRESERVE & UPGRADE):
- Core Scenario: ${sig.sceneConcept || sig.visualNarrative}
- Creator Identity & State: ${sig.clothingAndDetails || 'Featured creator in survival distress'}
- Current Camera Angle & Shot: ${sig.cameraAngle}, ${sig.shotType} (Subject Position: ${sig.mainSubjectPosition}, Scale: ${sig.mainSubjectScale})
- Environments & Layout: ${(sig.environmentPlacement || []).join('; ') || sig.backgroundStructure}
- Signature Props & Creatures: ${(sig.propsAndPositions || []).join('; ') || 'Key scene props'}

DIAGNOSTIC AUDIT FINDINGS (ERRORS & WEAKNESSES TO DIRECTLY FIX):
${weaknessesList.map((w, i) => `${i + 1}. WEAKNESS IDENTIFIED: ${w}`).join('\n')}

PRESCRIBED IMPROVEMENTS TO EXECUTE IN THIS PROMPT:
${improvementsList.map((imp, i) => `${i + 1}. ACTION TO IMPLEMENT: ${imp}`).join('\n')}

${diagnosticContext?.abTestHypothesis?.specificChange ? `A/B TEST HYPOTHESIS: ${diagnosticContext.abTestHypothesis.specificChange}` : ''}

Synthesize the final production prompt that smartly upgrades this thumbnail's composition, angle, depth, and lighting (without copying passively and without inventing unrelated stories). End with --ar 16:9.`;

  try {
    const promptText = await generateContentWithFallback(
      ai,
      {
        systemInstruction,
        contents: promptInput,
      },
      'stage-elevate-original-thumbnail'
    );

    let cleaned = promptText
      .replace(/\b(8k|16k|masterpiece|ultra-detailed|hyper-realistic)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!cleaned.includes('--ar 16:9')) {
      cleaned += ' --ar 16:9';
    }
    return cleaned;
  } catch (err: any) {
    console.warn('[stage-elevate-original-thumbnail] Fallback to deterministic prompt builder:', err?.message);
    return fallbackElevateOriginalPrompt(videoUnderstanding, sig, videoTitle, diagnosticContext);
  }
}

export function fallbackElevateOriginalPrompt(
  videoUnderstanding: VideoUnderstanding,
  sig: OriginalThumbnailSignature,
  videoTitle: string,
  diagnosticContext?: {
    weaknesses?: string[];
    improvements?: Array<{
      observation?: string;
      suggestedAction?: string;
      reason?: string;
      tradeoffOrUncertainty?: string;
    }>;
  }
): string {
  const identityPart = sig.identityReferencePresent
    ? `Preserve the exact recognizable identity, facial structure, skin tone, and hair of the creator from the reference image, with intensified survival distress including snow frost dusting his hair, light mud and scratch marks on his face, eyes wide with adrenaline and physical shock, wearing a tattered bright red hooded outdoor survival jacket.`
    : `Primary focal subject rendered with intense facial distress and authentic emotional reaction.`;

  const envsStr = sig.environmentPlacement && sig.environmentPlacement.length > 0
    ? sig.environmentPlacement.join('; ')
    : 'contrasting extreme biomes seamlessly converging around the subject';

  const propsStr = sig.propsAndPositions && sig.propsAndPositions.length > 0
    ? sig.propsAndPositions.join(', ')
    : 'key storytelling environmental threats';

  const improvementFix = diagnosticContext?.improvements?.[0]?.suggestedAction
    ? `Smart design elevation: ${diagnosticContext.improvements[0].suggestedAction}.`
    : `Smart design elevation: Upgrading composition to dynamic 3/4 perspective with layered foreground threat proximity and high-contrast dual-tone rim lighting.`;

  return `High-impact YouTube thumbnail visual for video titled "${videoTitle}". Smart compositional elevation of original thumbnail premise: ${sig.visualNarrative || sig.sceneConcept || 'Creator stranded in survival peril'}. ${improvementFix} ${identityPart} Dynamic framing: Upgraded dynamic 3/4 medium close-up angle, positioning the creator dominant and centered-left, commanding 45-50% of the 16:9 frame for maximum mobile stopping power. Layered 3D staging: Immediate foreground features ${propsStr} positioned with dramatic depth-of-field, creating imminent visceral peril. Background environment: Photorealistic seamless convergence of ${envsStr} with organic terrain blending. Lighting: High-contrast dual-temperature directional lighting with crisp cold-blue and warm-amber rim lighting carving the subject silhouette against the environment. Mobile feed readability: Bold figure-ground separation engineered for instant 1-second comprehension at 150px mobile scale. Text overlay: No text, clean visual storytelling only. Negative constraints: Avoid movie poster layouts, passive flat compositions, generic glossy plastic AI skin, distorted hands or anatomy, extra random creatures, cluttered backgrounds, and watermarks. --ar 16:9`;
}

// ============================================================================
// MAIN PIPELINE ORCHESTRATOR
// ============================================================================
export async function executeMultiStageThumbnailPromptPipeline(
  ai: GoogleGenAI,
  input: ThumbnailPipelineInput
): Promise<string> {
  // Step 1: Run Stage 1 (Text-only Video Understanding) and Stage 2 (Vision Audit if image provided)
  const stage1Promise = runStage1VideoUnderstanding(ai, input);
  const stage2Promise = input.parsedImage
    ? runStage2OriginalThumbnailAudit(ai, input.parsedImage, input.videoTitle)
    : Promise.resolve(null);

  const [videoUnderstanding, originalSignature] = await Promise.all([stage1Promise, stage2Promise]);

  // If a reference thumbnail was uploaded, reason directly about the original thumbnail
  // to elevate it according to the diagnostic weaknesses and improvements ("kapağın analizine göre")
  if (originalSignature && input.parsedImage) {
    return await runElevateOriginalThumbnailPrompt(
      ai,
      videoUnderstanding,
      originalSignature,
      input.videoTitle,
      {
        weaknesses: input.diagnosticWeaknesses,
        improvements: input.diagnosticImprovements,
        abTestHypothesis: input.abTestHypothesis,
        scores: input.diagnosticScores,
      }
    );
  }

  // If NO thumbnail was provided (Mode B: concept generation from scratch):
  // Generate diverse fresh concepts based on the video title & topic
  const candidates = await runStage3IndependentConceptGeneration(ai, videoUnderstanding, {
    identityReferencePresent: false,
    confirmedEntities: videoUnderstanding.importantEntities,
    weaknessesToSolve: ['Ensure high contrast and clean focal hierarchy'],
  });

  const selection = selectStrongestConcept(candidates, [], videoUnderstanding);

  return await compileFinalImagePrompt(
    ai,
    selection.winningConcept,
    videoUnderstanding,
    false,
    input.videoTitle
  );
}
