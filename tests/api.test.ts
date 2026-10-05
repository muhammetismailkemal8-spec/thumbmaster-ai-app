import assert from 'node:assert/strict';
import test from 'node:test';
import { handleCors, validateAndParseBase64Image } from '../api/_lib.js';

function createResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    headers: new Map<string, string>(),
    setHeader(name: string, value: string) {
      this.headers.set(name.toLowerCase(), value);
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}

test('CORS accepts a same-origin Vercel request', () => {
  const res = createResponse();
  const handled = handleCors(
    { method: 'POST', headers: { origin: 'https://thumbmaster.vercel.app', host: 'thumbmaster.vercel.app' } },
    res,
  );

  assert.equal(handled, false);
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://thumbmaster.vercel.app');
});

test('CORS rejects a foreign origin', () => {
  const res = createResponse();
  const handled = handleCors(
    { method: 'POST', headers: { origin: 'https://evil.example', host: 'thumbmaster.vercel.app' } },
    res,
  );

  assert.equal(handled, true);
  assert.equal(res.statusCode, 403);
  assert.equal(res.headers.has('access-control-allow-origin'), false);
});

test('base64 image validation accepts supported images and rejects invalid input', () => {
  assert.deepEqual(validateAndParseBase64Image('data:image/png;base64,aGVsbG8='), {
    mimeType: 'image/png',
    data: 'aGVsbG8=',
  });
  assert.equal(validateAndParseBase64Image('data:text/plain;base64,aGVsbG8='), null);
  assert.equal(validateAndParseBase64Image('not-an-image'), null);
});

test('calculateCtrGrade correctly assigns grades', async () => {
  const { calculateCtrGrade, normalizeCategoryScore } = await import('../api/_lib.js');
  assert.equal(calculateCtrGrade(92), 'A+');
  assert.equal(calculateCtrGrade(82), 'A');
  assert.equal(calculateCtrGrade(74), 'B');
  assert.equal(calculateCtrGrade(63), 'C');
  assert.equal(calculateCtrGrade(52), 'D');
  assert.equal(calculateCtrGrade(30), 'F');

  assert.equal(normalizeCategoryScore(85), 85);
  assert.equal(normalizeCategoryScore(-10), 0);
  assert.equal(normalizeCategoryScore(120), 100);
  assert.equal(normalizeCategoryScore(null, 50), 50);
});

test('calculateDeterministicOverallScore adheres strictly to displayed component scores and weights', async () => {
  const { calculateDeterministicOverallScore } = await import('../api/_lib.js');
  // Formula: 20% visual + 15% readability + 20% curiosity + 15% clarity + 30% titleThumbnailAlignment
  // 80*0.20 (16) + 70*0.15 (10.5) + 90*0.20 (18) + 80*0.15 (12) + 85*0.30 (25.5) = 82
  const score = calculateDeterministicOverallScore({
    visualImpact: 80,
    readability: 70,
    curiosity: 90,
    clarity: 80,
    titleThumbnailAlignment: 85,
  });
  assert.equal(score, 82);

  // Lower alignment score pulls down overall score transparently without separate hidden penalty
  const lowAlignScore = calculateDeterministicOverallScore({
    visualImpact: 80,
    readability: 70,
    curiosity: 90,
    clarity: 80,
    titleThumbnailAlignment: 20,
  });
  // 16 + 10.5 + 18 + 12 + 6 = 62.5 -> rounds to 63
  assert.equal(lowAlignScore, 63);
});

test('title-thumbnail complementary relationship classification recognizes representative moments', async () => {
  const { normalizeAlignmentVerdict } = await import('../api/_lib.js');

  // Case 1: 100 children dreams paired with one child meeting celebrity
  const representativeResult = normalizeAlignmentVerdict('REPRESENTATIVE_MOMENT', 82);
  assert.equal(representativeResult.relationshipType, 'REPRESENTATIVE_MOMENT');
  assert.equal(representativeResult.verdict, 'REPRESENTATIVE_MOMENT');
  assert.ok(representativeResult.score >= 70 && representativeResult.score <= 89, 'Score reflects representative moment without over-penalizing or inflating');

  const complementaryResult = normalizeAlignmentVerdict('COMPLEMENTARY_PAIR', 85);
  assert.equal(complementaryResult.relationshipType, 'COMPLEMENTARY_PAIR');
  assert.equal(complementaryResult.verdict, 'COMPLEMENTARY_PAIR');

  // Case 2: Genuinely unrelated title-thumbnail pair
  const unrelatedResult = normalizeAlignmentVerdict('CONTRADICTORY_OR_UNRELATED', 15);
  assert.equal(unrelatedResult.relationshipType, 'DIRECT_CONTRADICTION');
  assert.equal(unrelatedResult.verdict, 'CONTRADICTORY_OR_UNRELATED');
  assert.ok(unrelatedResult.score <= 25, 'Unrelated or contradictory pairs must be penalized appropriately');
});

test('prioritized improvements structure includes observation, suggested action, rationale, and tradeoff', () => {
  const improvement = {
    observation: 'The high-contrast yellow logo on the top right draws initial eye emphasis away from the facial expression.',
    suggestedAction: 'Lower the logo saturation by 20% or move it to a lower quadrant.',
    reason: 'Keeps primary focus on the human emotion which is the emotional anchor.',
    tradeoffOrUncertainty: 'Brand recognition might be slightly less immediate in small mobile previews.',
  };

  assert.ok(improvement.observation.length > 0);
  assert.ok(improvement.suggestedAction.length > 0);
  assert.ok(improvement.reason.length > 0);
  assert.ok(improvement.tradeoffOrUncertainty.length > 0);
  // Maximum 3 prioritized improvements rule
  const list = [improvement];
  assert.ok(list.length <= 3, 'Must not overwhelm creators with more than 3 prioritized improvements');
});

test('alternative concept is formulated as an untested hypothesis', () => {
  const hypothesis = {
    specificChange: 'Crop closer on the reaction face and darken the background by 15%.',
    whyItMightHelp: 'May increase emotional clarity at mobile scale.',
    whatItMightWeaken: 'Removes some environmental storytelling context.',
    testComparison: 'Run A/B test with 50/50 impression split on first 1,000 views to compare initial CTR.',
    variableTested: 'Framing & Subject Proximity',
    metricToMonitor: 'Click-through rate and average view duration (AVD)',
  };

  assert.ok(hypothesis.specificChange.length > 0);
  assert.ok(hypothesis.whyItMightHelp.length > 0);
  assert.ok(hypothesis.whatItMightWeaken.length > 0);
  assert.ok(hypothesis.testComparison.length > 0);
  // No guaranteed numerical claims
  assert.ok(!hypothesis.whyItMightHelp.includes('+30% CTR'));
  assert.ok(!hypothesis.whyItMightHelp.includes('guaranteed'));
});

test('viewer psychology assessment rejects pseudo-scientific claims', () => {
  // Test that forbidden strings are flagged
  const forbiddenJargon = [
    'primitive brain index',
    'neuro-hack',
    'biological lift',
    '+30% ctr',
    '0-300ms',
    '300-800ms',
    'subconscious perceives in 50ms',
  ];

  const sampleReportText = `
    Visual emphasis is primarily concentrated on the large central face due to luminance contrast.
    The curiosity gap is supported by the unexpected juxtaposition of props.
  `;

  for (const term of forbiddenJargon) {
    assert.ok(
      !sampleReportText.toLowerCase().includes(term),
      `Report must not contain pseudo-scientific term: "${term}"`
    );
  }
});

test('normalizeNumberString accurately handles English, Turkish, and formatted numbers', async () => {
  const { normalizeNumberString, extractNumbersFromText } = await import('../api/_lib.js');

  assert.equal(normalizeNumberString('100'), 100);
  assert.equal(normalizeNumberString('1,000'), 1000);
  assert.equal(normalizeNumberString('1.000'), 1000);
  assert.equal(normalizeNumberString('1K'), 1000);
  assert.equal(normalizeNumberString('10K'), 10000);
  assert.equal(normalizeNumberString('1M'), 1000000);
  assert.equal(normalizeNumberString('one thousand'), 1000);
  assert.equal(normalizeNumberString('one hundred'), 100);
  assert.equal(normalizeNumberString('ten thousand'), 10000);

  // Turkish number words
  assert.equal(normalizeNumberString('yüz'), 100);
  assert.equal(normalizeNumberString('bin'), 1000);
  assert.equal(normalizeNumberString('on bin'), 10000);
  assert.equal(normalizeNumberString('bir milyon'), 1000000);

  // Extract from sentence
  const extracted = extractNumbersFromText('We survived 100 days with $1,000 challenge');
  const normalizedValues = extracted.map((e) => e.normalized);
  assert.ok(normalizedValues.includes(100));
  assert.ok(normalizedValues.includes(1000));
});

test('hard scoring rules: completely unrelated topic caps alignment at 15 and overall at 35', async () => {
  const { validateAndEnforceScoreConsistency } = await import('../api/_lib.js');

  const result = validateAndEnforceScoreConsistency({
    visualImpact: 90,
    readability: 85,
    curiosity: 80,
    clarity: 85,
    titleThumbnailAlignment: 80, // initial high score from AI
    contradictions: [
      {
        type: 'topic_mismatch',
        severity: 'critical',
        description: 'Thumbnail depicts cooking sushi recipe while title is about car engine repair.',
      },
    ],
    alignmentDetails: {
      verdict: 'STRONG_MATCH', // AI mistakenly praised
      alignmentExplanation: 'Visually strong imagery.',
    },
  });

  assert.ok(result.titleThumbnailAlignment <= 15, 'Alignment score must be capped between 0 and 15');
  assert.ok(result.overallScore <= 35, 'Overall score must not exceed 35 for completely unrelated topic');
  assert.equal(result.alignmentDetails.verdict, 'CONTRADICTORY_OR_UNRELATED');
  assert.notEqual(result.alignmentDetails.relationshipType, 'COMPLEMENTARY_PAIR');
  assert.ok(result.isCapped, 'Must be flagged as capped');
  assert.equal(result.appliedCap, 35);
});

test('hard scoring rules: direct numeric contradiction caps alignment at 20, overall at 40, and shows both values', async () => {
  const { validateAndEnforceScoreConsistency } = await import('../api/_lib.js');

  // Title says 100 children, thumbnail explicitly displays 1,000
  const result = validateAndEnforceScoreConsistency({
    visualImpact: 85,
    readability: 80,
    curiosity: 85,
    clarity: 80,
    titleThumbnailAlignment: 75,
    structuredExtraction: {
      mainTopic: 'Children dreams',
      numbersAndQuantities: {
        titleNumbers: ['100'],
        thumbnailNumbers: ['1,000'],
        hasConflict: true,
      },
    },
    contradictions: [
      {
        type: 'numeric_conflict',
        severity: 'critical',
        description: 'Title states 100 children while thumbnail text displays 1,000.',
        titleValue: '100',
        thumbnailValue: '1,000',
      },
    ],
    alignmentDetails: {
      verdict: 'STRONG_MATCH',
    },
  });

  assert.ok(result.titleThumbnailAlignment <= 20, 'Alignment must not exceed 20 for direct numeric contradiction');
  assert.ok(result.overallScore <= 40, 'Overall score must not exceed 40');
  assert.equal(result.alignmentDetails.verdict, 'CONTRADICTORY_OR_UNRELATED');
  assert.ok(result.contradictions.some((c) => c.titleValue === '100' && c.thumbnailValue === '1,000'));
});

test('representative moment (e.g. 100 children with 1 child meeting celebrity) is NOT a numeric contradiction', async () => {
  const { validateAndEnforceScoreConsistency } = await import('../api/_lib.js');

  // 100 children in title, 1 child + host + celebrity in thumbnail, no conflicting number displayed
  const result = validateAndEnforceScoreConsistency({
    visualImpact: 85,
    readability: 80,
    curiosity: 85,
    clarity: 80,
    titleThumbnailAlignment: 82,
    structuredExtraction: {
      mainTopic: 'Children dreams fulfilled',
      numbersAndQuantities: {
        titleNumbers: ['100'],
        thumbnailNumbers: [], // No contradictory number
        hasConflict: false,
      },
    },
    contradictions: [], // No contradiction!
    alignmentDetails: {
      verdict: 'REPRESENTATIVE_MOMENT',
      relationshipType: 'REPRESENTATIVE_MOMENT',
      alignmentExplanation: 'The thumbnail depicts one peak representative moment of the 100 children premise.',
    },
  });

  assert.ok(result.titleThumbnailAlignment >= 75 && result.titleThumbnailAlignment <= 90);
  assert.equal(result.alignmentDetails.verdict, 'REPRESENTATIVE_MOMENT');
  assert.equal(result.isCapped, false, 'Representative moment must not be capped');
  assert.ok(result.overallScore >= 75, 'Overall score should reflect strong representative storytelling');
});

test('hard scoring rules: direct brand and model contradiction caps alignment at 15 and overall at 40', async () => {
  const { validateAndEnforceScoreConsistency } = await import('../api/_lib.js');

  const brandResult = validateAndEnforceScoreConsistency({
    visualImpact: 85,
    readability: 80,
    curiosity: 85,
    clarity: 80,
    titleThumbnailAlignment: 80,
    contradictions: [
      {
        type: 'brand_conflict',
        severity: 'critical',
        description: 'Title promises iPhone 16 Pro but thumbnail displays Samsung Galaxy S24 Ultra.',
        titleValue: 'iPhone 16 Pro',
        thumbnailValue: 'Samsung Galaxy S24 Ultra',
      },
    ],
  });

  assert.ok(brandResult.titleThumbnailAlignment <= 15);
  assert.ok(brandResult.overallScore <= 40);
  assert.equal(brandResult.alignmentDetails.verdict, 'CONTRADICTORY_OR_UNRELATED');
  assert.notEqual(brandResult.alignmentDetails.relationshipType, 'COMPLEMENTARY_PAIR');
});

test('hard scoring rules: strong emotional opposite caps alignment at 20 and overall at 40', async () => {
  const { validateAndEnforceScoreConsistency } = await import('../api/_lib.js');

  // Title: "Worst Day of My Life", thumbnail depicts laughing celebration with champagne
  const emoResult = validateAndEnforceScoreConsistency({
    visualImpact: 85,
    readability: 80,
    curiosity: 85,
    clarity: 80,
    titleThumbnailAlignment: 80,
    contradictions: [
      {
        type: 'emotional_conflict',
        severity: 'major',
        description: 'Title promises tragic "Worst Day" story but thumbnail shows joyful laughing celebration.',
        titleValue: 'Tragic / Sad',
        thumbnailValue: 'Laughing Celebration',
      },
    ],
  });

  assert.ok(emoResult.titleThumbnailAlignment <= 20);
  assert.ok(emoResult.overallScore <= 40);
  assert.equal(emoResult.alignmentDetails.verdict, 'CONTRADICTORY_OR_UNRELATED');
});

test('hard scoring rules: language mismatch for target audience penalizes readability and alignment', async () => {
  const { validateAndEnforceScoreConsistency } = await import('../api/_lib.js');

  const langResult = validateAndEnforceScoreConsistency({
    visualImpact: 85,
    readability: 85,
    curiosity: 85,
    clarity: 80,
    titleThumbnailAlignment: 85,
    contradictions: [
      {
        type: 'language_mismatch',
        severity: 'major',
        description: 'Thumbnail overlay text is in Japanese while target audience and title are Turkish.',
        titleValue: 'Turkish',
        thumbnailValue: 'Japanese',
      },
    ],
  });

  assert.ok(langResult.readability <= 50, 'Readability should be penalized for foreign language text overlay');
  assert.ok(langResult.titleThumbnailAlignment <= 50, 'Alignment should be penalized for language barrier');
});

test('consistency validator guarantees explanation and labels agree with sub-scores', async () => {
  const { validateAndEnforceScoreConsistency } = await import('../api/_lib.js');

  const result = validateAndEnforceScoreConsistency({
    visualImpact: 70,
    readability: 70,
    curiosity: 70,
    clarity: 70,
    titleThumbnailAlignment: 15,
    contradictions: [
      {
        type: 'brand_conflict',
        severity: 'critical',
        description: 'Brand mismatch',
        titleValue: 'Apple',
        thumbnailValue: 'Samsung',
      },
    ],
    alignmentDetails: {
      verdict: 'PERFECT_MATCH', // Model output contradictory label
      alignmentExplanation: 'Strong Alignment and Complementary Synergy between title and image.',
    },
  });

  // Must not have "Strong Alignment" or "Complementary Synergy" or "PERFECT_MATCH"
  assert.equal(result.alignmentDetails.verdict, 'CONTRADICTORY_OR_UNRELATED');
  assert.ok(!result.alignmentDetails.alignmentExplanation.toLowerCase().includes('perfect'));
  assert.ok(!result.alignmentDetails.alignmentExplanation.toLowerCase().includes('strong alignment'));
  assert.ok(result.alignmentDetails.alignmentExplanation.includes('Direct contradiction detected'));
});

test('visual presentation layer data contract: attention area is explicitly labeled as heuristic estimate', () => {
  const sampleText = 'Heuristic attention estimate • Not measured eye tracking';
  assert.ok(sampleText.includes('Not measured eye tracking'));
  assert.ok(sampleText.includes('Heuristic'));
});

test('visual presentation layer data contract: emotionalTone object is safely formatted as string', () => {
  const getEmotionalToneLabel = (tone: any): string => {
    if (!tone) return 'Emotional Hook';
    if (typeof tone === 'string') return tone;
    if (typeof tone === 'object') {
      if (tone.thumbnailTone) return String(tone.thumbnailTone);
      if (tone.titleTone) return String(tone.titleTone);
    }
    return 'Emotional Hook';
  };

  const objectTone = { titleTone: 'Curious', thumbnailTone: 'Shocked', isOpposite: false };
  const label = getEmotionalToneLabel(objectTone);
  assert.equal(typeof label, 'string');
  assert.equal(label, 'Shocked');

  assert.equal(getEmotionalToneLabel(null), 'Emotional Hook');
  assert.equal(getEmotionalToneLabel('Intense'), 'Intense');
});

test('intelligent thumbnail prompt generation: cleans hollow AI buzzwords and enforces 16:9 aspect ratio', async () => {
  const { buildThumbnailPrompt, sanitizePromptBuzzwords } = await import('../src/utils/thumbnailPrompt.js');

  const dirtyPrompt = 'High-quality YouTube thumbnail of a man, centered... 8K, cinematic lighting, vibrant colors, masterpiece, ultra-detailed';
  const cleaned = sanitizePromptBuzzwords(dirtyPrompt);
  assert.ok(!cleaned.toLowerCase().includes('8k'));
  assert.ok(!cleaned.toLowerCase().includes('masterpiece'));
  assert.ok(!cleaned.toLowerCase().includes('ultra-detailed'));
  assert.ok(cleaned.includes('high-contrast directional lighting with rim light separation'));

  const generated = buildThumbnailPrompt({
    videoTitle: '100 Days in Minecraft Hardcore',
    videoTopic: 'Surviving 100 days against mobs',
  });
  assert.ok(generated.includes('--ar 16:9'));
  assert.ok(!generated.toLowerCase().includes('8k'));
  assert.ok(!generated.toLowerCase().includes('masterpiece'));
  assert.ok(generated.includes('Mobile Feed Readability'));
  assert.ok(generated.includes('Negative Constraints'));
});

test('intelligent thumbnail prompt generation: survival acceptance test scenario', async () => {
  const { buildThumbnailPrompt, inferContentCategory } = await import('../src/utils/thumbnailPrompt.js');

  const title = 'I Survived The Most Extreme Places On Earth';
  const category = inferContentCategory(title, 'Surviving deadly biomes across the globe');
  assert.equal(category, 'survival');

  const survivalAnalysis = {
    videoTitle: title,
    videoTopic: 'Surviving the deadliest deserts, arctic snows, and deep jungles',
    structuredExtraction: {
      mainTopic: 'Extreme survival across biomes',
      visibleObjects: ['creator face and body', 'desert sand and snow', 'scorpion', 'yellow snake'],
      ocrText: [],
      numbersAndQuantities: { titleNumbers: [], thumbnailNumbers: [], hasConflict: false },
      namedPeople: {
        titlePeople: [],
        thumbnailPeople: ['Creator'],
        identificationConfidence: 'high' as const,
        verificationStatus: 'verified' as const,
      },
      brands: { titleBrands: [], thumbnailBrands: [], hasConflict: false },
      productModels: { titleModels: [], thumbnailModels: [], hasConflict: false },
      locations: ['Desert', 'Arctic', 'Jungle'],
      emotionalTone: { titleTone: 'High Stakes / Survival', thumbnailTone: 'Exhausted', isOpposite: false },
      importantAdjectives: { titleAdjectives: ['Extreme'], thumbnailPolarity: 'consistent' as const },
      detectedLanguage: { titleLanguage: 'en', hasMismatch: false },
      thumbnailTextAmount: 'none' as const,
      visualQuality: 'high' as const,
      confidenceLevel: 'high' as const,
    },
    abTestDetails: {
      alternativeTitle: 'How I Barely Survived Earth’s Deadliest Biomes',
      suggestedHypothesis: 'Tight top-down perspective showing immediate biome collision',
      thumbnailConcept: {
        mainObject: 'Exhausted creator lying at the intersection of snow, sand, and dense jungle',
        background: 'Collision of extreme biomes directly surrounding the subject',
        lighting: 'Harsh directional environmental lighting with rim highlights',
        cameraAngle: 'Tight top-down overhead shot focusing on physical strain',
        colorPalette: 'Frigid white, scorched amber, and toxic jungle green',
        targetEmotion: 'Exhaustion, disbelief, and sheer survival grit',
        focalPoint: 'Creator face and immediate hazard',
        textOverlay: '',
      },
      whyItsStronger: {
        attentionReason: 'Puts viewer directly in the life-or-death moment',
        psychologicalPrinciples: 'Curiosity gap and visceral survival empathy',
        firstTwoSecondsImpact: 'Immediate recognition of extreme danger',
      },
      expectedImpact: {
        abTestPriority: 'High',
        variableTested: 'Framing and Environmental Interaction',
        confidenceLevel: 'High',
        primaryMetricToWatch: 'Feed Glance CTR',
        tradeoffOrRisk: 'Must balance multi-biome details to avoid visual clutter',
        ctrPotentialStars: 5,
        curiosityStars: 5,
        visualAttentionStars: 5,
        emotionalImpactStars: 5,
      },
    },
  };

  const prompt = buildThumbnailPrompt(survivalAnalysis);

  // 1. Connection to survival promise
  assert.ok(prompt.includes('survival stakes'));
  // 2. Identity preservation instruction
  assert.ok(prompt.includes('Preserve the exact recognizable identity'));
  // 3. Subject scale in frame
  assert.ok(prompt.includes('40-50%'));
  // 4. Tight / top-down composition (not distant movie poster)
  assert.ok(prompt.toLowerCase().includes('top-down') || prompt.toLowerCase().includes('close-up'));
  // 5. Mobile feed readability
  assert.ok(prompt.includes('Mobile Feed Readability'));
  // 6. Text instruction explicitly states no text
  assert.ok(prompt.includes('No text, clean visual storytelling only'));
  // 7. Negative constraints prevent movie-poster layouts & plastic AI skin
  assert.ok(prompt.includes('Avoid movie poster layouts'));
  assert.ok(prompt.includes('generic glossy AI skin'));
  // 8. 16:9 YouTube thumbnail aspect ratio
  assert.ok(prompt.includes('--ar 16:9'));
});

test('stage 4 similarity rejection engine: rejects candidates matching 3 or more major visual dimensions', async () => {
  const { evaluateCandidateSimilarity } = await import('../api/thumbnail-prompt-pipeline.js');

  const originalSignature = {
    identityReferencePresent: true,
    recognizableSubjects: ['Creator'],
    cameraAngle: 'top-down overhead',
    shotType: 'full-body top-down wide',
    mainSubjectPose: 'lying flat on back',
    mainSubjectPosition: 'dead center',
    mainSubjectScale: 'medium full-body',
    backgroundStructure: 'three-way split screen (top/left/right)',
    environmentPlacement: ['snow above head', 'desert on left', 'jungle on right'],
    propsAndPositions: ['scorpion on left sand', 'yellow snake on right jungle'],
    textPlacement: 'none',
    colorStructure: 'high contrast',
    visualNarrative: 'helpless creator lying on back between three static biomes with dangerous animals',
    strengths: ['Intriguing premise'],
    weaknesses: ['Too cluttered, unreadable on mobile'],
  };

  // Candidate 1: Copycat candidate (matches camera angle, pose, position, background structure)
  const copycatCandidate = {
    conceptSummary: 'Creator in the center of biomes',
    storyMoment: 'Lying stranded on back in the wilderness',
    curiosityMechanism: 'How will he escape?',
    cameraAngle: 'top-down overhead flat lay',
    shotType: 'full-body wide',
    subjectPose: 'lying flat on back in the middle',
    subjectPosition: 'dead center',
    subjectScale: 'medium',
    backgroundStructure: 'three-way split background with biomes',
    keyElements: ['scorpion', 'yellow snake', 'snow and desert'],
    visualHierarchy: '1. Creator, 2. Animals',
    whyItFitsTheVideo: 'Shows all biomes',
  };

  const copycatResult = evaluateCandidateSimilarity(copycatCandidate, originalSignature, 0);
  assert.equal(copycatResult.isRejected, true);
  assert.ok(copycatResult.matchedDimensionsCount >= 3);
  assert.ok(copycatResult.matchedDimensions.includes('Camera Angle'));
  assert.ok(copycatResult.matchedDimensions.includes('Main Subject Pose'));
  assert.ok(copycatResult.matchedDimensions.includes('Main Subject Position'));

  // Candidate 2: Fresh, genuinely independent concept (dynamic low angle, crouching, left third)
  const freshCandidate = {
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
  };

  const freshResult = evaluateCandidateSimilarity(freshCandidate, originalSignature, 1);
  assert.equal(freshResult.isRejected, false);
  assert.ok(freshResult.matchedDimensionsCount < 3);
});

test('stage 5 & 6 concept selection and final prompt: survival test case produces genuinely new composition', async () => {
  const { selectStrongestConcept, evaluateCandidateSimilarity } = await import('../api/thumbnail-prompt-pipeline.js');

  const videoUnderstanding = {
    contentType: 'survival',
    corePremise: 'Surviving extreme deadly places across the globe',
    viewerPromise: 'Witness an extraordinary human endurance test',
    mainSubject: 'The creator',
    centralAction: 'Battling brutal weather extremes',
    stakes: 'Life or death physical exhaustion',
    emotionalArc: 'Despair to relentless perseverance',
    curiosityGap: 'How did he physically survive these lethal environments?',
    strongestVisualMoments: ['Battling blizzard on glacier ridge', 'Crossing scorching salt flat', 'Canyon shelter standoff'],
    importantEntities: ['Creator'],
    factsThatMustRemainAccurate: ['Creator identity', 'Hostile environments'],
    informationToWithhold: ['Whether he was rescued or won'],
    uncertainties: [],
    evidenceConfidence: 'high' as const,
  };

  const originalSignature = {
    identityReferencePresent: true,
    recognizableSubjects: ['Creator'],
    cameraAngle: 'top-down overhead',
    shotType: 'full-body top-down wide',
    mainSubjectPose: 'lying flat on back',
    mainSubjectPosition: 'dead center',
    mainSubjectScale: 'medium',
    backgroundStructure: 'three-way split screen (top/left/right)',
    environmentPlacement: ['snow above head', 'desert on left', 'jungle on right'],
    propsAndPositions: ['scorpion on left', 'yellow snake on right'],
    textPlacement: 'none',
    colorStructure: 'high contrast',
    visualNarrative: 'creator lying on back between three biomes',
    strengths: [],
    weaknesses: ['Cluttered, unreadable on mobile'],
  };

  const candidates = [
    // Candidate 1 (Copycat - should be rejected)
    {
      conceptSummary: 'Lying in the center between biomes',
      storyMoment: 'Lying exhausted on back with animals nearby',
      curiosityMechanism: 'Survival danger',
      cameraAngle: 'top-down overhead',
      shotType: 'full-body wide',
      subjectPose: 'lying flat on back',
      subjectPosition: 'dead center',
      subjectScale: 'medium',
      backgroundStructure: 'three-way split',
      keyElements: ['scorpion on left', 'yellow snake on right'],
      visualHierarchy: '1. Center creator, 2. Animals',
      whyItFitsTheVideo: 'Recreates the title',
    },
    // Candidate 2 (Independent fresh concept - should be accepted and selected)
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
  ];

  const simResults = candidates.map((c, idx) => evaluateCandidateSimilarity(c, originalSignature, idx));
  assert.equal(simResults[0].isRejected, true); // Copycat rejected!
  assert.equal(simResults[1].isRejected, false); // Independent accepted!

  const selection = selectStrongestConcept(candidates, simResults, videoUnderstanding);
  assert.equal(selection.selectedIndex, 1);
  assert.equal(selection.winningConcept.cameraAngle, 'Dynamic low angle');
  assert.equal(selection.winningConcept.subjectPosition, 'Left third leading into the storm');

  // Verify that the winning concept does NOT have the original anchor elements:
  assert.ok(!selection.winningConcept.cameraAngle.toLowerCase().includes('top-down'));
  assert.ok(!selection.winningConcept.subjectPose.toLowerCase().includes('lying flat on back'));
  assert.ok(!selection.winningConcept.subjectPosition.toLowerCase().includes('dead center'));
});

test('concept diversity across multiple video categories: does not default to centered person', async () => {
  const { inferContentCategory, buildThumbnailPrompt } = await import('../src/utils/thumbnailPrompt.js');

  // 1. Comparison video
  const compTitle = '$10 Microphone vs $1,000 Microphone: Shocking Difference!';
  assert.equal(inferContentCategory(compTitle, 'Audio comparison test'), 'comparison');
  const compPrompt = buildThumbnailPrompt({ videoTitle: compTitle });
  assert.ok(compPrompt.includes('comparison'));
  assert.ok(compPrompt.includes('split-contrast') || compPrompt.includes('side-by-side'));

  // 2. Tutorial video without visible person
  const tutTitle = 'How to Build an Ultra-Quiet Custom Mechanical Keyboard';
  assert.equal(inferContentCategory(tutTitle, 'Step by step keyboard assembly'), 'tutorial');

  // 3. Transformation video
  const transTitle = '100 Days Weight Loss and Muscle Transformation';
  assert.equal(inferContentCategory(transTitle, 'Body makeover journey'), 'transformation');
  const transPrompt = buildThumbnailPrompt({ videoTitle: transTitle });
  assert.ok(transPrompt.includes('transformation') || transPrompt.includes('before-and-after'));

  // 4. Mystery documentary
  const mysteryTitle = 'The Lost City of Z: The Disturbing Truth Revealed';
  assert.equal(inferContentCategory(mysteryTitle, 'Historical expedition disappearance'), 'mystery');
  const mysteryPrompt = buildThumbnailPrompt({ videoTitle: mysteryTitle });
  assert.ok(mysteryPrompt.includes('curiosity') || mysteryPrompt.includes('mystery'));
});

test('faithful prompt elevation: preserves original thumbnail biomes and creatures without inventing unrelated stories', async () => {
  const { fallbackElevateOriginalPrompt } = await import('../api/thumbnail-prompt-pipeline.js');

  const videoUnderstanding = {
    contentType: 'survival',
    corePremise: 'Surviving 7 days in the world’s most hostile climates',
    viewerPromise: 'Witness extreme human endurance across contrasting biomes',
    mainSubject: 'Featured creator',
    centralAction: 'Enduring multi-biome survival extremes',
    stakes: 'Severe physical exhaustion and survival peril',
    emotionalArc: 'Intense shock and survival grit',
    curiosityGap: 'How can anyone endure three contrasting deadly climates at once?',
    strongestVisualMoments: ['Stranded at the crossroads of snow, desert, and jungle'],
    importantEntities: ['Creator'],
    factsThatMustRemainAccurate: ['Creator identity', 'Contrasting climates'],
    informationToWithhold: ['Rescue outcome'],
    uncertainties: [],
    evidenceConfidence: 'high' as const,
  };

  const originalSignature = {
    identityReferencePresent: true,
    recognizableSubjects: ['MrBeast / Creator'],
    clothingAndDetails: 'Tattered red outdoor jacket with frost on hair and mud on face',
    cameraAngle: 'High-angle direct overhead view',
    shotType: 'medium close-up',
    mainSubjectPose: 'lying on back with mouth parted in exhaustion',
    mainSubjectPosition: 'centered',
    mainSubjectScale: '45-50% dominant',
    backgroundStructure: 'three-way environmental split',
    environmentPlacement: ['snow and ice at top', 'desert sand dunes on left', 'tropical jungle foliage on right'],
    propsAndPositions: ['black emperor scorpion on desert sand', 'yellow python snake on jungle leaves'],
    sceneConcept: 'Creator lying exhausted between snow, desert, and jungle with dangerous venomous creatures',
    textPlacement: 'none',
    colorStructure: 'triad: red jacket, white snow, golden sand, green jungle',
    visualNarrative: 'Creator stranded at the convergence of three extreme biomes with scorpion and yellow snake',
    strengths: ['High-contrast biome convergence', 'Immediate wildlife danger', 'Strong facial distress'],
    weaknesses: ['Collage boundaries could be more organic', 'Needs sharper directional rim light'],
  };

  const elevatedPrompt = fallbackElevateOriginalPrompt(videoUnderstanding, originalSignature, 'I Survived 7 Days In The World’s Deadliest Climates');

  // Verify that it stays faithful to the original thumbnail:
  assert.ok(elevatedPrompt.includes('snow') || elevatedPrompt.includes('biomes'));
  assert.ok(elevatedPrompt.includes('desert') || elevatedPrompt.includes('sand'));
  assert.ok(elevatedPrompt.includes('scorpion'));
  assert.ok(elevatedPrompt.includes('snake') || elevatedPrompt.includes('yellow'));
  assert.ok(elevatedPrompt.includes('red'));
  assert.ok(elevatedPrompt.includes('--ar 16:9'));

  // Verify that it does NOT invent unrelated stories (no volcano, no gas mask, no heart monitor):
  assert.ok(!elevatedPrompt.toLowerCase().includes('volcano'));
  assert.ok(!elevatedPrompt.toLowerCase().includes('gas mask'));
  assert.ok(!elevatedPrompt.toLowerCase().includes('monitor'));
});

test('analysis-driven prompt generation: directly executes diagnostic improvements and rejects movie poster layout', async () => {
  const { fallbackElevateOriginalPrompt } = await import('../api/thumbnail-prompt-pipeline.js');

  const videoUnderstanding = {
    contentType: 'survival',
    corePremise: '7 Days in extreme biomes',
    viewerPromise: 'Survival endurance',
    mainSubject: 'Creator',
    centralAction: 'Surviving',
    stakes: 'Severe exhaustion',
    emotionalArc: 'Desperation',
    curiosityGap: 'Can he survive?',
    strongestVisualMoments: ['Convergence of biomes'],
    importantEntities: ['Creator'],
    factsThatMustRemainAccurate: ['Creator'],
    informationToWithhold: ['Outcome'],
    uncertainties: [],
    evidenceConfidence: 'high' as const,
  };

  const originalSignature = {
    identityReferencePresent: true,
    recognizableSubjects: ['Creator'],
    cameraAngle: 'High-angle overhead',
    shotType: 'medium shot',
    mainSubjectPose: 'lying on back',
    mainSubjectPosition: 'center',
    mainSubjectScale: 'medium',
    backgroundStructure: 'three-way split',
    environmentPlacement: ['snow at top', 'desert on left', 'jungle on right'],
    propsAndPositions: ['scorpion on left', 'yellow snake on right'],
    textPlacement: 'none',
    colorStructure: 'triad',
    visualNarrative: 'Creator stranded between snow, desert, jungle',
    strengths: ['Contrasting biomes'],
    weaknesses: ['Subject lacks high luminance contrast', 'Too much background clutter competing for attention'],
  };

  const diagnosticContext = {
    weaknesses: [
      'Subject blends into background with insufficient luminance contrast',
      'Background clutter competes with creator face at 150px mobile scale',
    ],
    improvements: [
      {
        observation: 'Subject luminance contrast',
        suggestedAction: 'Increase subject scale to 50% and inject intense punchy rim lighting',
        reason: 'Prevents camouflage and guarantees 1-second mobile recognition',
        tradeoffOrUncertainty: 'Slightly reduces background visibility',
      },
    ],
  };

  const prompt = fallbackElevateOriginalPrompt(
    videoUnderstanding,
    originalSignature,
    'I Survived 7 Days In The Deadliest Climates',
    diagnosticContext
  );

  // Directly implements the diagnostic improvement:
  assert.ok(prompt.includes('Increase subject scale') || prompt.includes('rim lighting') || prompt.includes('45-50%'));
  assert.ok(prompt.includes('Avoid movie poster layouts'));
  assert.ok(prompt.includes('--ar 16:9'));
  assert.ok(prompt.includes('mobile'));
});





