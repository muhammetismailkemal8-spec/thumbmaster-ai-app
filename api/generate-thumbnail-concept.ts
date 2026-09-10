import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGenerateThumbnailConceptRequest } from './_lib';

/**
 * Vercel Serverless Function Handler
 * Route: POST /api/generate-thumbnail-concept
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleGenerateThumbnailConceptRequest(req, res);
}
