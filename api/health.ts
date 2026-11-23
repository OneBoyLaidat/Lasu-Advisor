import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'healthy',
    system: 'LASU Advisor Academic Advising & CGPA Audit Portal',
    institution: 'Lagos State University (LASU)',
    runtime: 'Vercel Serverless Functions',
    timestamp: new Date().toISOString(),
  });
}
