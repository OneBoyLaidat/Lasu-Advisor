import React, { useEffect, useState } from 'react';
import { AcademicAnalytics, StudentStats, UserProfile, UserRole } from '../types';
import { getCurrentAcademicSession } from '../lib/academicUtils';

interface AnalyticsViewProps {
  userRole: UserRole;
  studentStats: StudentStats;
  studentProfile: UserProfile;
  academicAnalytics: AcademicAnalytics | null;
}

const CLASSIFICATION_COLORS = [
  'bg-emerald-500',
  'bg-teal-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-slate-400',
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  userRole,
  studentStats,
  studentProfile,
  academicAnalytics,
}) => {
  const isStudent = userRole === 'student';
  const [currentCgpa, setCurrentCgpa] = useState(studentStats.cgpa);
  const [completedUnits, setCompletedUnits] = useState(studentStats.totalUnits);
  const [targetCgpa, setTargetCgpa] = useState(4.5);
  const [remainingUnits, setRemainingUnits] = useState(Math.max(140 - studentStats.totalUnits, 0));
  const totalTargetPoints = targetCgpa * (completedUnits + remainingUnits);
  const currentPoints = currentCgpa * completedUnits;
  const requiredGpa = remainingUnits > 0 ? (totalTargetPoints - currentPoints) / remainingUnits : 0;
  const isPossible = requiredGpa >= 0 && requiredGpa <= 5;
  const maxStudents = Math.max(...(academicAnalytics?.classifications.map((item) => item.count) || [0]), 1);

  useEffect(() => {
    setCurrentCgpa(studentStats.cgpa);
    setCompletedUnits(studentStats.totalUnits);
    setRemainingUnits(Math.max(140 - studentStats.totalUnits, 0));
  }, [studentStats.cgpa, studentStats.totalUnits]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Academic Analytics &amp; Projections</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {isStudent
            ? `Personal academic analysis for ${studentProfile.name}.`
            : `Aggregate academic analysis for your authorized ${userRole === 'lecturer' ? 'assigned cohorts' : userRole === 'hod' ? 'department' : 'faculty'}.`}
        </p>
      </header>

      {isStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-xs">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="material-symbols-outlined text-emerald-600">calculate</span>
              <h2 className="font-bold text-slate-900 dark:text-slate-100">CGPA Target Calculator</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Current CGPA
                <input type="number" min="0" max="5" step="0.01" value={currentCgpa} onChange={(event) => setCurrentCgpa(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" />
              </label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Completed credit units
                <input type="number" min="0" value={completedUnits} onChange={(event) => setCompletedUnits(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" />
              </label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Target CGPA
                <input type="number" min="0" max="5" step="0.1" value={targetCgpa} onChange={(event) => setTargetCgpa(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" />
              </label>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Remaining credit units
                <input type="number" min="0" value={remainingUnits} onChange={(event) => setRemainingUnits(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" />
              </label>
            </div>
            <div className="mt-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4">
              <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Required average GPA</div>
              <div className="mt-1 text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {remainingUnits === 0 ? '—' : isPossible ? requiredGpa.toFixed(2) : 'Over 5.00'}
              </div>
              {studentStats.totalUnits === 0 && <p className="mt-2 text-xs text-emerald-900/80 dark:text-emerald-200/80">Upload your results to prefill this calculator with your academic record.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-xs">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="material-symbols-outlined text-emerald-600">school</span>
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Your academic standing</h2>
            </div>
            <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Student</dt><dd className="text-right font-semibold text-slate-900 dark:text-slate-100">{studentProfile.name}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Matric number</dt><dd className="text-right font-mono font-semibold text-slate-900 dark:text-slate-100">{studentProfile.matricNo || 'Not set'}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Department</dt><dd className="text-right font-semibold text-slate-900 dark:text-slate-100">{studentProfile.department}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Level</dt><dd className="text-right font-semibold text-slate-900 dark:text-slate-100">{studentProfile.level || 'Not set'}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Admission session</dt><dd className="text-right font-semibold text-slate-900 dark:text-slate-100">{studentProfile.admissionSession || 'Not set'}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-slate-500">Recorded credit units</dt><dd className="text-right font-semibold text-slate-900 dark:text-slate-100">{studentStats.totalUnits}</dd></div>
            </dl>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ['First Class', '4.50–5.00'],
                ['Second Class Upper', '3.50–4.49'],
                ['Second Class Lower', '2.40–3.49'],
                ['Third Class', '1.50–2.39'],
              ].map(([label, range]) => <div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3"><div className="text-xs font-bold text-slate-800 dark:text-slate-100">{label}</div><div className="mt-1 text-[11px] text-slate-500">{range} CGPA</div></div>)}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {!academicAnalytics ? (
            <section className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Aggregate analytics are loading or no authorized academic records are available.
            </section>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  ['Students in scope', academicAnalytics.studentCount],
                  ['With uploaded results', academicAnalytics.studentsWithResults],
                  ['Mean CGPA', academicAnalytics.meanCgpa?.toFixed(2) ?? '—'],
                ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-2 text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">{value}</div><div className="mt-1 text-[11px] text-slate-500">Latest available uploads · {getCurrentAcademicSession()}</div></div>)}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                  <h2 className="mb-5 font-bold text-slate-900 dark:text-slate-100">Projected Graduation Classification</h2>
                  <div className="space-y-4">
                    {academicAnalytics.classifications.map((item, index) => (
                      <div key={item.name}>
                        <div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-700 dark:text-slate-200">{item.name}</span><span className="font-mono font-bold text-slate-900 dark:text-slate-100">{item.count}</span></div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${CLASSIFICATION_COLORS[index % CLASSIFICATION_COLORS.length]}`} style={{ width: `${item.count / maxStudents * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-500">Based on each student’s latest stored CGPA in your authorized scope.</p>
                </section>
                <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                  <h2 className="mb-5 font-bold text-slate-900 dark:text-slate-100">Course outcomes</h2>
                  {academicAnalytics.courses.length ? <div className="max-h-[24rem] space-y-3 overflow-y-auto">
                    {academicAnalytics.courses.map((course) => <div key={course.code} className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">{course.code}</div><div className="mt-0.5 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{course.title || 'Untitled course'}</div></div><div className="shrink-0 text-right"><div className="text-sm font-bold text-slate-900 dark:text-slate-100">{course.passRate}%</div><div className="text-[10px] text-slate-500">{course.attempts} attempts</div></div></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${course.passRate}%` }} /></div>
                    </div>)}
                  </div> : <p className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-sm text-slate-500">No course results are available in your scope yet.</p>}
                </section>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
