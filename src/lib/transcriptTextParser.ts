import { CourseResult } from '../types';
import { getCurrentAcademicSession, getCurrentSemesterLabel } from './academicUtils';
import { normalizeInstitutionalIdentifier } from './institutionalIdentity';

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
  registrationNo?: string;
  refNo?: string;
  documentIdentifiers?: string[];
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

  // Extract Ref / Matric / Registration / Application Number & Student Name
  const isPlaceholderId = (value?: string): boolean => {
    if (!value) return true;
    const cleaned = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return !cleaned || ['NA', 'NONE', 'NIL', 'NULL', 'MATRICULATION', 'NUMBER', 'PROGRAMME', 'COURSE'].includes(cleaned);
  };

  const extractLabeledValue = (labelPattern: RegExp, valuePattern: RegExp): string | undefined => {
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const inlineMatch = line.match(new RegExp(`${labelPattern.source}\\s*[:\\-]?\\s*(${valuePattern.source})`, 'i'));
      if (inlineMatch?.[1] && !isPlaceholderId(inlineMatch[1])) {
        return inlineMatch[1].trim();
      }
      if (labelPattern.test(line) && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const nextMatch = nextLine.match(valuePattern);
        if (nextMatch?.[0] && !isPlaceholderId(nextMatch[0])) {
          return nextMatch[0].trim();
        }
      }
    }
    return undefined;
  };

  let refNo: string | undefined;
  const refMatch = rawText.match(/\b(?:Doc\s*Reference|Reference|Ref)\s*[:\-]\s*([A-Za-z0-9/_-]+)\b/i);
  if (refMatch && !isPlaceholderId(refMatch[1])) refNo = refMatch[1].trim();

  let studentName: string | undefined;
  const nameLine = lines.find((line) => /^(?:student\s*name|name\s*of\s*student|full\s*name)\s*[:\-]/i.test(line));
  if (nameLine) {
    studentName = nameLine.replace(/^(?:student\s*name|name\s*of\s*student|full\s*name)\s*[:\-]\s*/i, '').trim();
  } else {
    const fullNameIdx = lines.findIndex((line) => /\bFULL\s*NAME\b/i.test(line));
    if (fullNameIdx !== -1 && fullNameIdx + 1 < lines.length) {
      const candidate = lines[fullNameIdx + 1]
        .replace(/\b(?:N\/A|NA|NONE|NIL)\b\s*$/i, '')
        .replace(/\b(?:[A-Z]{2,5}\/\d{2,4}\/\d{3,6}|DN\d{8,14}|\d{9,12})\b\s*$/i, '')
        .trim();
      if (candidate && !/^(?:MATRIC|APPLICATION|PROGRAMME|SESSION)/i.test(candidate)) {
        studentName = candidate;
      }
    } else {
      const inlineNameMatch = rawText.match(/\bFULL\s*NAME\b(?:\s+MATRICULATION\s*NUMBER)?\s+([A-Z][A-Z\s'-]{3,60}?)(?=\s+(?:N\/A|MATRIC|APPLICATION|PROGRAMME|SESSION|\d|[A-Z]{2,4}\/\d))/i);
      if (inlineNameMatch?.[1]) studentName = inlineNameMatch[1].trim();
    }
  }

  const idTokenPattern = /\b(?:[A-Z]{2,5}\/\d{2,4}\/\d{3,6}|[A-Z]{1,4}\d{8,14}|\d{9,12})\b/;
  const explicitMatric = extractLabeledValue(
    /(?:matric(?:ulation)?\s*(?:no\.?|number)?|student\s*id)/i,
    idTokenPattern
  );
  const explicitReg = extractLabeledValue(
    /(?:application|registration|reg\.?)\s*(?:no\.?|number)?/i,
    idTokenPattern
  );

  const documentIdentifiersSet = new Set<string>();
  const addDocumentIdentifier = (raw?: string) => {
    if (!raw || isPlaceholderId(raw)) return;
    const normalized = normalizeInstitutionalIdentifier(raw);
    if (normalized) documentIdentifiersSet.add(normalized);
    // Also index trailing segment of slash-delimited Doc References like LASU/DIP/TR/DN241728997045
    if (raw.includes('/')) {
      const tail = raw.split('/').pop();
      if (tail && !isPlaceholderId(tail) && /\d{6,}/.test(tail)) {
        const normalizedTail = normalizeInstitutionalIdentifier(tail);
        if (normalizedTail) documentIdentifiersSet.add(normalizedTail);
      }
    }
  };

  addDocumentIdentifier(explicitMatric);
  addDocumentIdentifier(explicitReg);
  // A document reference is not an identity credential. Only values explicitly
  // labelled as a matriculation, student, registration, or application number
  // may authorize an upload.
  const matricNo = explicitMatric || explicitReg;
  const registrationNo = explicitReg;
  const documentIdentifiers = Array.from(documentIdentifiersSet);

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
    registrationNo,
    refNo,
    documentIdentifiers,
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
