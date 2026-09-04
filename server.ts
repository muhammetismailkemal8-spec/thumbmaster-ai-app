import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * ============================================================================
 * ENVIRONMENT VARIABLES REQUIRED
 * ============================================================================
 * - GEMINI_API_KEY: (Required) Google Gemini API Key for AI analysis and blueprint generation.
 * - SUPABASE_URL: (Required for full auth) Supabase project URL.
 * - SUPABASE_ANON_KEY: (Required for full auth) Supabase public anonymous API key.
 * - ALLOWED_ORIGIN: (Optional) Production CORS origin (e.g., https://thumbmaster.app). Defaults to strict same-origin/dev list.
 * - NODE_ENV: 'production' | 'development' (controls Vite middleware vs static build).
 * ============================================================================
 */

// Extend Express Request interface to carry authenticated user data
export interface AuthUser {
  id: string;
  email?: string;
  tier?: 'free' | 'pro';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      isTimeout?: boolean;
    }
  }
}

const app = express();
const PORT = 3000;

// Trust reverse proxy (Cloud Run / Nginx / Load Balancer) for accurate req.ip
app.set('trust proxy', 1);

// ============================================================================
// 1. SECURITY HEADERS (Helmet)
// ============================================================================
app.use(
  helmet({
    contentSecurityPolicy: false, // Keep relaxed for single-page app inline assets & preview iframes
    crossOriginEmbedderPolicy: false,
  })
);

// Explicit custom baseline security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// ============================================================================
// 2. CORS MIDDLEWARE FOR /api/ ONLY
// ============================================================================
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,
  process.env.APP_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
].filter(Boolean) as string[];

const apiCors = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or same-origin without Origin header
    if (!origin) return callback(null, true);

    if (
      process.env.NODE_ENV !== 'production' ||
      !process.env.ALLOWED_ORIGIN ||
      origin === process.env.ALLOWED_ORIGIN ||
      allowedOrigins.includes(origin) ||
      origin.includes('.run.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    // Politely reject disallowed third-party origins
    return callback(null, false);
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  credentials: true,
});

app.use('/api/', apiCors);

// JSON Body Parser with explicit size limit (max 15MB for base64 thumbnails)
app.use(express.json({ limit: '15mb' }));

// ============================================================================
// 3. REQUEST TIMEOUT MIDDLEWARE (60 seconds for AI endpoints)
// ============================================================================
function timeoutMiddleware(timeoutMs: number = 60000) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const timer = setTimeout(() => {
      req.isTimeout = true;
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: 'Gateway Timeout: The AI processing took longer than 60 seconds. Please try again.',
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
}

// ============================================================================
// 4. SUPABASE AUTHENTICATION
// ============================================================================
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
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

/**
 * Supabase Auth Middleware:
 * - Checks Authorization header: "Bearer <token>"
 * - Verifies JWT via supabase.auth.getUser(token)
 * - Attaches req.user = { id, email, tier }
 * - Allows unauthenticated requests to pass through with req.user = undefined (for IP fallback quota)
 */
async function authenticateOptional(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = undefined;
    return next();
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    req.user = undefined;
    return next();
  }

  const supabase = getSupabase();
  if (!supabase) {
    // If Supabase credentials are not configured in environment, permit unauthenticated request
    req.user = undefined;
    return next();
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired authentication token.',
      });
    }

    const userMetadata = data.user.user_metadata || {};
    const tier = userMetadata.tier === 'pro' ? 'pro' : 'free';

    req.user = {
      id: data.user.id,
      email: data.user.email,
      tier,
    };
    next();
  } catch (err) {
    console.error('Supabase authentication error:', err);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Failed to authenticate token.',
    });
  }
}

// ============================================================================
// 5. TIERED RATE LIMITING & USAGE TRACKING (Persistent-ready Store Interface)
// ============================================================================

export interface RateLimitRecord {
  count: number;
  resetTime: number; // Timestamp in ms (Midnight UTC)
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitRecord | undefined> | RateLimitRecord | undefined;
  set(key: string, record: RateLimitRecord): Promise<void> | void;
  increment(key: string, resetTime: number): Promise<RateLimitRecord> | RateLimitRecord;
}

// In-Memory implementation (ready to be swapped with Redis / Upstash in the future)
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

const rateLimitStore = new InMemoryRateLimitStore();

// Clean up expired records every 10 minutes
setInterval(() => {
  rateLimitStore.cleanup();
}, 10 * 60 * 1000);

/**
 * Calculates next Midnight UTC timestamp in milliseconds
 */
function getNextMidnightUtc(): number {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}

/**
 * Rate limit configuration matrix per endpoint and user tier
 */
const TIER_LIMITS: Record<string, { unauthenticated: number; free: number; pro: number }> = {
  '/api/analyze-thumbnail': {
    unauthenticated: 30, // Relaxed for preview/testing & conversion
    free: 50,           // 50/day per user
    pro: 200,          // 200/day per user
  },
  '/api/generate-thumbnail-concept': {
    unauthenticated: 30, // Relaxed for preview/testing & conversion
    free: 50,           // 50/day per user
    pro: 200,          // 200/day per user
  },
};

/**
 * Middleware factory for tiered rate limiting
 */
function tieredRateLimiter(endpointPath: string) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const limits = TIER_LIMITS[endpointPath] || { unauthenticated: 1, free: 5, pro: 50 };
    const user = req.user;

    let key: string;
    let allowedLimit: number;

    if (user && user.id) {
      key = `user:${user.id}:${endpointPath}`;
      allowedLimit = user.tier === 'pro' ? limits.pro : limits.free;
    } else {
      const clientIp = req.ip || 'unknown-ip';
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

    const record = await rateLimitStore.increment(key, nextMidnight);
    const remaining = Math.max(0, allowedLimit - record.count);

    // Attach quota info to response locals so handlers can include it in response
    res.locals.quota = {
      remaining,
      limit: allowedLimit,
      resetAt: new Date(record.resetTime).toISOString(),
    };

    next();
  };
}

// ============================================================================
// 6. SANITIZATION & PROMPT INJECTION PROTECTION
// ============================================================================

function sanitizeString(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

/**
 * Detects adversarial prompt injection phrases
 */
const FORBIDDEN_PROMPT_PATTERNS = [
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

function sanitizeForPrompt(input: string): { isValid: boolean; sanitized: string } {
  if (!input) return { isValid: true, sanitized: '' };

  for (const pattern of FORBIDDEN_PROMPT_PATTERNS) {
    if (pattern.test(input)) {
      return { isValid: false, sanitized: '' };
    }
  }

  // Strip control chars while preserving normal Unicode text
  const cleaned = input.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '');
  return { isValid: true, sanitized: cleaned };
}

function validateAndParseBase64Image(imageBase64: unknown): { mimeType: string; data: string } | null {
  if (typeof imageBase64 !== 'string' || !imageBase64) return null;
  if (imageBase64.length > 15 * 1024 * 1024) return null; // Reject oversized base64 strings (>15MB)

  const matches = imageBase64.match(/^data:(image\/(jpeg|png|webp|jpg));base64,([A-Za-z0-9+/=]+)$/);
  if (!matches || matches.length !== 4) return null;

  const mimeType = matches[1] === 'image/jpg' ? 'image/jpeg' : matches[1];
  const data = matches[3];
  return { mimeType, data };
}

// Helper to safely get initialized Gemini client
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing on the server.');
  }
  return new GoogleGenAI({ apiKey });
}

// ============================================================================
// 7. API ENDPOINTS
// ============================================================================

// 1. Analyze existing YouTube Thumbnail
app.post(
  '/api/analyze-thumbnail',
  timeoutMiddleware(60000),
  authenticateOptional,
  tieredRateLimiter('/api/analyze-thumbnail'),
  async (req, res) => {
    try {
      const rawTitle = sanitizeString(req.body.videoTitle, 300);
      const rawTopic = sanitizeString(req.body.videoTopic, 2000);
      const rawAudience = sanitizeString(req.body.targetAudience, 200);
      const rawCategory = sanitizeString(req.body.category, 200);
      const rawImage = req.body.imageBase64;

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
          error: 'Invalid thumbnail image format. Please upload a valid JPEG, PNG, or WEBP image under 10MB.',
        });
      }

      const ai = getGenAIClient();

      const systemInstruction = `You are one of the world's best YouTube thumbnail and title optimization experts (a senior CTR director familiar with the psychological strategies of top creators like MrBeast, Veritasium, Kurzgesagt, Ali Abdaal, and Cleo Abram).
Your job is to analyze the uploaded thumbnail and video title to create a high-converting, professional A/B test proposal with actionable recommendations.

Rules:
1. Accurately understand the core topic of the video.
2. Do not generate clickbait. Create curiosity ("Curiosity Gap") without being misleading.
3. Recommendations must align 100% with the actual video content.
4. Apply psychological principles used by top YouTube channels (Curiosity Gap, high contrast, emotional hook, focal hierarchy).
5. Account for curiosity gaps, color contrast, emotional hooks, visual focal point, and hierarchy.
6. If the current thumbnail is already strong, propose a distinctly different angle or concept rather than minor tweaks.
7. CRITICAL: You MUST provide all generated explanations, titles, summaries, feedback points, blueprints, and step-by-step guides in ENGLISH.`;

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

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallCtrScore: { type: Type.NUMBER, description: 'Overall CTR potential score between 0 and 100' },
              ctrGrade: { type: Type.STRING, description: 'Grade like A+, A, B, C, D' },
              visualHierarchyScore: { type: Type.NUMBER, description: 'Score between 0 and 100' },
              readabilityScore: { type: Type.NUMBER, description: 'Score between 0 and 100' },
              emotionScore: { type: Type.NUMBER, description: 'Score between 0 and 100' },
              focalPointScore: { type: Type.NUMBER, description: 'Score between 0 and 100' },
              titleSynergyScore: { type: Type.NUMBER, description: 'Score between 0 and 100' },
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
                description: 'Comprehensive, highly detailed 16:9 English prompt for external AI image generators (ChatGPT, Midjourney, Gemini, Flux, DALL-E) to render a high-CTR YouTube thumbnail based on the analysis, weaknesses identified, and recommended A/B test concept. Must describe subjects, composition, background, lighting, camera angle, color palette, emotional hook, and 16:9 aspect ratio without technical explanations.',
              },
            },
            required: [
              'overallCtrScore',
              'ctrGrade',
              'visualHierarchyScore',
              'readabilityScore',
              'emotionScore',
              'focalPointScore',
              'titleSynergyScore',
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
      });

      if (req.isTimeout) return;

      const resultText = response.text || '{}';
      let parsedData: any;
      try {
        parsedData = JSON.parse(resultText);
      } catch (parseErr) {
        console.error('Failed to parse AI response JSON in /api/analyze-thumbnail:', parseErr, resultText);
        return res.status(502).json({
          success: false,
          error: 'Bad Gateway: Received invalid response structure from AI model. Please retry.',
        });
      }

      return res.json({
        success: true,
        data: parsedData,
        quota: res.locals.quota,
      });
    } catch (error: any) {
      if (req.isTimeout) return;
      console.error('Server error in /api/analyze-thumbnail:', error);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred during thumbnail analysis. Please try again.',
      });
    }
  }
);

// 2. Generate AI Thumbnail Concept & Blueprint
app.post(
  '/api/generate-thumbnail-concept',
  timeoutMiddleware(60000),
  authenticateOptional,
  tieredRateLimiter('/api/generate-thumbnail-concept'),
  async (req, res) => {
    try {
      const rawTitle = sanitizeString(req.body.videoTitle, 300);
      const rawTopic = sanitizeString(req.body.videoTopic, 2000);
      const rawAudience = sanitizeString(req.body.targetAudience, 200);
      const rawCategory = sanitizeString(req.body.category, 200);
      const rawEmotion = sanitizeString(req.body.emotionGoal, 200);
      const rawStyle = sanitizeString(req.body.customStyle, 300);

      if (!rawTitle || !rawTopic) {
        return res.status(400).json({ success: false, error: 'Video title and topic are required.' });
      }

      // Prompt injection safety checks
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
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
                    description: 'Eye tracking focus path (e.g. 1. Main subject, 2. Expression, 3. Text, 4. Detail)',
                  },
                  psychologicalPrinciples: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        principle: { type: Type.STRING, description: 'Principle name (Curiosity Gap, Pattern Interrupt, Contrast, etc.)' },
                        reason: { type: Type.STRING, description: 'Single sentence explanation' },
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
                    description: 'Key reasons why this concept drives higher CTR (max 5 points)',
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
      });

      if (req.isTimeout) return;

      const resultText = response.text || '{}';
      let parsedData: any;
      try {
        parsedData = JSON.parse(resultText);
      } catch (parseErr) {
        console.error('Failed to parse AI response JSON in /api/generate-thumbnail-concept:', parseErr, resultText);
        return res.status(502).json({
          success: false,
          error: 'Bad Gateway: Received invalid response structure from AI model. Please retry.',
        });
      }

      return res.json({
        success: true,
        data: parsedData,
        quota: res.locals.quota,
      });
    } catch (error: any) {
      if (req.isTimeout) return;
      console.error('Server error in /api/generate-thumbnail-concept:', error);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred while generating thumbnail concept. Please try again.',
      });
    }
  }
);

// Fallback 404 for any unhandled /api/* routes - always returns JSON, never HTML
app.all('/api/*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
  });
});

// ============================================================================
// 8. GLOBAL ERROR HANDLER (No stack trace leaks in production)
// ============================================================================
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);

  if (res.headersSent) {
    return;
  }

  const isProd = process.env.NODE_ENV === 'production';
  return res.status(err.status || 500).json({
    success: false,
    error: isProd ? 'Internal Server Error. Please try again later.' : (err.message || 'Unknown server error'),
  });
});

// ============================================================================
// 9. VITE & STATIC SPA SERVING
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
