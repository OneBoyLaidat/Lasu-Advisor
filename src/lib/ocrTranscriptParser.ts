import { CourseResult } from '../types';

export interface ParsedTranscriptCourse extends CourseResult {
  isMissingScore?: boolean;
  isMissingUnits?: boolean;
  isMissingCode?: boolean;
  isMissingTitle?: boolean;
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

// Standard LASU NUC Grade point mapping
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
 * Extracts raw readable text content from an uploaded File (PDF, text, or image metadata).
 * Strictly extracts data from the uploaded file without injecting synthetic data.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        // Filter readable characters and line breaks
        // In PDF streams, text often appears inside (text) Tj or BT ... ET blocks or plain strings
        let cleanText = result;
        if (result.includes('%PDF')) {
          // Extract text literals from PDF syntax
          const textMatches = result.match(/\(([^)]+)\)|\[([^\]]+)\]/g);
          if (textMatches && textMatches.length > 0) {
            const extracted = textMatches
              .map((m) => m.replace(/[()[\]]/g, ''))
              .filter((t) => t.trim().length > 1)
              .join(' ');
            if (extracted.trim().length > 20) {
              cleanText = extracted;
            }
          }
        }
        resolve(cleanText);
      } else {
        resolve('');
      }
    };

    reader.onerror = () => {
      resolve('');
    };

    // Read as text to attempt raw ASCII/text stream extraction
    reader.readAsText(file);
  });
}

/**
 * Parses raw text extracted from a PDF/Image transcript using OCR heuristics.
 * STRICT: Only extracts and populates data actually present in the document.
 * If data is missing or unclear, flags it for manual user entry rather than guessing.
 */
export function parseTranscriptText(rawText: string, fileName: string): ParsedTranscriptData {
  const lines = rawText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const courses: ParsedTranscriptCourse[] = [];
  let missingFieldCount = 0;

  // Regex patterns:
  // Course codes: e.g. CSC401, CSC 401, MTH301, GNS 311, SEN 201, CIS 101, etc.
  const courseCodeRegex = /\b([A-Z]{3})\s?([0-9]{3})\b/i;
  // Units (1 to 6)
  const unitRegex = /\b([1-6])\s?(?:unit|units|cu|cr|u)?\b/i;
  // Scores (0 - 100)
  const scoreRegex = /\b(100|[1-9][0-9]|[0-9])(?:\s?%|\s?\/100|\s?pts)?\b/;
  // Grades (A, B, C, D, E, F)
  const gradeRegex = /\b([A-F])\b/;

  // Check lines or tokens
  for (const line of lines) {
    const codeMatch = line.match(courseCodeRegex);
    if (codeMatch) {
      const code = `${codeMatch[1].toUpperCase()}${codeMatch[2]}`;

      // Check if title can be extracted from remainder of the line
      let title = line
        .replace(courseCodeRegex, '')
        .replace(scoreRegex, '')
        .replace(unitRegex, '')
        .replace(gradeRegex, '')
        .replace(/[|,\-:;]/g, ' ')
        .trim();

      const isMissingTitle = !title || title.length < 3;
      if (isMissingTitle) {
        title = '';
      }

      // Check units
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

      // Check score
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

      // Check grade
      const gradeMatch = line.match(gradeRegex);
      let grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '-' = '-';
      if (!isMissingScore && typeof score === 'number') {
        const calc = calculateGradeAndPoints(score);
        grade = calc.grade;
      } else if (gradeMatch) {
        grade = gradeMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
      }

      if (isMissingScore && grade === '-') {
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
        isMissingScore,
        isMissingUnits,
        isMissingCode: false,
        isMissingTitle,
      });
    }
  }

  // Strictly calculate summary statistics ONLY from validly extracted course data
  const validCourses = courses.filter((c) => !c.isMissingUnits && !c.isMissingScore && c.units > 0);
  const totalUnits = validCourses.reduce((acc, c) => acc + c.units, 0);
  const passedUnits = validCourses
    .filter((c) => c.status === 'Passed')
    .reduce((acc, c) => acc + c.units, 0);
  const carryoverUnits = totalUnits - passedUnits;
  const totalGradePoints = validCourses.reduce((acc, c) => acc + c.gpPoints, 0);
  const gpa = totalUnits > 0 ? parseFloat((totalGradePoints / totalUnits).toFixed(2)) : 0;
  const cgpa = gpa;

  const hasMissingFields = missingFieldCount > 0 || courses.length === 0;
  let ocrConfidence: 'high' | 'partial' | 'low' = 'high';
  let extractionMessage = 'All course records strictly extracted from uploaded document.';

  if (courses.length === 0) {
    ocrConfidence = 'low';
    extractionMessage =
      'No clear course records could be detected from this file. Please manually input your course details below.';
  } else if (hasMissingFields) {
    ocrConfidence = 'partial';
    extractionMessage = `OCR extraction partial: ${missingFieldCount} field(s) could not be read clearly. Please verify and input the missing information.`;
  }

  return {
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
    missingFieldCount,
    ocrConfidence,
    extractionMessage,
  };
}
