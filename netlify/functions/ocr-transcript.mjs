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

    // Check if token is local auth or offline student session
    const isLocalAuth = !token || token === 'local-auth-token' || token.startsWith('local-');

    if (!isLocalAuth && supabaseUrl && supabaseAnonKey) {
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
    }

    if (!apiKey) {
      return json(503, { error: 'Scanned PDF OCR is not configured. Add GEMINI_API_KEY to the Netlify function environment.' });
    }

    const { pdfBase64 = '', imageBase64 = '' } = await request.json();

    if (!pdfBase64 && !imageBase64) {
      return json(400, { error: 'Provide a valid PDF or high-resolution page image for OCR scanning.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // High-precision prompt tuned for LASU provisional result slips, broadsheets, and transcripts
    const prompt = `You are an expert LASU (Lagos State University) academic transcript and result document scanner.
Transcribe only information visibly present in this academic document.
Pay special attention to LASU tabular broadsheet and provisional result formats with columns such as:
COURSE CODE | COURSE TITLE | UNIT | CA (30) | EXAM (70) | TOTAL | GRADE | GP | POINTS (CP)

Extract and return ONLY a valid JSON object with this exact structure:
{
  "studentName": string or null,
  "matricNo": string or null,
  "refNo": string or null,
  "session": string or null,
  "semester": string or null,
  "faculty": string or null,
  "department": string or null,
  "tnu": number or null,
  "tcp": number or null,
  "gpa": number or null,
  "cgpa": number or null,
  "courses": [
    {
      "code": string,
      "title": string,
      "units": number,
      "caScore": number or null,
      "examScore": number or null,
      "score": number,
      "grade": string,
      "gp": number or null,
      "points": number or null
    }
  ]
}

Rules:
1. Extract all courses visible in the table. Preserve course codes accurately (e.g., "CSD 027", "CSD 029", "CSC 101").
2. Units must be an integer between 1 and 6.
3. Total score should be the TOTAL mark (e.g. 97.0, 78.0, 70).
4. Grade must be one of: "A", "B", "C", "D", "E", "F".
5. If student name is not printed on the document (e.g. continuation slip or provisional slip), return null for studentName.
6. Return only raw JSON without markdown.`;

    const contents = [{ text: prompt }];

    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
        },
      });
    } else if (pdfBase64) {
      contents.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64.replace(/^data:application\/pdf;base64,/, ''),
        },
      });
    }

    let responseText = '';
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
        });
        responseText = response.text || '';
        if (responseText) break;
      } catch (err) {
        lastError = err;
        console.warn(`[LASU Advisor] Model ${modelName} failed, trying next:`, err.message);
      }
    }

    if (!responseText) {
      throw lastError || new Error('No response from OCR model.');
    }

    const cleanJson = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const extracted = JSON.parse(cleanJson);

    const lines = [];
    if (extracted.studentName) lines.push(`Student Name: ${extracted.studentName}`);
    if (extracted.matricNo) lines.push(`Matric No: ${extracted.matricNo}`);
    if (extracted.refNo) lines.push(`Ref: ${extracted.refNo}`);
    if (extracted.session) lines.push(`Session: ${extracted.session}`);
    if (extracted.semester) lines.push(`Semester: ${extracted.semester}`);

    for (const course of extracted.courses || []) {
      if (!course.code) continue;
      lines.push(`${course.code} ${course.title || ''} ${course.units ?? ''} ${course.score ?? ''} ${course.grade || ''}`);
    }

    return json(200, {
      structuredData: extracted,
      transcriptText: lines.join('\n'),
    });
  } catch (error) {
    console.error('[LASU Advisor] Transcript OCR failed:', error);
    return json(502, { error: 'The scanned result could not be read. Try a clearer PDF or enter the result details manually.' });
  }
};
