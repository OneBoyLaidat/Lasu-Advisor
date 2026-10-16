import React, { useState } from 'react';
import { UserRole } from '../types';

interface AnalyticsViewProps {
  userRole?: UserRole;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ userRole = 'student' }) => {
  const isStudent = userRole === 'student';

  // GPA Target Calculator state (Students only)
  const [currentCgpa, setCurrentCgpa] = useState<number>(3.82);
  const [completedUnits, setCompletedUnits] = useState<number>(112);
  const [targetCgpa, setTargetCgpa] = useState<number>(4.5);
  const [remainingUnits, setRemainingUnits] = useState<number>(28);

  // Departmental Projection state (Lecturer / HOD / Dean)
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('2024/2025');

  // Student Required GPA calculation
  const totalTargetPoints = targetCgpa * (completedUnits + remainingUnits);
  const currentPoints = currentCgpa * completedUnits;
  const neededPoints = totalTargetPoints - currentPoints;
  const requiredGpa = remainingUnits > 0 ? neededPoints / remainingUnits : 0;
  const isPossible = requiredGpa <= 5.0 && requiredGpa >= 0;

  // Departmental Cohort Projections for Staff
  const cohortProjections = [
    { classification: 'First Class (4.50 - 5.00)', count: 24, percent: 17, color: 'bg-emerald-500', barWidth: '17%' },
    { classification: 'Second Class Upper (3.50 - 4.49)', count: 68, percent: 48, color: 'bg-teal-500', barWidth: '48%' },
    { classification: 'Second Class Lower (2.40 - 3.49)', count: 38, percent: 27, color: 'bg-blue-500', barWidth: '27%' },
    { classification: 'Third Class (1.50 - 2.39)', count: 12, percent: 8, color: 'bg-amber-500', barWidth: '8%' },
  ];

  const courseBenchmarkData = [
    { code: 'CSC 301', title: 'Data Structures & Algorithms', passRate: 88, status: 'Strong', avgGpa: 3.92 },
    { code: 'CSC 303', title: 'Database Management Systems', passRate: 82, status: 'Strong', avgGpa: 3.78 },
    { code: 'MTH 301', title: 'Discrete Computational Mathematics', passRate: 64, status: 'Curriculum Review', avgGpa: 3.12 },
    { code: 'CSC 305', title: 'Operating Systems & Architecture', passRate: 72, status: 'Normal', avgGpa: 3.45 },
    { code: 'GNS 311', title: 'Entrepreneurship & Venture Studies', passRate: 94, status: 'Exceeding', avgGpa: 4.25 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Accessible, High-Contrast Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Academic Analytics &amp; Projections
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
            {isStudent
              ? 'Personal honors classification modeling, GPA forecasting, and graduation target simulation.'
              : 'Departmental cohort performance forecasting, graduation classification modeling, and pass metrics.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {isStudent ? 'Student Target Modeling' : 'Departmental Cohort Analytics'}
          </span>
        </div>
      </div>

      {/* Main Content Layout */}
      {isStudent ? (
        /* ================= STUDENT VIEW: CGPA TARGET CALCULATOR & PROGRESSION ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Target Projector (Spans 6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[22px]">
                  calculate
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Cumulative GPA Target Calculator
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-5 leading-relaxed">
                Simulate required semester GPAs needed across remaining credit units to achieve your desired honors degree classification.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Current CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={currentCgpa}
                    onChange={(e) => setCurrentCgpa(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Units Completed
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={completedUnits}
                    onChange={(e) => setCompletedUnits(parseInt(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Target CGPA
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={targetCgpa}
                      onChange={(e) => setTargetCgpa(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setTargetCgpa(4.5)}
                      className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 font-bold whitespace-nowrap hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                    >
                      1st Class
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Remaining Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={remainingUnits}
                    onChange={(e) => setRemainingUnits(parseInt(e.target.value) || 1)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Calculator Output */}
            <div
              className={`p-4 rounded-xl border ${
                isPossible
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80'
                  : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">
                    Required GPA per Remaining Unit
                  </span>
                  <div
                    className={`text-3xl font-bold font-mono mt-1 ${
                      isPossible ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {isPossible ? requiredGpa.toFixed(2) : 'Exceeds 5.00 Maximum'}
                  </div>
                </div>
                <div
                  className={`p-3 rounded-full ${
                    isPossible
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">
                    {isPossible ? 'verified' : 'cancel'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-2 leading-relaxed">
                {isPossible
                  ? `Maintain an average of ${requiredGpa.toFixed(2)} across your final ${remainingUnits} credit units to graduate with a ${targetCgpa.toFixed(2)} CGPA.`
                  : `Achieving ${targetCgpa.toFixed(2)} requires a mathematically unfeasible GPA score. Consider setting a target of ${(
                      (currentPoints + 5.0 * remainingUnits) /
                      (completedUnits + remainingUnits)
                    ).toFixed(2)}.`}
              </p>
            </div>
          </div>

          {/* Right Column: Historical Trends & Progression (Spans 6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Cohort Progression */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 shadow-xs">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">
                    trending_up
                  </span>
                  Semester GPA Progression Trajectory
                </h3>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                  100L - 400L
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300 font-medium">
                    <span>Year 1 (100L) - Foundation Core</span>
                    <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">3.65 GPA</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 dark:bg-emerald-500 rounded-full" style={{ width: '73%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300 font-medium">
                    <span>Year 2 (200L) - Intermediate Computing</span>
                    <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">3.74 GPA</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300 font-medium">
                    <span>Year 3 (300L) - Advanced Specialization</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">3.82 GPA (Current)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full"
                      style={{ width: '76.4%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Classification Thresholds Guide */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 shadow-xs">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">
                    school
                  </span>
                  LASU NUC Honors Classification Scale
                </h3>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full font-bold">
                  Official 5.0 Scale
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300">First Class</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">4.50 – 5.00 CGPA</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-teal-700 dark:text-teal-300">Second Class (Upper)</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">3.50 – 4.49 CGPA</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-blue-700 dark:text-blue-300">Second Class (Lower)</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">2.40 – 3.49 CGPA</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-amber-700 dark:text-amber-300">Third Class</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">1.50 – 2.39 CGPA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= STAFF VIEW: LECTURERS, HODS & DEANS (CGPA TARGET CALCULATOR REMOVED) ================= */
        <div className="space-y-6">
          {/* Top Filter Bar for Session Analysis */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">tune</span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Departmental Cohort Forecasting Session:
              </span>
            </div>
            <div className="flex items-center gap-2">
              {['2024/2025', '2023/2024', '2022/2023', '2021/2022'].map((sess) => (
                <button
                  key={sess}
                  onClick={() => setSelectedSessionFilter(sess)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedSessionFilter === sess
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {sess}
                </button>
              ))}
            </div>
          </div>

          {/* Grid 1: Degree Classification Projection & Departmental Trajectory */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cohort Honors Classification Projections (Spans 7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">
                      stacked_bar_chart
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Projected Graduation Classification Breakdown
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    142 Advisees ({selectedSessionFilter})
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-5">
                  Institutional graduation projection based on current cumulative GPA vectors and semester pass trends.
                </p>

                <div className="space-y-4">
                  {cohortProjections.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.classification}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {item.count} students ({item.percent}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-700`}
                          style={{ width: item.barWidth }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>NUC Accreditation Benchmark: &ge; 60% Upper Division</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Current: 65% Met
                </span>
              </div>
            </div>

            {/* Departmental Pass & Progression Trajectory (Spans 5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">
                      timeline
                    </span>
                    Cohort Retention Progression
                  </h3>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                    94.2% Retention
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300 font-medium">
                      <span>100 Level Cohort Retention</span>
                      <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">96.8%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '96.8%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300 font-medium">
                      <span>200 Level Cohort Retention</span>
                      <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">95.1%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95.1%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300 font-medium">
                      <span>300 Level Cohort Retention</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">92.4%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: '92.4%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300 font-medium">
                      <span>400 Level Finalist Retention</span>
                      <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">98.2%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98.2%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Academic Standing Summary:</span>
                Mean Cumulative GPA: <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">3.84</span> across departmental advisees in Computer Science.
              </div>
            </div>
          </div>

          {/* Grid 2: Course Success & Pass Variance Audit */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">
                    analytics
                  </span>
                  Core Course Performance &amp; Pass Rate Benchmarking
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Session {selectedSessionFilter} pass rate variance against departmental standards
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3">Course Code</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3 text-center">Avg GPA</th>
                    <th className="py-2.5 px-3 text-center">Pass Rate</th>
                    <th className="py-2.5 px-3 text-right">Academic Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {courseBenchmarkData.map((course, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {course.code}
                      </td>
                      <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-medium">{course.title}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                        {course.avgGpa.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {course.passRate}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                course.passRate >= 80
                                  ? 'bg-emerald-600'
                                  : course.passRate >= 70
                                  ? 'bg-blue-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${course.passRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            course.status === 'Exceeding' || course.status === 'Strong'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : course.status === 'Normal'
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {course.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
