import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * ============================================================================
 * ENVIRONMENT VARIABLES
 * ============================================================================
 * - GEMINI_API_KEY: (Required) Google Gemini API Key for AI analysis and blueprint generation.
 * - SUPABASE_URL: (Optional/Required for Auth) Supabase project URL.
 * - SUPABASE_ANON_KEY: (Optional/Required for Auth) Supabase public anonymous API key.
 * - ALLOWED_ORIGIN: (Optional) Production CORS origin (e.g., https://thumbmaster.app).
 * - NODE_ENV: 'production' | 'development'.
 * ============================================================================
 */

export interface AuthUser {
  id: string;
  email?: string;
  tier?: 'free' | 'pro';
}

export interface RateLimitRecord {
  count: number;
  resetTime: number; // Timestamp in ms (Midnight UTC)
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitRecord | undefined> | RateLimitRecord | undefined;
  set(key: string, record: RateLimitRecord): Promise<void> | void;
  increment(key: string, resetTime: number): Promise<RateLimitRecord> | RateLimitRecord;
}

class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitRecord>();

  get(key: string): RateLimitRecord | undefined {
    return this.store.get(key);
  }

  set(key: string, record: RateLimitRecord): void {
    this.store.set(key, record);
  }

  increment(key: string, resetTime: number): RateLimitRecord {
    const existing = this.store.get(key);
    const now = Date.now();

    if (!existing || now > existing.resetTime) {
      const newRecord: RateLimitRecord = { count: 1, resetTime };
      this.store.set(key, newRecord);
      return newRecord;
    }

    existing.count += 1;
    this.store.set(key, existing);
    return existing;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

export const rateLimitStore = new InMemoryRateLimitStore();

export function getNextMidnightUtc(): number {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}

export const TIER_LIMITS: Record<string, { unauthenticated: number; free: number; pro: number }> = {
  '/api/analyze-thumbnail': {
    unauthenticated: 30, // Free daily trial quota per IP
    free: 50,            // Authenticated free user
    pro: 200,           // Authenticated Pro user
  },
  '/api/generate-thumbnail-concept': {
    unauthenticated: 30, // Free daily trial quota per IP
    free: 50,            // Authenticated free user
    pro: 200,           // Authenticated Pro user
  },
  '/api/generate-thumbnail': {
    unauthenticated: 30, // Free daily trial quota per IP
    free: 50,            // Authenticated free user
    pro: 200,           // Authenticated Pro user
  },
};

// ============================================================================
// SUPABASE CLIENT & AUTH
// ============================================================================
let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

export async function verifyAuthHeader(authHeader?: string): Promise<{ user?: AuthUser; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: undefined };
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return { user: undefined };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { user: undefined };
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return { error: 'Unauthorized: Invalid or expired authentication token.' };
    }

    const userMetadata = data.user.user_metadata || {};
    const tier: 'free' | 'pro' = userMetadata.tier === 'pro' ? 'pro' : 'free';

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        tier,
      },
    };
  } catch (err) {
    console.error('Supabase authentication error:', err);
    return { error: 'Unauthorized: Failed to authenticate token.' };
  }
}

// ============================================================================
// CORS & BODY PARSER
// ============================================================================
export function handleCors(req: any, res: any): boolean {
  const origin = (req.headers?.origin || req.headers?.Origin || '') as string;
  const configuredOrigins = [process.env.ALLOWED_ORIGIN, process.env.APP_URL]
    .filter(Boolean)
    .flatMap((value) => value!.split(','))
    .map((value) => value.trim().replace(/\/$/, ''));

  if (origin) {
    let originHost = '';
    try {
      originHost = new URL(origin).host;
    } catch {
      res.status(400).json({ success: false, error: 'Invalid request origin.' });
      return true;
    }

    const requestHost = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '').split(',')[0].trim();
    const isSameOrigin = Boolean(requestHost && originHost === requestHost);
    const isConfiguredOrigin = configuredOrigins.includes(origin.replace(/\/$/, ''));
    const isLocalDevelopment = process.env.NODE_ENV !== 'production' && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(originHost);

    if (!isSameOrigin && !isConfiguredOrigin && !isLocalDevelopment) {
      res.status(403).json({ success: false, error: 'Origin not allowed.' });
      return true;
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    try {
      return JSON.parse(req.body);
    } catch {
      throw new Error('Invalid JSON payload');
    }
  }

  // Stream fallback if body has not been parsed by serverless runtime
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
      if (raw.length > 4 * 1024 * 1024) {
        reject(new Error('Request payload too large'));
        req.destroy?.();
      }
    });
    req.on('end', () => {
      if (!raw || raw.trim().length === 0) {
        return resolve({});
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

export function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return (
    req.headers?.['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    req.ip ||
    'unknown-ip'
  );
}

// ============================================================================
// SANITIZATION & PROMPT INJECTION DEFENSE
// ============================================================================
export function sanitizeString(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

export const FORBIDDEN_PROMPT_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions?/i,
  /ignore\s+(?:all\s+)?rules/i,
  /system\s+prompt/i,
  /api[_\s-]*key/i,
  /\bgemini\b/i,
  /you\s+are\s+now\b/i,
  /\bact\s+as\b/i,
  /\bdisregard\b/i,
  /jailbreak/i,
  /reveal\s+(?:all\s+)?instructions/i,
];

export function sanitizeForPrompt(input: string): { isValid: boolean; sanitized: string } {
  if (!input) return { isValid: true, sanitized: '' };

  for (const pattern of FORBIDDEN_PROMPT_PATTERNS) {
    if (pattern.test(input)) {
      return { isValid: false, sanitized: '' };
    }
  }

  const cleaned = input.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '');
  return { isValid: true, sanitized: cleaned };
}

export function validateAndParseBase64Image(imageBase64: unknown): { mimeType: string; data: string } | null {
  if (typeof imageBase64 !== 'string' || !imageBase64) return null;
  // Keep the complete JSON request comfortably below Vercel's serverless body limit.
  if (imageBase64.length > 3.5 * 1024 * 1024) return null;

  const matches = imageBase64.match(/^data:(image\/(jpeg|png|webp|jpg));base64,([A-Za-z0-9+/=]+)$/);
  if (!matches || matches.length !== 4) return null;

  const mimeType = matches[1] === 'image/jpg' ? 'image/jpeg' : matches[1];
  const data = matches[3];
  const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
  const decodedBytes = Math.floor((data.length * 3) / 4) - padding;
  if (decodedBytes > 2.5 * 1024 * 1024) return null;
  return { mimeType, data };
}

export function normalizeCategoryScore(val: unknown, defaultValue = 50): number {
  if (val === null || val === undefined) return defaultValue;
  let num: number;
  if (typeof val === 'number') {
    num = val;
  } else if (typeof val === 'string') {
    num = parseFloat(val);
  } else {
    return defaultValue;
  }
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return defaultValue;
  }
  return Math.max(0, Math.min(100, Math.round(num)));
}

export function calculateCtrGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export function cleanAndParseJson(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }
  return JSON.parse(cleaned);
}

export function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GenAIFallbackOptions {
  systemInstruction?: string;
  contents: any;
  responseSchema?: any;
  responseMimeType?: string;
}

export async function generateContentWithFallback(
  ai: GoogleGenAI,
  options: GenAIFallbackOptions,
  operationName: string
): Promise<string> {
  const candidateModels: Array<{ model: string; thinkingLevel?: ThinkingLevel }> = [
    { model: 'gemini-3.8-flash', thinkingLevel: ThinkingLevel.LOW },
    { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
    { model: 'gemini-flash-latest', thinkingLevel: undefined },
  ];

  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const { model, thinkingLevel } = candidateModels[i];
    try {
      const config: any = {};
      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }
      if (options.responseSchema) {
        config.responseSchema = options.responseSchema;
      }
      if (thinkingLevel !== undefined) {
        config.thinkingConfig = { thinkingLevel };
      }

      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config,
      });

      const text = response.text;
      if (text && text.trim().length > 0) {
        return text.trim();
      }
      throw new Error(`Model ${model} returned an empty text payload.`);
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || 'unknown';
      console.warn(`[${operationName}] Model ${model} failed (status: ${status}): ${err?.message}`);
      if (i < candidateModels.length - 1) {
        console.warn(`[${operationName}] Switching to fallback model: ${candidateModels[i + 1].model}...`);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
  }

  throw lastError;
}

// ============================================================================
// HANDLER 1: /api/analyze-thumbnail
// ============================================================================
export async function handleAnalyzeThumbnailRequest(req: any, res: any) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const authResult = await verifyAuthHeader(authHeader);
    if (authResult.error) {
      return res.status(401).json({ success: false, error: authResult.error });
    }

    const user = authResult.user;
    const endpointPath = '/api/analyze-thumbnail';
    const limits = TIER_LIMITS[endpointPath];

    let key: string;
    let allowedLimit: number;

    if (user && user.id) {
      key = `user:${user.id}:${endpointPath}`;
      allowedLimit = user.tier === 'pro' ? limits.pro : limits.free;
    } else {
      const clientIp = getClientIp(req);
      key = `ip:${clientIp}:${endpointPath}`;
      allowedLimit = limits.unauthenticated;
    }

    const nextMidnight = getNextMidnightUtc();
    const existing = await rateLimitStore.get(key);
    const now = Date.now();

    if (existing && now <= existing.resetTime && existing.count >= allowedLimit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
      return res.status(429).json({
        success: false,
        error: user
          ? `Daily quota reached (${existing.count}/${allowedLimit} requests). Quota resets at midnight UTC.`
          : `Unauthenticated daily limit reached (${existing.count}/${allowedLimit} requests). Please sign in for higher daily limits.`,
        retryAfter: retryAfterSeconds,
        quota: {
          remaining: 0,
          limit: allowedLimit,
          resetAt: new Date(existing.resetTime).toISOString(),
        },
      });
    }

    // Body parsing
    let body: any;
    try {
      body = await parseBody(req);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid JSON body in request.' });
    }

    const rawTitle = sanitizeString(body.videoTitle, 300);
    const rawTopic = sanitizeString(body.videoTopic, 2000);
    const rawAudience = sanitizeString(body.targetAudience, 200);
    const rawCategory = sanitizeString(body.category, 200);
    const rawImage = body.imageBase64;

    if (!rawTitle || !rawTopic) {
      return res.status(400).json({ success: false, error: 'Video title and topic are required.' });
    }

    // Prompt injection safety checks
    const titleCheck = sanitizeForPrompt(rawTitle);
    const topicCheck = sanitizeForPrompt(rawTopic);
    const audienceCheck = sanitizeForPrompt(rawAudience);
    const categoryCheck = sanitizeForPrompt(rawCategory);

    if (!titleCheck.isValid || !topicCheck.isValid || !audienceCheck.isValid || !categoryCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input detected: Disallowed instructions or keywords found in your request.',
      });
    }

    const videoTitle = titleCheck.sanitized;
    const videoTopic = topicCheck.sanitized;
    const targetAudience = audienceCheck.sanitized;
    const category = categoryCheck.sanitized;

    const parsedImage = rawImage ? validateAndParseBase64Image(rawImage) : null;
    if (rawImage && !parsedImage) {
      return res.status(400).json({
        success: false,
        error: 'Invalid thumbnail image. Please upload a valid JPEG, PNG, or WEBP file.',
      });
    }

    const ai = getGenAIClient();

    const systemInstruction = `You are one of the world's best YouTube thumbnail and title optimization experts (a senior CTR director familiar with the psychological strategies of top creators like MrBeast, Veritasium, Kurzgesagt, Ali Abdaal, and Cleo Abram).
Your job is to analyze the uploaded thumbnail and video title to evaluate its CTR potential and create an actionable optimization proposal.

CRITICAL SCORING RULES:
You must return 5 separate numeric category scores on a strict 0 to 100 scale:
1. visualImpact (0-100, 20% weight): Visual punch, contrast, saturation, lighting, subject separation, focal dominance, and color vibrancy.
2. readability (0-100, 15% weight): Text legibility, font weight, contrast against background, and how quickly it reads on small mobile screens. (If no text is used, evaluate how clearly the visual subject communicates without text).
3. curiosity (0-100, 20% weight): Curiosity gap, intrigue, emotion, and viewer desire to click without misleading clickbait.
4. clarity (0-100, 15% weight): Cognitive ease, clean composition, lack of visual clutter, and instant comprehension within 500ms.
5. titleThumbnailAlignment (0-100, 30% weight): Objective thematic, narrative, and contextual match between what is visually shown in the thumbnail and what the video title and topic actually promise.
   - MANDATORY STRICTNESS RULE: If the thumbnail depicts imagery completely unrelated or contradictory to the video title (for example, a survival scenario with scorpions/snakes for a title about fulfilling children's dreams, or gaming graphics for a personal finance video), you MUST score titleThumbnailAlignment strictly between 0 and 25.
   - Do NOT give high alignment if the imagery belongs to a completely different video topic.
   - High scores (75-100) are reserved strictly for thumbnails that visually reinforce the exact premise and promise of the video title.

DO NOT invent or return an overall CTR score or grade. The backend calculation engine deterministically computes the overall CTR score and grade using your 5 category scores.

CRITICAL LANGUAGE RULE: You MUST provide all generated explanations, titles, summaries, feedback points, blueprints, and step-by-step guides in ENGLISH.`;

    let userPrompt = `Video Title: "${videoTitle.replace(/"/g, '\\"')}"
Video Topic / Summary: "${videoTopic.replace(/"/g, '\\"')}"
Target Audience: "${targetAudience || 'General YouTube Audience'}"
Category / Niche: "${category || 'General'}"`;

    const parts: any[] = [];

    if (parsedImage) {
      parts.push({
        inlineData: {
          mimeType: parsedImage.mimeType,
          data: parsedImage.data,
        },
      });
      userPrompt += `\n\nAnalyze the uploaded YouTube thumbnail image above and evaluate its alignment with this video topic/title, mobile readability, color contrast, facial expression, and clickability. Then generate a complete A/B test proposal.`;
    } else {
      userPrompt += `\n\nNo thumbnail image was uploaded. Based on the video title and topic, detail potential risks of current concepts and explain what kind of thumbnail should be created, along with a full A/B test proposal.`;
    }

    parts.push({ text: userPrompt });

    const resultText = await generateContentWithFallback(
      ai,
      {
        systemInstruction,
        contents: { parts },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualImpact: { type: Type.NUMBER, description: 'Visual impact & contrast score between 0 and 100' },
            readability: { type: Type.NUMBER, description: 'Readability score between 0 and 100' },
            curiosity: { type: Type.NUMBER, description: 'Curiosity gap score between 0 and 100' },
            clarity: { type: Type.NUMBER, description: 'Clarity and composition score between 0 and 100' },
            titleThumbnailAlignment: { type: Type.NUMBER, description: 'Title-thumbnail semantic alignment score between 0 and 100. Must be 0-25 if unrelated.' },
            summary: { type: Type.STRING, description: 'Comprehensive 2-3 paragraph breakdown in English' },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of strong points of the thumbnail in English',
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of critical weaknesses or low-CTR triggers in English',
            },
            actionableTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Actionable design and title fix instructions in English',
            },
            colorPsychologyAnalysis: { type: Type.STRING, description: 'Analysis of color contrast and palette' },
            textOverlayFeedback: { type: Type.STRING, description: 'Feedback on text length, font, and positioning' },
            faceExpressionFeedback: { type: Type.STRING, description: 'Feedback on faces, eye contact, and emotional hook' },
            mobileFeedVisibility: { type: Type.STRING, description: 'How well it stands out on mobile devices (small screen preview)' },
            suggestedABTestTitle: { type: Type.STRING, description: 'An alternative higher-CTR YouTube title' },
            suggestedABTestThumbnailConcept: { type: Type.STRING, description: 'Concept description for A/B testing against current thumbnail' },
            abTestDetails: {
              type: Type.OBJECT,
              description: 'Structured YouTube A/B Test recommendation',
              properties: {
                alternativeTitle: { type: Type.STRING, description: '1 powerful alternative YouTube title in English' },
                thumbnailConcept: {
                  type: Type.OBJECT,
                  properties: {
                    mainObject: { type: Type.STRING, description: 'Main subject / object' },
                    background: { type: Type.STRING, description: 'Background composition' },
                    colorPalette: { type: Type.STRING, description: 'Color palette' },
                    lighting: { type: Type.STRING, description: 'Lighting setup' },
                    textOverlay: { type: Type.STRING, description: 'Text hook (max 2-4 words)' },
                    cameraAngle: { type: Type.STRING, description: 'Camera angle' },
                    focalPoint: { type: Type.STRING, description: 'Focal point' },
                    targetEmotion: { type: Type.STRING, description: 'Target emotional response' },
                  },
                  required: ['mainObject', 'background', 'colorPalette', 'lighting', 'textOverlay', 'cameraAngle', 'focalPoint', 'targetEmotion'],
                },
                whyItsStronger: {
                  type: Type.OBJECT,
                  properties: {
                    attentionReason: { type: Type.STRING, description: 'Why it grabs more attention' },
                    psychologicalPrinciples: { type: Type.STRING, description: 'Psychological principles used (MrBeast, Veritasium, Curiosity Gap, etc.)' },
                    firstTwoSecondsImpact: { type: Type.STRING, description: 'Why it draws interest in the first 2 seconds' },
                  },
                  required: ['attentionReason', 'psychologicalPrinciples', 'firstTwoSecondsImpact'],
                },
                expectedImpact: {
                  type: Type.OBJECT,
                  properties: {
                    ctrPotentialStars: { type: Type.NUMBER, description: 'CTR Impact Potential 1-5' },
                    curiosityStars: { type: Type.NUMBER, description: 'Curiosity Factor 1-5' },
                    visualAttentionStars: { type: Type.NUMBER, description: 'Visual Attention 1-5' },
                    emotionalImpactStars: { type: Type.NUMBER, description: 'Emotional Impact 1-5' },
                    abTestPriority: { type: Type.STRING, description: 'High, Medium, or Low' },
                  },
                  required: ['ctrPotentialStars', 'curiosityStars', 'visualAttentionStars', 'emotionalImpactStars', 'abTestPriority'],
                },
              },
              required: ['alternativeTitle', 'thumbnailConcept', 'whyItsStronger', 'expectedImpact'],
            },
            aiImagePrompt: {
              type: Type.STRING,
              description: 'Comprehensive, highly detailed 16:9 English prompt for external AI image generators to render a high-CTR YouTube thumbnail.',
            },
          },
          required: [
            'visualImpact',
            'readability',
            'curiosity',
            'clarity',
            'titleThumbnailAlignment',
            'summary',
            'strengths',
            'weaknesses',
            'actionableTips',
            'colorPsychologyAnalysis',
            'textOverlayFeedback',
            'faceExpressionFeedback',
            'mobileFeedVisibility',
            'suggestedABTestTitle',
            'suggestedABTestThumbnailConcept',
            'abTestDetails',
            'aiImagePrompt',
          ],
        },
      },
      'analyze-thumbnail'
    );

    let parsedData: any;
    try {
      parsedData = cleanAndParseJson(resultText);
    } catch (parseErr) {
      console.error('Failed to parse AI response JSON in analyze-thumbnail:', parseErr, resultText);
      return res.status(502).json({
        success: false,
        error: 'Bad Gateway: Received invalid response structure from AI model. Please retry.',
      });
    }

    // ========================================================================
    // DETERMINISTIC CTR SCORING ENGINE WITH ALIGNMENT CAPS
    // ========================================================================
    const rawVisual = parsedData.visualImpact ?? parsedData.visualHierarchyScore;
    const rawReadability = parsedData.readability ?? parsedData.readabilityScore;
    const rawCuriosity = parsedData.curiosity ?? parsedData.emotionScore;
    const rawClarity = parsedData.clarity ?? parsedData.focalPointScore;
    const rawAlignment = parsedData.titleThumbnailAlignment ?? parsedData.titleSynergyScore;

    // Detect if the model output scores on a 0-10 scale (e.g. all provided scores <= 10)
    const validScores = [rawVisual, rawReadability, rawCuriosity, rawClarity, rawAlignment]
      .map((v) => (typeof v === 'number' ? v : parseFloat(v)))
      .filter((v) => !Number.isNaN(v));
    const isTenScale = validScores.length > 0 && Math.max(...validScores) <= 10;
    const scaleMultiplier = isTenScale ? 10 : 1;

    // Requirement 7: Reject / safely normalize invalid or out-of-range scores
    const visualImpact = normalizeCategoryScore(rawVisual != null ? rawVisual * scaleMultiplier : null, 50);
    const readability = normalizeCategoryScore(rawReadability != null ? rawReadability * scaleMultiplier : null, 50);
    const curiosity = normalizeCategoryScore(rawCuriosity != null ? rawCuriosity * scaleMultiplier : null, 50);
    const clarity = normalizeCategoryScore(rawClarity != null ? rawClarity * scaleMultiplier : null, 50);
    const titleThumbnailAlignment = normalizeCategoryScore(rawAlignment != null ? rawAlignment * scaleMultiplier : null, 50);

    // Requirement 3: Deterministic score calculation
    // rawScore = visualImpact * 0.20 + readability * 0.15 + curiosity * 0.20 + clarity * 0.15 + titleThumbnailAlignment * 0.30
    const rawScore =
      visualImpact * 0.20 +
      readability * 0.15 +
      curiosity * 0.20 +
      clarity * 0.15 +
      titleThumbnailAlignment * 0.30;

    // Requirement 4: Mandatory alignment caps
    // - alignment below 20: final score maximum 35
    // - alignment below 40: final score maximum 50
    // - alignment below 60: final score maximum 65
    let finalScore = rawScore;
    let isCapped = false;
    let appliedCap: number | null = null;

    if (titleThumbnailAlignment < 20) {
      if (finalScore > 35) {
        finalScore = 35;
        isCapped = true;
        appliedCap = 35;
      }
    } else if (titleThumbnailAlignment < 40) {
      if (finalScore > 50) {
        finalScore = 50;
        isCapped = true;
        appliedCap = 50;
      }
    } else if (titleThumbnailAlignment < 60) {
      if (finalScore > 65) {
        finalScore = 65;
        isCapped = true;
        appliedCap = 65;
      }
    }

    const overallCtrScore = Math.max(0, Math.min(100, Math.round(finalScore)));
    const roundedRawScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Requirement 5: Grade must be calculated only after applying the cap
    const ctrGrade = calculateCtrGrade(overallCtrScore);

    // Requirement 6: If alignment is below 40, include a prominent warning
    let alignmentWarning: string | null = null;
    if (titleThumbnailAlignment < 40) {
      alignmentWarning =
        'Critical Title–Thumbnail Mismatch: The thumbnail and video title appear to represent completely different videos or unrelated subjects. A mismatched thumbnail creates extreme viewer drop-off, destroys viewer trust, and severely depresses CTR.';
    }

    // Attach deterministic scores to response
    parsedData.visualImpact = visualImpact;
    parsedData.readability = readability;
    parsedData.curiosity = curiosity;
    parsedData.clarity = clarity;
    parsedData.titleThumbnailAlignment = titleThumbnailAlignment;
    parsedData.rawScore = roundedRawScore;
    parsedData.overallCtrScore = overallCtrScore;
    parsedData.ctrGrade = ctrGrade;
    parsedData.isCapped = isCapped;
    parsedData.appliedCap = appliedCap;
    parsedData.alignmentWarning = alignmentWarning;

    // Backwards compatibility aliases
    parsedData.visualHierarchyScore = visualImpact;
    parsedData.readabilityScore = readability;
    parsedData.emotionScore = curiosity;
    parsedData.focalPointScore = clarity;
    parsedData.titleSynergyScore = titleThumbnailAlignment;

    // Prepend mismatch warning to weaknesses if not already present
    if (alignmentWarning && Array.isArray(parsedData.weaknesses)) {
      const alreadyWarned = parsedData.weaknesses.some((w: string) =>
        w.toLowerCase().includes('mismatch') || w.toLowerCase().includes('alignment') || w.toLowerCase().includes('unrelated')
      );
      if (!alreadyWarned) {
        parsedData.weaknesses.unshift(
          `Severe Title–Thumbnail Mismatch (${titleThumbnailAlignment}/100 alignment): The thumbnail visuals do not match the promised video topic and appear to belong to an unrelated video.`
        );
      }
    }

    const record = await rateLimitStore.increment(key, nextMidnight);
    const remaining = Math.max(0, allowedLimit - record.count);

    return res.status(200).json({
      success: true,
      data: parsedData,
      quota: {
        remaining,
        limit: allowedLimit,
        resetAt: new Date(record.resetTime).toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Server error in analyze-thumbnail:', error);
    let errorMessage = 'An unexpected error occurred during thumbnail analysis. Please try again.';
    if (error?.message?.includes('GEMINI_API_KEY')) {
      errorMessage = 'Server Configuration Error: GEMINI_API_KEY is not set.';
    } else if (
      error?.status === 503 ||
      error?.message?.includes('503') ||
      error?.message?.includes('high demand') ||
      error?.message?.includes('UNAVAILABLE')
    ) {
      errorMessage = 'The AI service is experiencing temporarily high traffic. Please wait a moment and try again.';
    } else if (
      error?.status === 429 ||
      error?.message?.includes('429') ||
      error?.message?.includes('RESOURCE_EXHAUSTED')
    ) {
      errorMessage = 'AI rate limit reached. Please wait a moment and try again.';
    } else if (error?.message) {
      errorMessage = `Thumbnail analysis failed: ${error.message}`;
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

// ============================================================================
// HANDLER 2: /api/generate-thumbnail-concept
// ============================================================================
export async function handleGenerateThumbnailConceptRequest(req: any, res: any) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const authResult = await verifyAuthHeader(authHeader);
    if (authResult.error) {
      return res.status(401).json({ success: false, error: authResult.error });
    }

    const user = authResult.user;
    const endpointPath = '/api/generate-thumbnail-concept';
    const limits = TIER_LIMITS[endpointPath];

    let key: string;
    let allowedLimit: number;

    if (user && user.id) {
      key = `user:${user.id}:${endpointPath}`;
      allowedLimit = user.tier === 'pro' ? limits.pro : limits.free;
    } else {
      const clientIp = getClientIp(req);
      key = `ip:${clientIp}:${endpointPath}`;
      allowedLimit = limits.unauthenticated;
    }

    const nextMidnight = getNextMidnightUtc();
    const existing = await rateLimitStore.get(key);
    const now = Date.now();

    if (existing && now <= existing.resetTime && existing.count >= allowedLimit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
      return res.status(429).json({
        success: false,
        error: user
          ? `Daily quota reached (${existing.count}/${allowedLimit} requests). Quota resets at midnight UTC.`
          : `Unauthenticated daily limit reached (${existing.count}/${allowedLimit} requests). Please sign in for higher daily limits.`,
        retryAfter: retryAfterSeconds,
        quota: {
          remaining: 0,
          limit: allowedLimit,
          resetAt: new Date(existing.resetTime).toISOString(),
        },
      });
    }

    let body: any;
    try {
      body = await parseBody(req);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid JSON body in request.' });
    }

    const rawTitle = sanitizeString(body.videoTitle, 300);
    const rawTopic = sanitizeString(body.videoTopic, 2000);
    const rawAudience = sanitizeString(body.targetAudience, 200);
    const rawCategory = sanitizeString(body.category, 200);
    const rawEmotion = sanitizeString(body.emotionGoal, 200);
    const rawStyle = sanitizeString(body.customStyle, 300);

    if (!rawTitle || !rawTopic) {
      return res.status(400).json({ success: false, error: 'Video title and topic are required.' });
    }

    const titleCheck = sanitizeForPrompt(rawTitle);
    const topicCheck = sanitizeForPrompt(rawTopic);
    const audienceCheck = sanitizeForPrompt(rawAudience);
    const categoryCheck = sanitizeForPrompt(rawCategory);
    const emotionCheck = sanitizeForPrompt(rawEmotion);
    const styleCheck = sanitizeForPrompt(rawStyle);

    if (
      !titleCheck.isValid ||
      !topicCheck.isValid ||
      !audienceCheck.isValid ||
      !categoryCheck.isValid ||
      !emotionCheck.isValid ||
      !styleCheck.isValid
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input detected: Disallowed instructions or keywords found in your request.',
      });
    }

    const videoTitle = titleCheck.sanitized;
    const videoTopic = topicCheck.sanitized;
    const targetAudience = audienceCheck.sanitized;
    const category = categoryCheck.sanitized;
    const emotionGoal = emotionCheck.sanitized;
    const customStyle = styleCheck.sanitized;

    const ai = getGenAIClient();

    const systemInstruction = `You are the world's top YouTube Thumbnail Design Director, CTR expert, and AI Prompt Engineer.
Your task is to analyze the video title and topic to create a directly actionable, professional thumbnail design (AI Thumbnail Blueprint).

Rules:
- Accurately understand the video topic.
- Do not create clickbait; remain faithful to the true video content.
- Utilize human psychology (Curiosity Gap, visual hierarchy, contrast, color psychology, focal point).
- Ensure the thumbnail captures attention in the first 1 second and meets top YouTube standards.
- Generate a highly detailed, cinematic 16:9 English prompt (imagePromptForAI) for text-to-image AI generators (high contrast, no text/watermark).
- CRITICAL: You MUST provide all generated explanations, titles, blueprints, tutorials, and alternatives in ENGLISH.`;

    const userPrompt = `Video Title: "${videoTitle.replace(/"/g, '\\"')}"
Video Summary: "${videoTopic.replace(/"/g, '\\"')}"
Target Audience: "${targetAudience || 'General YouTube Audience'}"
Category: "${category || 'General'}"
Target Emotion: "${emotionGoal || 'Curiosity & Shock'}"
Custom Style Preference: "${customStyle || 'Modern, high-contrast, cinematic lighting'}"`;

    const resultText = await generateContentWithFallback(
      ai,
      {
        systemInstruction,
        contents: userPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conceptTitle: { type: Type.STRING, description: 'Catchy name for this thumbnail concept' },
            conceptRationale: { type: Type.STRING, description: 'Why this concept will get high CTR in English' },
            textHookOnThumbnail: { type: Type.STRING, description: 'Max 2-4 word punchy text overlay on image' },
            mainFocalSubject: { type: Type.STRING, description: 'What/who should be the center element' },
            backgroundDescription: { type: Type.STRING, description: 'Background composition, blur level, lighting' },
            colorPalette: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hex: { type: Type.STRING },
                  role: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['hex', 'role', 'reason'],
              },
            },
            compositionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Step by step how to arrange elements in Canva/Photoshop',
            },
            recommendedFontsAndEffects: { type: Type.STRING, description: 'Font styles, drop shadows, stroke outlines recommended' },
            titleVariants: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 high-CTR alternative YouTube titles that match this thumbnail',
            },
            imagePromptForAI: { type: Type.STRING, description: 'Detailed English prompt for text-to-image generator' },
            blueprintDetails: {
              type: Type.OBJECT,
              description: 'Comprehensive AI Thumbnail Blueprint structure',
              properties: {
                generalConcept: { type: Type.STRING, description: '2-3 sentence concept overview in English' },
                mainObject: {
                  type: Type.OBJECT,
                  properties: {
                    size: { type: Type.STRING, description: 'Size' },
                    position: { type: Type.STRING, description: 'Position' },
                    pose: { type: Type.STRING, description: 'Pose' },
                    facialExpression: { type: Type.STRING, description: 'Facial expression' },
                    cameraAngle: { type: Type.STRING, description: 'Camera angle' },
                    keyFeaturesToHighlight: { type: Type.STRING, description: 'Key features to highlight' },
                  },
                  required: ['size', 'position', 'pose', 'facialExpression', 'cameraAngle', 'keyFeaturesToHighlight'],
                },
                background: {
                  type: Type.OBJECT,
                  properties: {
                    environment: { type: Type.STRING, description: 'Environment' },
                    atmosphere: { type: Type.STRING, description: 'Atmosphere' },
                    colors: { type: Type.STRING, description: 'Colors' },
                    blurLevel: { type: Type.STRING, description: 'Blur level' },
                    effects: { type: Type.STRING, description: 'Effects to apply' },
                  },
                  required: ['environment', 'atmosphere', 'colors', 'blurLevel', 'effects'],
                },
                lighting: {
                  type: Type.OBJECT,
                  properties: {
                    mainLight: { type: Type.STRING, description: 'Main light' },
                    rimLight: { type: Type.STRING, description: 'Rim light' },
                    glow: { type: Type.STRING, description: 'Glow effect' },
                    shadowAndContrast: { type: Type.STRING, description: 'Shadows & contrast' },
                  },
                  required: ['mainLight', 'rimLight', 'glow', 'shadowAndContrast'],
                },
                textOverlay: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING, description: 'Text hook (max 2-4 words)' },
                    fontType: { type: Type.STRING, description: 'Font family' },
                    weight: { type: Type.STRING, description: 'Font weight' },
                    color: { type: Type.STRING, description: 'Font color' },
                    stroke: { type: Type.STRING, description: 'Outline / Stroke' },
                    position: { type: Type.STRING, description: 'Position' },
                    size: { type: Type.STRING, description: 'Font size' },
                  },
                  required: ['text', 'fontType', 'weight', 'color', 'stroke', 'position', 'size'],
                },
                colorPalette: {
                  type: Type.OBJECT,
                  properties: {
                    primaryColors: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Primary colors' },
                    accentColors: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Accent colors' },
                    colorsToAvoid: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Colors to avoid' },
                  },
                  required: ['primaryColors', 'accentColors', 'colorsToAvoid'],
                },
                eyeTrackingPath: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Eye tracking focus path',
                },
                psychologicalPrinciples: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      principle: { type: Type.STRING, description: 'Principle name' },
                      reason: { type: Type.STRING, description: 'Explanation' },
                    },
                    required: ['principle', 'reason'],
                  },
                },
                aiImagePromptEnglish: {
                  type: Type.STRING,
                  description: 'Ultra detailed cinematic 16:9 text-to-image English prompt',
                },
                whyItsStrongerPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Key reasons why this concept drives higher CTR',
                },
                expectedImpact: {
                  type: Type.OBJECT,
                  properties: {
                    ctrPotentialStars: { type: Type.NUMBER, description: '1-5 stars' },
                    curiosityStars: { type: Type.NUMBER, description: '1-5 stars' },
                    visualAttentionStars: { type: Type.NUMBER, description: '1-5 stars' },
                    emotionalImpactStars: { type: Type.NUMBER, description: '1-5 stars' },
                    abTestPriority: { type: Type.STRING, description: 'High / Medium / Low' },
                  },
                  required: ['ctrPotentialStars', 'curiosityStars', 'visualAttentionStars', 'emotionalImpactStars', 'abTestPriority'],
                },
              },
              required: [
                'generalConcept',
                'mainObject',
                'background',
                'lighting',
                'textOverlay',
                'colorPalette',
                'eyeTrackingPath',
                'psychologicalPrinciples',
                'aiImagePromptEnglish',
                'whyItsStrongerPoints',
                'expectedImpact',
              ],
            },
          },
          required: [
            'conceptTitle',
            'conceptRationale',
            'textHookOnThumbnail',
            'mainFocalSubject',
            'backgroundDescription',
            'colorPalette',
            'compositionSteps',
            'recommendedFontsAndEffects',
            'titleVariants',
            'imagePromptForAI',
            'blueprintDetails',
          ],
        },
      },
      'generate-thumbnail-concept'
    );

    let parsedData: any;
    try {
      parsedData = cleanAndParseJson(resultText);
    } catch (parseErr) {
      console.error('Failed to parse AI response JSON in generate-thumbnail-concept:', parseErr, resultText);
      return res.status(502).json({
        success: false,
        error: 'Bad Gateway: Received invalid response structure from AI model. Please retry.',
      });
    }

    const record = await rateLimitStore.increment(key, nextMidnight);
    const remaining = Math.max(0, allowedLimit - record.count);

    return res.status(200).json({
      success: true,
      data: parsedData,
      quota: {
        remaining,
        limit: allowedLimit,
        resetAt: new Date(record.resetTime).toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Server error in generate-thumbnail-concept:', error);
    let errorMessage = 'An unexpected error occurred while generating thumbnail concept. Please try again.';
    if (error?.message?.includes('GEMINI_API_KEY')) {
      errorMessage = 'Server Configuration Error: GEMINI_API_KEY is not set.';
    } else if (
      error?.status === 503 ||
      error?.message?.includes('503') ||
      error?.message?.includes('high demand') ||
      error?.message?.includes('UNAVAILABLE')
    ) {
      errorMessage = 'The AI service is experiencing temporarily high traffic. Please wait a moment and try again.';
    } else if (
      error?.status === 429 ||
      error?.message?.includes('429') ||
      error?.message?.includes('RESOURCE_EXHAUSTED')
    ) {
      errorMessage = 'AI rate limit exceeded. Please wait a moment and try again.';
    } else if (error?.message) {
      errorMessage = `Thumbnail generation failed: ${error.message}`;
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
