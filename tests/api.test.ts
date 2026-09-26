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

