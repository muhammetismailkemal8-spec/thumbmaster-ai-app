import express from 'express';
import path from 'path';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import {
  handleAnalyzeThumbnailRequest,
  handleGenerateThumbnailConceptRequest,
  handleCors,
} from './api/_lib.js';

const app = express();
const PORT = 3000;

// Trust reverse proxy for accurate client IP identification
app.set('trust proxy', 1);

// ============================================================================
// 1. SECURITY HEADERS (Helmet)
// ============================================================================
app.use(helmet());

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Apply the same CORS policy locally and in Vercel serverless functions.
app.use('/api/', (req, res, next) => {
  if (handleCors(req, res)) return;
  next();
});

// JSON Body Parser with explicit size limit (max 15MB for base64 thumbnails)
app.use(express.json({ limit: '15mb' }));

// ============================================================================
// 3. API ENDPOINTS (Shared with Vercel Serverless Handlers)
// ============================================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', runtime: 'express-container' });
});

// Mode A: Analyze existing thumbnail
app.post('/api/analyze-thumbnail', async (req, res) => {
  await handleAnalyzeThumbnailRequest(req, res);
});

// Mode B: Generate thumbnail concept blueprint
app.post('/api/generate-thumbnail-concept', async (req, res) => {
  await handleGenerateThumbnailConceptRequest(req, res);
});

// Fallback 404 for unhandled API routes
app.all(/^\/api(?:\/.*)?$/, (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
  });
});

// ============================================================================
// 4. GLOBAL ERROR HANDLER
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
// 5. VITE & STATIC SPA SERVING
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
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
