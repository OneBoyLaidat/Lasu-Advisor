import type { IncomingMessage, ServerResponse } from 'http';

type VercelResponse = ServerResponse & {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
};

export default function handler(_req: IncomingMessage, res: VercelResponse) {
  res.status(200).json({
    status: 'healthy',
    system: 'LASU Advisor Academic Advising & CGPA Audit Portal',
    institution: 'Lagos State University (LASU)',
    runtime: 'Vercel Serverless Functions',
    timestamp: new Date().toISOString(),
  });
}

