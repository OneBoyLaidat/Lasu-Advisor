import { EntryMode } from '../types';

export interface ComputedLevelResult {
  level: string; // e.g. "200 Level", "400 Level"
  levelNumber: number; // e.g. 200, 400
  cohortLabel: string;
  isGraduated: boolean;
  yearsInSchool: number;
}

/**
 * Automatically computes the current active academic session based on the university academic calendar.
 * At the end of every second semester (typically July/August in Nigerian universities / LASU),
 * the session year increments automatically to the new academic session (e.g. 2026/2027).
 * This ensures the latest active session is always available dynamically without manual super-admin intervention.
 */
export function getCurrentAcademicSession(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0-indexed: 0 = Jan, 6 = July, 7 = Aug, 8 = Sept

  // In the university calendar, second semester concluding in July/August triggers
  // rollover to the new academic session (${year}/${year+1}) for admissions and new year
  if (month >= 6) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}

/**
 * Returns a dynamically computed list of academic sessions including the current session,
 * upcoming session, and historical cohorts down to 2017/2018.
 * Automatically updates every semester rollover.
 */
export function getDynamicAcademicSessions(
  referenceDate: Date = new Date(),
  includeNextSession: boolean = true
): string[] {
  const currentSession = getCurrentAcademicSession(referenceDate);
  const startYearMatch = currentSession.match(/\b(19\d\d|20\d\d)\b/);
  const currentStartYear = startYearMatch ? parseInt(startYearMatch[1], 10) : referenceDate.getFullYear();

  // If includeNextSession is true, allow upcoming admission session selection (e.g. 2026/2027 or 2027/2028)
  const topYear = includeNextSession ? Math.max(2026, currentStartYear) : Math.max(2025, currentStartYear);
  const minYear = 2017;

  const sessions: string[] = [];
  for (let y = topYear; y >= minYear; y--) {
    sessions.push(`${y}/${y + 1}`);
  }

  // Explicitly ensure 2026/2027 and 2025/2026 are included in case of clock discrepancies
  if (!sessions.includes('2026/2027')) sessions.unshift('2026/2027');
  if (!sessions.includes('2025/2026')) {
    const idx = sessions.indexOf('2026/2027');
    sessions.splice(idx + 1, 0, '2025/2026');
  }

  // Remove duplicates and maintain descending order
  return Array.from(new Set(sessions));
}

/**
 * Computes the academic level for a student based on admission session and entry mode.
 *
 * Rules:
 *  - UTME (Standard Entry) starts at 100 Level in their admission year.
 *  - Direct Entry (DE) starts at 200 Level in their admission year.
 *
 * Example verification:
 *  - UTME admitted in 2021/2022:
 *      2021/22 = 100L
 *      2022/23 = 200L
 *      2023/24 = 300L
 *      2024/25 = 400L
 *  - Direct Entry admitted in 2022/2023:
 *      2022/23 = 200L
 *      2023/24 = 300L
 *      2024/25 = 400L
 *  => Both students are placed at 400 Level simultaneously in 2024/2025.
 */
export function computeAcademicLevel(
  admissionSession: string,
  entryMode: EntryMode = 'utme',
  referenceCurrentSession: string = getCurrentAcademicSession()
): ComputedLevelResult {
  // Extract starting year from format "YYYY/YYYY" or "YYYY-YYYY"
  const admYearMatch = admissionSession.match(/\b(19\d\d|20\d\d)\b/);
  const currYearMatch = referenceCurrentSession.match(/\b(19\d\d|20\d\d)\b/);

  const admYear = admYearMatch ? parseInt(admYearMatch[1], 10) : 2022;
  const currYear = currYearMatch ? parseInt(currYearMatch[1], 10) : 2024;

  const yearsInSchool = Math.max(0, currYear - admYear);
  const baseLevel = entryMode === 'direct_entry' ? 200 : 100;
  const computedNumber = baseLevel + yearsInSchool * 100;

  let levelStr = `${computedNumber} Level`;
  let isGrad = false;

  if (computedNumber > 500) {
    levelStr = '500 Level (Finalist / Graduating)';
    isGrad = true;
  }

  const cohortLabel = `${admissionSession} (${entryMode === 'direct_entry' ? 'Direct Entry (DE)' : 'UTME'}) → ${levelStr}`;

  return {
    level: computedNumber > 500 ? '500 Level' : `${computedNumber} Level`,
    levelNumber: computedNumber,
    cohortLabel,
    isGraduated: isGrad,
    yearsInSchool,
  };
}

/**
 * Standard dynamic list of academic sessions for dropdown selection.
 * Dynamically generated and updated on every semester rollover.
 */
export const STANDARD_ACADEMIC_SESSIONS = getDynamicAcademicSessions();

/**
 * Computes the target cohort session for a student.
 * Direct Entry (DE) students join an existing set (one set before their admission year).
 * E.g., DE student joining in 2026/2027 is added to the 2025/2026 cohort/set.
 */
export function getStudentCohortSession(admissionSession: string, entryMode: EntryMode = 'utme'): string {
  const match = admissionSession.match(/\b(19\d\d|20\d\d)\b/);
  if (!match) return admissionSession;
  const startYear = parseInt(match[1], 10);

  if (entryMode === 'direct_entry') {
    // One set before their entry year
    return `${startYear - 1}/${startYear}`;
  }
  return `${startYear}/${startYear + 1}`;
}

