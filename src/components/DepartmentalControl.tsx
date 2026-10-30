import React, { useState } from 'react';
import { Adviser, CourseSuccessRate } from '../types';

interface DepartmentalControlProps {
  department: string;
  advisers: Adviser[];
  courseRates: CourseSuccessRate[];
  onOpenAssignAdvisorModal: (adviser?: Adviser) => void;
  onOpenExportReportModal: () => void;
  onOpenAdminPortal?: () => void;
}

export const DepartmentalControl: React.FC<DepartmentalControlProps> = ({
  department,
  advisers,
  courseRates,
  onOpenAssignAdvisorModal,
  onOpenExportReportModal,
  onOpenAdminPortal,
}) => {
  const [sessionSearch, setSessionSearch] = useState<string>('All');
  const [adviserSearch, setAdviserSearch] = useState<string>('');

  // Departmental cohorts by specific academic session names
  const cohortSessions = department === 'Computer Science' ? [
    { session: '2026/2027 Session', level: '100L', students: 180, passRate: 88, color: 'bg-emerald-500', height: '88px' },
    { session: '2025/2026 Session', level: '200L', students: 165, passRate: 78, color: 'bg-teal-500', height: '110px' },
    { session: '2024/2025 Session', level: '300L', students: 142, passRate: 85, color: 'bg-emerald-600', height: '140px' },
    { session: '2023/2024 Session', level: '400L', students: 130, passRate: 91, color: 'bg-blue-600', height: '155px' },
    { session: '2022/2023 Session', level: '500L', students: 95, passRate: 96, color: 'bg-indigo-600', height: '170px' },
  ] : [];

  const filteredAdvisers = advisers.filter((adv) => {
    const matchesSession =
      sessionSearch === 'All' ||
      (adv.assignedSession && adv.assignedSession.includes(sessionSearch)) ||
      adv.assignedLevel === sessionSearch;
    const matchesName = adv.name.toLowerCase().includes(adviserSearch.toLowerCase());
    return matchesSession && matchesName;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Management Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">
            {department} Dept. • Faculty of Computing &amp; Information Technology
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Departmental Control and Academic Oversight
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cohort progression tracking, session-based advisor allocation, and departmental grade distribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="dept-export-rpt-btn"
            onClick={onOpenExportReportModal}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">download</span>
            Export Report
          </button>
          <button
            id="dept-assign-adviser-btn"
            onClick={() => onOpenAssignAdvisorModal()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Assign Session Adviser
          </button>
        </div>
      </div>

      {/* Top Bento Grid: Specific Session Cohort Breakdown & Coverage */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Overall Performance: Session-based Performance Breakdown (Spans 8 cols) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:col-span-8 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Department-wide Session Cohort Progression
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Academic Progression by Specific Session Sets
              </p>
            </div>
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">
              bar_chart
            </span>
          </div>

          {/* Bar Chart Area with Specific Session Names */}
          <div className="h-48 w-full flex items-end justify-around border-b border-slate-100 dark:border-slate-800 pb-2 px-2">
            {cohortSessions.length === 0 ? <p className="w-full text-center text-xs text-slate-400 self-center">No cohort analytics are available for this department yet.</p> : cohortSessions.map((cohort, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 group relative w-20">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {cohort.passRate}% pass
                </span>
                <div
                  className={`w-12 ${cohort.color} rounded-t transition-all duration-500 hover:opacity-90`}
                  style={{ height: cohort.height }}
                />
                <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 text-center leading-tight">
                  {cohort.session.split(' ')[0]}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {cohort.level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Advising Coverage Widget (Spans 4 cols) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:col-span-4 flex flex-col justify-between shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
            Session Advising Allocation Status
          </h3>

          <div className="flex justify-center items-center py-2 relative">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle
                className="stroke-slate-100 dark:stroke-slate-800"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                strokeWidth="8"
              />
              <circle
                className="stroke-emerald-600 dark:stroke-emerald-500 transition-all duration-1000 ease-out"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                strokeDasharray="251.2"
                strokeDashoffset="25.1" /* 90% */
                strokeLinecap="round"
                strokeWidth="8"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">100%</span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Active Cohort Lead
              </span>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total Cohort Sets</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{cohortSessions.length} Sessions</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Allocated Advisers</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {advisers.length} Faculty Members
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Adviser Allocation Matrix (Without Load Factor) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Session Adviser Allocation Matrix
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Academic Advisers mapped to specific session cohorts
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus-within:border-emerald-600 transition-colors shadow-2xs">
              <span className="material-symbols-outlined text-slate-400 text-[16px] mr-1.5">
                search
              </span>
              <input
                type="text"
                value={adviserSearch}
                onChange={(e) => setAdviserSearch(e.target.value)}
                placeholder="Search staff adviser..."
                className="bg-transparent border-none focus:ring-0 text-xs text-slate-900 dark:text-slate-100 w-36 placeholder:text-slate-400 p-0 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <th className="py-2.5 px-3">Adviser Name</th>
                <th className="py-2.5 px-3">Assigned Academic Session</th>
                <th className="py-2.5 px-3">Cohort Level</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
              {filteredAdvisers.map((adviser) => (
                <tr key={adviser.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                      {adviser.initials}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">{adviser.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{adviser.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {adviser.assignedSession || '2024/2025 Session'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                    {adviser.assignedLevel}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {adviser.department}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onOpenAssignAdvisorModal(adviser)}
                      className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Session Assignment"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Success Rates */}
      {department === 'Computer Science' && <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Departmental Course Performance Metrics
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Pass rate indicators across academic computing curriculum
            </p>
          </div>
          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">
            school
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <th className="py-2.5 px-3">Course Code</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3 text-center">Pass Rate</th>
                <th className="py-2.5 px-3 text-right">Academic Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
              {courseRates.map((course, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {course.code}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{course.title}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono font-bold">{course.passRate}%</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        course.rating === 'High'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : course.rating === 'Avg'
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {course.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
};
