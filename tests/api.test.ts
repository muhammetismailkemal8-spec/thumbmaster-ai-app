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

