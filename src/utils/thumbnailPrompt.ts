import { AnalysisResult } from '../types';

/**
 * Strips hollow AI buzzwords and replaces generic clichés with concrete instructions.
 */
export function sanitizePromptBuzzwords(prompt: string): string {
  if (!prompt) return '';
  return prompt
    .replace(/\b(8k|16k|photorealistic\s*8k\s*quality|ultra-detailed|hyper-realistic|masterpiece)\b/gi, '')
    .replace(/\bcinematic\s+lighting\b/gi, 'high-contrast directional lighting with rim light separation')
    .replace(/\bvibrant\s+colors\b/gi, 'bold complementary color separation')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Infers content pattern from title and topic to apply category-specific composition strategy.
 */
export function inferContentCategory(title: string = '', topic: string = '', context: string = ''): string {
  const combined = `${title} ${context} ${topic}`.toLowerCase();
  if (/(surviv|extreme|wilderness|stranded|deadly|trapped)/i.test(combined)) return 'survival';
  if (/\b(vs|versus|compare|comparison|cheapest|expensive)\b/i.test(combined)) return 'comparison';
  if (/(transform|before and after|makeover|day [0-9]+ to day [0-9]+)/i.test(combined)) return 'transformation';
  if (/(how to|tutorial|guide|beginner|masterclass|learn)/i.test(combined)) return 'tutorial';
  if (/(review|tested|unboxing|worth it|hands-on)/i.test(combined)) return 'product_review';
  if (/(mystery|investigation|\btruth\b|exposed|secret|conspiracy|unsolved|disappearance)/i.test(combined)) return 'mystery';
  if (/(reaction|reacting to|try not to)/i.test(combined)) return 'reaction';
  if (/(experiment|i tried|we spent|24 hours|challenge)/i.test(combined)) return 'challenge';
  if (/(documentary|history|rise and fall|story of)/i.test(combined)) return 'documentary';
  return 'general_story';
}

/**
 * Builds a polished, production-ready 16:9 image-generation prompt for a YouTube thumbnail
 * following the intelligent 8-stage reasoning pipeline and 12-point logical structure.
 */
export function buildThumbnailPrompt(data: Partial<AnalysisResult>): string {
  // If backend returned a valid high-quality prompt, clean buzzwords and return it
  if (data.aiImagePrompt && data.aiImagePrompt.trim().length > 30) {
    const cleaned = sanitizePromptBuzzwords(data.aiImagePrompt.trim());
    if (cleaned.includes('--ar 16:9') || cleaned.toLowerCase().includes('16:9')) {
      return cleaned;
    }
    return `${cleaned} --ar 16:9`;
  }

  const title = (data.videoTitle || 'YouTube Video').trim();
  const category = inferContentCategory(title, data.videoTopic || '', data.videoContext || '');
  const concept = data.abTestDetails?.thumbnailConcept;
  const extraction = data.structuredExtraction;

  // 1. Thumbnail Objective & Connection to Video Promise
  let objective: string;
  let visualConcept: string;
  let cameraAngle: string;
  let subjectPlacement: string;

  switch (category) {
    case 'survival':
      objective = `YouTube thumbnail image establishing intense visceral survival stakes for video titled "${title}".`;
      visualConcept = `High-tension survival dilemma showing immediate physical peril and exhaustion without revealing the survival outcome.`;
      cameraAngle = `Dynamic low-angle medium close-up perspective focusing on physical strain and immediate hazard proximity.`;
      subjectPlacement = `Subject anchored in the left-third, actively struggling against the hostile environment.`;
      break;
    case 'comparison':
      objective = `High-impact YouTube thumbnail comparison visual for video titled "${title}".`;
      visualConcept = `Instant split-contrast or stark side-by-side juxtaposition showing extreme disparity without clutter.`;
      cameraAngle = `Direct frontal medium shot with symmetrical visual balance and bold dividing contrast.`;
      subjectPlacement = `Two distinct high-contrast elements weighted across left and right halves with clean silhouette separation.`;
      break;
    case 'challenge':
      objective = `High-curiosity YouTube thumbnail visual capturing peak struggle for video titled "${title}".`;
      visualConcept = `Peak moment of an extreme challenge capturing high-stakes action and raw emotional reaction right before resolution.`;
      cameraAngle = `Dynamic close-up or 3/4 medium angle emphasizing genuine effort and immediate environmental obstacles.`;
      subjectPlacement = `Left-weighted or centered primary subject occupying 45-55% of frame with clear line of action toward the challenge obstacle.`;
      break;
    case 'transformation':
      objective = `Compelling transformation YouTube thumbnail visual for video titled "${title}".`;
      visualConcept = `Dramatic before-and-after visual contrast capturing an astonishing evolution while preserving factual authenticity.`;
      cameraAngle = `Eye-level split composition with matching camera distance to emphasize visible change.`;
      subjectPlacement = `Split-frame composition with balanced focus and clear directional contrast from left to right.`;
      break;
    case 'mystery':
    case 'documentary':
      objective = `Atmospheric YouTube thumbnail visual compelling viewer curiosity for video titled "${title}".`;
      visualConcept = `Unresolved visual question presenting an intriguing clue or central artifact that sparks immediate curiosity without spoiling the reveal.`;
      cameraAngle = `Slight low-angle medium shot creating narrative tension and depth.`;
      subjectPlacement = `Focal subject positioned slightly off-center with gaze or lighting drawing the eye toward the central mystery element.`;
      break;
    default:
      objective = `High-CTR YouTube thumbnail visual designed for video titled "${title}".`;
      visualConcept = `Compelling narrative tension with a strong curiosity gap that complements the title rather than repeating it.`;
      cameraAngle = concept?.cameraAngle || `Dynamic medium close-up angle with tight framing on the primary focal point.`;
      subjectPlacement = `Dominant primary focal subject positioned with clear visual weight and uncluttered negative space.`;
      break;
  }

  // 3. Main Subject & Identity Preservation Instruction
  const hasPerson =
    (extraction?.namedPeople?.thumbnailPeople && extraction.namedPeople.thumbnailPeople.length > 0) ||
    (extraction?.visibleObjects && extraction.visibleObjects.some(o => /person|man|woman|creator|face|guy/i.test(o))) ||
    Boolean(data.faceExpressionFeedback && !data.faceExpressionFeedback.toLowerCase().includes('no human'));

  const subjectDescription = concept?.mainObject || extraction?.visibleObjects?.[0] || 'Primary focal creator';
  const identityPreservation = hasPerson
    ? `Main Subject: Preserve the exact recognizable identity, facial structure, hairstyle, skin tone, and key clothing cues of the creator/person from the reference image, occupying a prominent 40-50% scale of the frame.`
    : `Main Subject: ${subjectDescription}, rendered with bold silhouettes and unmistakable focal dominance occupying 40-50% of the frame.`;

  // 4. Expression, Pose, and Action
  const emotion = concept?.targetEmotion || 'intense genuine curiosity and heightened anticipation';
  const expressionAndPose = `Expression and Pose: Raw, visceral expression of ${emotion}. Posture is engaged and active, directly interacting with the central premise.`;

  // 5. Camera, Crop, Subject Scale
  const cameraAndCrop = `Camera and Framing: ${cameraAngle} ${subjectPlacement} Tight crop ensuring the main subject remains instantly identifiable on small mobile screens.`;

  // 6. Supporting Objects and Scale
  const secondaryObjects = extraction?.visibleObjects && extraction.visibleObjects.length > 1
    ? extraction.visibleObjects.slice(1, 3).join(', ')
    : '1 to 2 key contextual storytelling props';
  const supportingProps = `Supporting Elements: Maximum two secondary storytelling props (${secondaryObjects}) positioned intentionally to support context without competing with the primary focal point.`;

  // 7. Background & Environment
  const backgroundEnv = concept?.background || 'Complementary environment with shallow depth of field, preventing visual clutter';
  const background = `Background: ${backgroundEnv}. Clean subject-to-background luminance separation prevents visual camouflage.`;

  // 8. Lighting, Color Separation & Hierarchy
  const lightingStyle = concept?.lighting || 'Directional key lighting with crisp rim light to carve subject silhouette against background';
  const colors = concept?.colorPalette || 'High-contrast complementary color palette';
  const lighting = `Lighting and Contrast: ${lightingStyle}. Color scheme: ${colors}. Strong luminance contrast guarantees a clear visual hierarchy.`;

  // 9. Mobile Readability Requirements
  const mobileReadability = `Mobile Feed Readability: High silhouette clarity and bold visual separation engineered for 1-second comprehension at 150px mobile thumbnail scale.`;

  // 10. Text Instruction
  const textHook = concept?.textOverlay?.trim() || '';
  const textInstruction = textHook
    ? `Text Overlay: Clean, bold text reading "${textHook}" in high-contrast typography in the upper corner, no other text or watermarks.`
    : `Text Overlay: No text, clean visual storytelling only.`;

  // 11. Specific Negative Constraints
  const negativeConstraints = `Negative Constraints: Avoid movie poster layouts, generic glossy AI skin, excessive sharpness everywhere, random floating particles, unnecessary lens flares, overcrowded backgrounds, distorted hands or anatomy, and duplicate elements.`;

  // 12. Aspect Ratio
  const aspectRatio = `--ar 16:9`;

  return [
    objective,
    visualConcept,
    identityPreservation,
    expressionAndPose,
    cameraAndCrop,
    supportingProps,
    background,
    lighting,
    mobileReadability,
    textInstruction,
    negativeConstraints,
    aspectRatio,
  ].join(' ');
}
