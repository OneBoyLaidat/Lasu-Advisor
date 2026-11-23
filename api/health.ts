export default function handler(_req: any, res: any) {
  res.status(200).json({
    status: 'healthy',
    system: 'LASU Advisor Academic Advising & CGPA Audit Portal',
    institution: 'Lagos State University (LASU)',
    runtime: 'Vercel Serverless Functions',
    timestamp: new Date().toISOString(),
  });
}
