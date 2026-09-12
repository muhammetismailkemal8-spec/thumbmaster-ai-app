import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAnalyzeThumbnailRequest } from './_lib.js';

/**
 * Vercel Serverless Function Handler
 * Route: POST /api/analyze-thumbnail
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleAnalyzeThumbnailRequest(req, res);
}
