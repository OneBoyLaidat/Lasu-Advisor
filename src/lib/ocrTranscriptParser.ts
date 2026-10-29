import { CourseResult } from '../types';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ParsedTranscriptCourse extends CourseResult {
  isMissingCode?: boolean;
  isMissingTitle?: boolean;
  isMissingUnits?: boolean;
  isMissingScore?: boolean;
  isMissingGrade?: boolean;
  isManuallyAdded?: boolean;
}

export interface ParsedTranscriptData {
  studentName?: string;
  matricNo?: string;
  session?: string;
  level?: string;
  department?: string;
  courses: ParsedTranscriptCourse[];
  totalUnits: number;
  passedUnits: number;
  carryoverUnits: number;
  totalGradePoints: number;
  gpa: number;
  cgpa: number;
  degreeClass: string;
  fileName?: string;
  rawTextExtracted?: string;
  hasMissingFields: boolean;
  missingFieldCount: number;
  ocrConfidence: 'high' | 'partial' | 'low';
  extractionMessage: string;
}

// Standard LASU NUC Grade point scale (5.0 Maximum)
export const calculateGradeAndPoints = (
  score: number | string
): { grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; gp: number; status: 'Passed' | 'Failed' } => {
  const num = typeof score === 'string' ? parseFloat(score) : score;
  if (isNaN(num) || num === null || num === undefined) {
    return { grade: 'F', gp: 0, status: 'Failed' };
  }
  if (num >= 70) return { grade: 'A', gp: 5, status: 'Passed' };
  if (num >= 60) return { grade: 'B', gp: 4, status: 'Passed' };
  if (num >= 50) return { grade: 'C', gp: 3, status: 'Passed' };
  if (num >= 45) return { grade: 'D', gp: 2, status: 'Passed' };
  if (num >= 40) return { grade: 'E', gp: 1, status: 'Passed' };
  return { grade: 'F', gp: 0, status: 'Failed' };
};

export const getDegreeClass = (cgpa: number): string => {
  if (cgpa >= 4.5) return 'First Class Honours (Distinction)';
  if (cgpa >= 3.5) return 'Second Class Honours (Upper Division)';
  if (cgpa >= 2.4) return 'Second Class Honours (Lower Division)';
  if (cgpa >= 1.5) return 'Third Class Honours';
  return 'Pass Degree';
};

/**
 * Extracts readable text streams from an uploaded File (PDF, Text, or OCR document).
 * Handles raw PDF streams, text tokens, ASCII sequences, and plain text.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Please upload a PDF result document.');
  }
  const document = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const positioned = content.items
        .flatMap((item) => 'str' in item && 'transform' in item
          ? [{ text: item.str.trim(), x: item.transform[4], y: item.transform[5] }]
          : [])
        .filter((item) => item.text.length > 0)
        .sort((a, b) => b.y - a.y || a.x - b.x);
      const lines: Array<{ y: number; items: typeof positioned }> = [];
      for (const item of positioned) {
        const row = lines.find((candidate) => Math.abs(candidate.y - item.y) < 2.5);
        if (row) row.items.push(item);
        else lines.push({ y: item.y, items: [item] });
      }
      pages.push(lines.map((line) => line.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(' ')).join('\n'));
    }
    return pages.join('\n\n').trim();
  } finally {
    await document.destroy();
  }
}

export async function extractTextFromScannedPdf(file: File, accessToken: string): Promise<string> {
  // Netlify's buffered function request limit is 6 MB; base64 expands the PDF
  // by about one third, so reject oversized scanned PDFs before sending them.
  if (file.size > 4 * 1024 * 1024) {
    throw new Error('This scanned PDF is larger than the 4 MB OCR limit. Compress it or upload a text-based PDF instead.');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }
  const response = await fetch('/api/ocr/transcript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ pdfBase64: btoa(binary) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Scanned PDF OCR could not be completed.');
  return String(result.transcriptText || '');
}

/**
 * Parses raw extracted text from a PDF transcript using OCR heuristics.
 * Targets exactly 5 fields per course:
 *  1. Code (e.g. CSC401, MTH301, GNS311)
 *  2. Title (e.g. Advanced Database Systems, Numerical Analysis)
 *  3. Unit (1-6 credit units)
 *  4. Score (0-100)
 *  5. Grade (A, B, C, D, E, F)
 */
export function parseTranscriptText(rawText: string, fileName: string): ParsedTranscriptData {
  const lines = rawText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const courses: ParsedTranscriptCourse[] = [];
  let missingFieldCount = 0;

  // Regex patterns:
  // 1. Code: 3 alphabetic characters followed by 3 numeric digits (e.g. CSC301 or CSC 301)
  const courseCodeRegex = /\b([A-Z]{3})\s?([0-9]{3})\b/i;
  // 2. Unit: single digit between 1 and 6
  const unitRegex = /\b([1-6])\s?(?:unit|units|cu|cr|u)?\b/i;
  // 3. Score: number 0-100 (percentage or marks)
  const scoreRegex = /\b(100|[1-9][0-9]|[0-9])(?:\s?%|\s?\/100|\s?pts)?\b/;
  // 4. Grade: single letter A, B, C, D, E, F
  const gradeRegex = /\b([A-F])\b/;

  for (const line of lines) {
    const codeMatch = line.match(courseCodeRegex);
    if (codeMatch) {
      const code = `${codeMatch[1].toUpperCase()}${codeMatch[2]}`;
      // Avoid duplicate course codes from overlapping PDF lines
      if (courses.some((c) => c.code === code)) continue;

      // Extract title from remaining tokens of the line
      let title = line
        .replace(courseCodeRegex, '')
        .replace(scoreRegex, '')
        .replace(unitRegex, '')
        .replace(gradeRegex, '')
        .replace(/[|,\-:;]/g, ' ')
        .trim();

      // Clean up common header strings that might bleed in
      title = title.replace(/\b(PASSED|FAILED|FIRST|SECOND|SEMESTER|SESSION|UNITS|GRADE|SCORE|COURSE)\b/gi, '').trim();

      const isMissingTitle = !title || title.length < 3;
      if (isMissingTitle) {
        title = '';
      }

      // Extract Unit (Target Field 3)
      const unitMatch = line.match(unitRegex);
      let units = 0;
      let isMissingUnits = true;
      if (unitMatch) {
        units = parseInt(unitMatch[1], 10);
        if (units >= 1 && units <= 6) {
          isMissingUnits = false;
        }
      }
      if (isMissingUnits) {
        missingFieldCount++;
      }

      // Extract Score (Target Field 4)
      const scoreMatch = line.match(scoreRegex);
      let score: number | '' = '';
      let isMissingScore = true;
      if (scoreMatch) {
        const parsedScore = parseInt(scoreMatch[1], 10);
        if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 100) {
          score = parsedScore;
          isMissingScore = false;
        }
      }

      // Extract Grade (Target Field 5)
      const gradeMatch = line.match(gradeRegex);
      let grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '-' = '-';
      let isMissingGrade = true;

      if (!isMissingScore && typeof score === 'number') {
        const calc = calculateGradeAndPoints(score);
        grade = calc.grade;
        isMissingGrade = false;
      } else if (gradeMatch) {
        grade = gradeMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
        isMissingGrade = false;
      }

      if (isMissingScore) {
        missingFieldCount++;
      }
      if (isMissingGrade) {
        missingFieldCount++;
      }

      const gp =
        grade === 'A'
          ? 5
          : grade === 'B'
          ? 4
          : grade === 'C'
          ? 3
          : grade === 'D'
          ? 2
          : grade === 'E'
          ? 1
          : 0;

      const status: 'Passed' | 'Failed' | 'In Progress' =
        grade === '-' ? 'In Progress' : gp > 0 ? 'Passed' : 'Failed';

      courses.push({
        code,
        title,
        units: isMissingUnits ? 0 : units,
        grade,
        score,
        status,
        semester: 'Fall 2024',
        academicYear: '2024/2025',
        gpPoints: isMissingUnits ? 0 : units * gp,
        isMissingCode: false,
        isMissingTitle,
        isMissingUnits,
        isMissingScore,
        isMissingGrade,
      });
    }
  }

  const nameLine = lines.find((line) => /^(?:student\s*name|name\s*of\s*student|full\s*name)\s*[:\-]/i.test(line));
  const studentName = nameLine?.replace(/^(?:student\s*name|name\s*of\s*student|full\s*name)\s*[:\-]\s*/i, '').trim();
  const matricLine = lines.find((line) => /^(?:matric(?:ulation)?\s*(?:no\.?|number)?|student\s*id)\s*[:\-]/i.test(line));
  const matricNo = matricLine?.replace(/^(?:matric(?:ulation)?\s*(?:no\.?|number)?|student\s*id)\s*[:\-]\s*/i, '').trim();

  // Calculate summary metrics ONLY from validly extracted course data
  const validCourses = courses.filter((c) => !c.isMissingUnits && !c.isMissingScore && c.units > 0 && c.grade !== '-');
  const totalUnits = validCourses.reduce((acc, c) => acc + c.units, 0);
  const passedUnits = validCourses
    .filter((c) => c.status === 'Passed')
    .reduce((acc, c) => acc + c.units, 0);
  const carryoverUnits = totalUnits - passedUnits;
  const totalGradePoints = validCourses.reduce((acc, c) => acc + c.gpPoints, 0);
  const gpa = totalUnits > 0 ? parseFloat((totalGradePoints / totalUnits).toFixed(2)) : 0;
  const cgpa = gpa;

  const hasMissingFields = courses.length === 0 || missingFieldCount > 0;
  const ocrConfidence: 'high' | 'partial' | 'low' = courses.length === 0 ? 'low' : hasMissingFields ? 'partial' : 'high';
  const extractionMessage =
    courses.length > 0
      ? 'All course records successfully extracted from uploaded PDF document.'
      : 'No selectable text was found in this PDF. Upload a text-based result PDF or enter the result details manually.';

  return {
    studentName,
    matricNo,
    courses,
    totalUnits,
    passedUnits,
    carryoverUnits,
    totalGradePoints,
    gpa,
    cgpa,
    degreeClass: totalUnits > 0 ? getDegreeClass(cgpa) : 'Pending Complete Data Entry',
    fileName,
    rawTextExtracted: rawText.slice(0, 1000),
    hasMissingFields,
    missingFieldCount: hasMissingFields ? missingFieldCount : 0,
    ocrConfidence,
    extractionMessage,
  };
}
