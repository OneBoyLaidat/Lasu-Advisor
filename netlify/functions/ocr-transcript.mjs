import { GoogleGenAI } from '@google/genai';

const json = (statusCode, payload) => new Response(JSON.stringify(payload), {
  status: statusCode,
  headers: { 'Content-Type': 'application/json' },
});

export default async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' });

  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!token || !supabaseUrl || !supabaseAnonKey) {
      return json(401, { error: 'Sign in to run OCR on a scanned transcript.' });
    }

    const baseUrl = supabaseUrl.replace(/\/$/, '');
    const identity = await fetch(`${baseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
    });
    if (!identity.ok) return json(401, { error: 'Your session expired. Sign in again and retry.' });
    const authenticatedUser = await identity.json();
    const roleCheck = await fetch(`${baseUrl}/rest/v1/profiles?user_id=eq.${encodeURIComponent(authenticatedUser.id || '')}&select=role`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
    });
    if (!roleCheck.ok) return json(403, { error: 'Your account could not be verified for transcript upload.' });
    const roleRows = await roleCheck.json();
    if (roleRows[0]?.role !== 'student') return json(403, { error: 'Transcript OCR is available to student accounts only.' });
    if (!apiKey) return json(503, { error: 'Scanned PDF OCR is not configured. Add GEMINI_API_KEY to the Netlify function environment.' });

    const { pdfBase64 = '' } = await request.json();
    // Netlify buffers function requests up to 6 MB. Base64 adds roughly 33%,
    // so keep scanned-PDF OCR comfortably below that platform limit.
    if (typeof pdfBase64 !== 'string' || !pdfBase64 || pdfBase64.length > 5_500_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(pdfBase64)) {
      return json(400, { error: 'The scanned PDF must be smaller than 4 MB for OCR. Text-based PDFs can still be uploaded up to 12 MB.' });
    }
    const pdfBytes = Buffer.from(pdfBase64, 'base64');
    if (pdfBytes.subarray(0, 4).toString() !== '%PDF') return json(400, { error: 'The uploaded file is not a valid PDF.' });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        { text: 'Read this LASU student result PDF. Transcribe only information visibly present in the document. Do not infer, complete, or invent values. Return only valid JSON with keys studentName (string or null), matricNo (string or null), courses (array of objects with code, title, units, score, grade; use null when unreadable). Include a course only if its course code is visible. Preserve the printed student name exactly.' },
        { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
      ],
    });
    const responseText = response.text || '';
    const jsonText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const extracted = JSON.parse(jsonText);
    const lines = [];
    if (extracted.studentName) lines.push(`Student Name: ${extracted.studentName}`);
    if (extracted.matricNo) lines.push(`Matric No: ${extracted.matricNo}`);
    for (const course of extracted.courses || []) {
      if (!course.code || !/^[A-Z]{3}\s?\d{3}$/i.test(course.code)) continue;
      lines.push([course.code, course.title || '', course.units ?? '', course.score ?? '', course.grade || ''].join(' '));
    }
    return json(200, { transcriptText: lines.join('\n') });
  } catch (error) {
    console.error('[LASU Advisor] Transcript OCR failed:', error);
    return json(502, { error: 'The scanned result could not be read. Try a clearer PDF or enter the result details manually.' });
  }
};
