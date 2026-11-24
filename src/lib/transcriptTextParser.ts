import { CourseResult } from '../types';
import { getCurrentAcademicSession, getCurrentSemesterLabel } from './academicUtils';

export interface ParsedTranscriptCourse extends CourseResult {
  caScore?: number | null;
  examScore?: number | null;
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
  refNo?: string;
  session?: string;
  level?: string;
  department?: string;
  semesterLabel?: string;
  isProvisionalOrBroadsheet?: boolean;
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

export const calculateGradeAndPoints = (score: number | string): { grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; gp: number; status: 'Passed' | 'Failed' } => {
  const num = typeof score === 'string' ? parseFloat(score) : score;
  if (isNaN(num) || num === null || num === undefined) return { grade: 'F', gp: 0, status: 'Failed' };
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
export function parseTranscriptText(rawText: string, fileName: string): ParsedTranscriptData {
  if (!rawText.trim()) {
    return {
      courses: [],
      totalUnits: 0,
      passedUnits: 0,
      carryoverUnits: 0,
      totalGradePoints: 0,
      gpa: 0,
      cgpa: 0,
      degreeClass: 'Pending Complete Data Entry',
      fileName,
      rawTextExtracted: '',
      hasMissingFields: true,
      missingFieldCount: 5,
      ocrConfidence: 'low',
      extractionMessage: 'No readable text was found. Run local OCR or enter the result details manually.',
    };
  }

  const lines = rawText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    // OCR often reads a printed zero as @ or O directly after the department code.
    .map((line) => line.replace(/\b([A-Z]{2,4})\s*[@OQD]\s*(\d{2})\b/gi, '$1 0$2'))
    .filter(Boolean);

  // Extract Session & Semester
  let session = getCurrentAcademicSession();
  const sessionMatch = rawText.match(/\b(20\d\d\/20\d\d)\b/);
  if (sessionMatch) session = sessionMatch[1];

  let semester = getCurrentSemesterLabel();
  const semMatch = rawText.match(/\b(FIRST|SECOND)\s+SEMESTER\b/i);
  if (semMatch) semester = semMatch[0].toUpperCase();

  // Extract Ref / Matric / Student Name
  let refNo: string | undefined;
  const refMatch = rawText.match(/\b(?:Ref|Reference|DN)\s*[:\-]?\s*([A-Za-z0-9/]+)\b/i);
  if (refMatch) refNo = refMatch[1];

  const nameLine = lines.find((line) => /^(?:student\s*name|name\s*of\s*student|full\s*name)\s*[:\-]/i.test(line));
  const studentName = nameLine?.replace(/^(?:student\s*name|name\s*of\s*student|full\s*name)\s*[:\-]\s*/i, '').trim();

  const matricLine = lines.find((line) => /^(?:matric(?:ulation)?\s*(?:no\.?|number)?|student\s*id)\s*[:\-]/i.test(line));
  const matricNo = matricLine?.replace(/^(?:matric(?:ulation)?\s*(?:no\.?|number)?|student\s*id)\s*[:\-]\s*/i, '').trim();

  const courses: ParsedTranscriptCourse[] = [];
  let missingFieldCount = 0;

  // Course Code: 2-4 uppercase letters, optional space, 2-3 digits (e.g. CSD 027, CSD 029, CSC 101, MAT 111)
  const courseCodeRegex = /\b([A-Z]{2,4})\s?([0-9]{2,3})\b/i;

  for (const line of lines) {
    const codeMatch = line.match(courseCodeRegex);
    if (!codeMatch) continue;

    // Skip table header row
    if (/COURSE\s+CODE/i.test(line)) continue;

    const fullCode = `${codeMatch[1].toUpperCase()} ${codeMatch[2]}`;
    const compactCode = `${codeMatch[1].toUpperCase()}${codeMatch[2]}`;
    if (courses.some((c) => c.code === fullCode || c.code === compactCode)) continue;

    // Check for LASU broadsheet row pattern:
    // [CODE] [TITLE...] [UNIT] [CA] [EXAM] [TOTAL] [GRADE] [GP] [POINTS]
    const broadsheetRegex = new RegExp(
      `^.*?${codeMatch[1]}\\s*${codeMatch[2]}\\s+(.+?)\\s+([1-6])\\s+([0-9]+(?:\\.[0-9]+)?)\\s+([0-9]+(?:\\.[0-9]+)?)\\s+([0-9]+(?:\\.[0-9]+)?)\\s+([A-F])\\s+([0-9]+(?:\\.[0-9]+)?)\\s+([0-9]+(?:\\.[0-9]+)?).*$`,
      'i'
    );
    const bsMatch = line.match(broadsheetRegex);

    if (bsMatch) {
      const title = bsMatch[1].replace(/\|/g, 'I').replace(/\s+/g, ' ').trim();
      const units = parseInt(bsMatch[2], 10);
      const caScore = parseFloat(bsMatch[3]);
      const examScore = parseFloat(bsMatch[4]);
      // LASU's Total and Points columns are derivable from the adjoining source
      // columns. Recompute them to correct common OCR substitutions such as 0 -> 8.
      const totalScore = caScore + examScore;
      const observedGrade = bsMatch[6].toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
      const calculated = calculateGradeAndPoints(totalScore);
      const grade = observedGrade === calculated.grade ? observedGrade : calculated.grade;
      const gp = calculated.gp;
      const points = units * gp;

      courses.push({
        code: fullCode,
        title,
        units,
        score: totalScore,
        grade,
        status: grade === 'F' ? 'Failed' : 'Passed',
        gpPoints: points || units * gp,
        semester,
        academicYear: session,
        caScore,
        examScore,
        isMissingCode: false,
        isMissingTitle: false,
        isMissingUnits: false,
        isMissingScore: false,
        isMissingGrade: false,
      });
      continue;
    }

    // Standard transcript row fallback
    const lineAfterCode = line.slice(codeMatch.index! + codeMatch[0].length);
    const numbers = lineAfterCode.match(/[0-9]+(?:\.[0-9]+)?/g) || [];

    let units = 0;
    let score: number | string = '';
    let isMissingUnits = true;
    let isMissingScore = true;

    if (numbers.length >= 1) {
      const unitCandidate = numbers.find((n) => {
        const val = parseFloat(n);
        return Number.isInteger(val) && val >= 1 && val <= 6;
      });
      if (unitCandidate) {
        units = parseInt(unitCandidate, 10);
        isMissingUnits = false;
      }

      const scoreCandidate = numbers.find((n) => {
        const val = parseFloat(n);
        return val >= 20 && val <= 100;
      });
      if (scoreCandidate) {
        score = parseFloat(scoreCandidate);
        isMissingScore = false;
      }
    }

    const gradeMatch = lineAfterCode.match(/\b([A-F])\b/);
    let grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '-' = '-';
    let isMissingGrade = true;

    if (gradeMatch) {
      grade = gradeMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
      isMissingGrade = false;
    } else if (!isMissingScore) {
      grade = calculateGradeAndPoints(score).grade;
      isMissingGrade = false;
    }

    if (isMissingUnits) missingFieldCount++;
    if (isMissingScore) missingFieldCount++;
    if (isMissingGrade) missingFieldCount++;

    let title = lineAfterCode
      .replace(/[0-9]+(?:\.[0-9]+)?/g, '')
      .replace(/\b[A-F]\b/g, '')
      .replace(/[|,\-:;]/g, ' ')
      .trim();

    if (!title || title.length < 3) title = `${fullCode} Course Unit`;

    const { gp } = isMissingScore ? { gp: 0 } : calculateGradeAndPoints(score);
    const status = grade === 'F' ? 'Failed' : isMissingScore ? 'In Progress' : 'Passed';

    courses.push({
      code: fullCode,
      title,
      units,
      score,
      grade,
      status,
      gpPoints: units * gp,
      semester,
      academicYear: session,
      isMissingCode: false,
      isMissingTitle: false,
      isMissingUnits,
      isMissingScore,
      isMissingGrade,
    });
  }

  // Summary metrics
  const validCourses = courses.filter((c) => !c.isMissingUnits && !c.isMissingScore && c.units > 0 && c.grade !== '-');
  const totalUnits = validCourses.reduce((acc, c) => acc + c.units, 0);
  const passedUnits = validCourses.filter((c) => c.status === 'Passed').reduce((acc, c) => acc + c.units, 0);
  const carryoverUnits = totalUnits - passedUnits;
  const totalGradePoints = validCourses.reduce((acc, c) => acc + c.gpPoints, 0);
  const gpa = totalUnits > 0 ? parseFloat((totalGradePoints / totalUnits).toFixed(2)) : 0;
  const cgpa = gpa;

  const isProvisionalOrBroadsheet = !studentName || Boolean(refNo);
  const hasMissingFields = courses.length === 0 || missingFieldCount > 0;
  const ocrConfidence: 'high' | 'partial' | 'low' = courses.length === 0 ? 'low' : hasMissingFields ? 'partial' : 'high';

  return {
    studentName,
    matricNo,
    refNo,
    session,
    semesterLabel: semester,
    isProvisionalOrBroadsheet,
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
    extractionMessage: courses.length > 0
      ? `All ${courses.length} course records successfully extracted from document.`
      : 'No course rows could be recognized. Upload a clearer PDF or enter result details manually.',
  };
}
