import React, { useState } from 'react';
import { CourseResult, StudentStats, UserProfile } from '../types';
import { ADVISER_AVATAR } from '../data/mockData';

interface StudentDashboardProps {
  studentProfile: UserProfile;
  stats: StudentStats;
  courseResults: CourseResult[];
  onOpenAdvisorChat: () => void;
  onOpenBookAppointment: () => void;
  onOpenTranscriptModal: () => void;
  hasNudgeNotice?: boolean;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  studentProfile,
  stats,
  courseResults,
  onOpenAdvisorChat,
  onOpenBookAppointment,
  onOpenTranscriptModal,
  hasNudgeNotice = false,
}) => {
  const [selectedSemester, setSelectedSemester] = useState<string>('Fall 2024');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  const filteredCourses = courseResults.filter((c) => {
    const matchesSemester = c.semester === selectedSemester;
    const matchesGrade = gradeFilter === 'ALL' || c.grade === gradeFilter;
    return matchesSemester && matchesGrade;
  });

  const totalTargetUnits = 140; // Standard 4-year degree requirements
  const progressRatio = Math.min(stats.passedUnits / totalTargetUnits, 1);
  const strokeDashoffset = 283 - 283 * progressRatio;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Nudge Alert Notice if Adviser requested upload */}
      {(hasNudgeNotice || !studentProfile.hasUploadedTranscript) && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700">
              <span className="material-symbols-outlined text-[22px]">notifications_active</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
                Level Adviser Result Verification Notice
                <span className="bg-amber-200/80 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  Action Required
                </span>
              </h3>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-1 leading-relaxed max-w-2xl">
                Dr. Sarah Jenkins has requested your official Fall 2024 academic result slip for session audit.
                Please upload your PDF or portal screenshot to automatically extract your grades via OCR.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenTranscriptModal}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm shrink-0 w-full sm:w-auto justify-center"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Upload Result PDF
          </button>
        </div>
      )}

      {/* Page Title & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Academic Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {selectedSemester} • {studentProfile.department}, B.S. • Matric:{' '}
            <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
              {studentProfile.matricNo || 'CSC/2024/001'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {studentProfile.hasUploadedTranscript ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">verified</span>
              <span>Result Slip Verified</span>
              <button
                onClick={onOpenTranscriptModal}
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 underline font-bold ml-1 text-[11px]"
              >
                Re-scan
              </button>
            </div>
          ) : (
            <button
              id="open-transcript-btn"
              onClick={onOpenTranscriptModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">document_scanner</span>
              Scan / Upload Result PDF
            </button>
          )}
        </div>
      </div>

      {/* Top Row: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Cumulative GPA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between relative shadow-xs hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Cumulative GPA
            </p>
            <div className="flex items-end gap-3">
              <span className="text-[36px] font-bold text-slate-900 dark:text-slate-100 leading-none tracking-tight font-mono">
                {stats.cgpa.toFixed(2)}
              </span>
              <div className="flex items-center text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md text-xs font-semibold mb-1 border border-emerald-200 dark:border-emerald-800">
                <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                +{stats.cgpaDelta.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span>{stats.cohortPercentile}</span>
            <span className="material-symbols-outlined text-[18px] text-amber-500">
              emoji_events
            </span>
          </div>
        </div>

        {/* Card 2: Current Semester GPA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between relative shadow-xs hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Current Semester GPA
            </p>
            <div className="flex items-end gap-3">
              <span className="text-[36px] font-bold text-slate-900 dark:text-slate-100 leading-none tracking-tight font-mono">
                {stats.currentGpa.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${(stats.currentGpa / 5.0) * 100}%` }}
              />
            </div>
            <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 text-right font-medium">
              Proj. Final:{' '}
              <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                {stats.projGpa.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Progress Ring: Passed vs Carryover */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center relative shadow-xs hover:shadow-md transition-shadow">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#059669"
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none font-mono">
                {stats.passedUnits}
              </span>
              <span className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5">
                Units
              </span>
            </div>
          </div>

          <div className="mt-3 w-full flex justify-between px-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-center">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Passed</div>
              <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm font-mono">{stats.passedUnits}</div>
            </div>
            <div className="w-px h-7 bg-slate-200 dark:bg-slate-800" />
            <div className="text-center">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Carryover</div>
              <div
                className={`font-bold text-sm font-mono ${
                  stats.carryoverUnits > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {stats.carryoverUnits}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Upcoming Deadlines */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col relative shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">
                event_note
              </span>
              Deadlines
            </h3>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Active
            </span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-900 dark:text-slate-100 font-semibold leading-tight">
                  CSC401 Project Proposal
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">Tomorrow, 11:59 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-900 dark:text-slate-100 font-semibold leading-tight">
                  Course Registration Closes
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Nov 15, 5:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Table & Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Data Table: Course Results (Spans 2 cols) */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden h-full shadow-xs">
            {/* Table Header / Controls */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">
                  assignment
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Course Results ({filteredCourses.length})
                </h3>
              </div>

              {/* Semester & Filter selectors */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-44">
                  <select
                    id="semester-select"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-3 pr-8 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer shadow-2xs"
                  >
                    <option value="Fall 2024" className="dark:bg-slate-800">Fall 2024 (Current)</option>
                    <option value="Spring 2024" className="dark:bg-slate-800">Spring 2024</option>
                    <option value="Fall 2023" className="dark:bg-slate-800">Fall 2023</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>

                <div className="relative">
                  <select
                    id="grade-filter-select"
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-2.5 pr-7 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer shadow-2xs"
                  >
                    <option value="ALL" className="dark:bg-slate-800">All Grades</option>
                    <option value="A" className="dark:bg-slate-800">Grade A</option>
                    <option value="B" className="dark:bg-slate-800">Grade B</option>
                    <option value="C" className="dark:bg-slate-800">Grade C</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none text-[16px]">
                    filter_list
                  </span>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto w-full flex-1">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Course Code
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Title
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                      Units
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                      Grade
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                      Score
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                        No course records found matching the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400 font-mono">{c.code}</td>
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-medium">{c.title}</td>
                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400 font-mono">{c.units}</td>
                        <td
                          className={`py-3 px-4 text-center font-bold font-mono ${
                            c.grade === 'A'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : c.grade === 'B'
                              ? 'text-blue-600 dark:text-blue-400'
                              : c.grade === 'C'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {c.grade}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-700 dark:text-slate-300">{c.score}</td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              c.status === 'Passed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : c.status === 'In Progress'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer with Full Transcript Link */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between px-4">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Official NUC 5.0 Grading System
              </span>
              <button
                id="view-full-transcript-link"
                onClick={onOpenTranscriptModal}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors inline-flex items-center gap-1 font-bold"
              >
                Scan / Upload Results <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets (Spans 1 col) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Level Adviser Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col relative shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">badge</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">Level Adviser</h3>
            </div>

            <div className="flex flex-col items-center text-center mb-5 relative z-10">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-200 dark:border-emerald-700 p-0.5 mb-3 relative bg-slate-50 dark:bg-slate-800">
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 z-10" />
                <img
                  src={ADVISER_AVATAR}
                  alt="Dr. Sarah Jenkins"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Dr. Sarah Jenkins</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Assoc. Prof, Computer Science</p>
              <span className="mt-2 text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-semibold">
                Office Hours: Mon/Wed 10-2pm
              </span>
            </div>

            <div className="space-y-2 relative z-10">
              <button
                id="message-adviser-btn"
                onClick={onOpenAdvisorChat}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 px-4 text-xs font-semibold transition-all flex items-center justify-center gap-2 group shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">forum</span>
                Message Adviser
              </button>

              <button
                id="book-appointment-btn"
                onClick={onOpenBookAppointment}
                className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg py-2 px-4 text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">event</span>
                Book Appointment
              </button>
            </div>
          </div>

          {/* Semester Progress Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col relative shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">timeline</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">Semester Progress</h3>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="font-medium">Weeks Completed</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold font-mono">
                    {stats.weeksCompleted} / {stats.totalWeeks}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${(stats.weeksCompleted / stats.totalWeeks) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="font-medium">Assessments Done</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold font-mono">
                    {stats.assessmentsDone} / {stats.totalAssessments}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(stats.assessmentsDone / stats.totalAssessments) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
