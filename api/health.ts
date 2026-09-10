import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from './_lib';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  res.status(200).json({ status: 'ok', runtime: 'vercel-serverless' });
}
