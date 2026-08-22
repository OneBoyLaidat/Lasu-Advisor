import React, { useState } from 'react';
import { Adviser, CourseSuccessRate } from '../types';

interface DepartmentalControlProps {
  advisers: Adviser[];
  courseRates: CourseSuccessRate[];
  onOpenAssignAdvisorModal: (adviser?: Adviser) => void;
  onOpenExportReportModal: () => void;
}

export const DepartmentalControl: React.FC<DepartmentalControlProps> = ({
  advisers,
  courseRates,
  onOpenAssignAdvisorModal,
  onOpenExportReportModal,
}) => {
  const [levelSearch, setLevelSearch] = useState<string>('300 Level');
  const [matricSearch, setMatricSearch] = useState<string>('');

  const filteredAdvisers = advisers.filter((adv) => {
    const matchesLevel = levelSearch === 'All' || adv.assignedLevel === levelSearch;
    const matchesName = adv.name.toLowerCase().includes(matricSearch.toLowerCase());
    return matchesLevel && matchesName;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Management Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">
            Computer Science Dept. • Faculty of Science &amp; Engineering
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Departmental Control
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="dept-export-rpt-btn"
            onClick={onOpenExportReportModal}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">download</span>
            Export Rpt
          </button>
          <button
            id="dept-assign-adviser-btn"
            onClick={() => onOpenAssignAdvisorModal()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Assign Adviser
          </button>
        </div>
      </div>

      {/* Top Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Overall Performance: Dept-wide Performance Breakdown (Spans 8 cols) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:col-span-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Dept-wide Performance Breakdown
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Cohort Pass &amp; Retention Progression</p>
            </div>
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">
              bar_chart
            </span>
          </div>

          {/* Bar Chart Area */}
          <div className="h-44 w-full flex items-end justify-around border-b border-slate-100 pb-2 px-2">
            {/* 100L */}
            <div className="w-12 flex flex-col items-center gap-2 group relative">
              <span className="text-[11px] text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                40%
              </span>
              <div
                className="w-full bg-emerald-100 hover:bg-emerald-200 rounded-t transition-all duration-500"
                style={{ height: '70px' }}
              />
              <span className="text-xs text-slate-600 font-medium">100L</span>
            </div>

            {/* 200L */}
            <div className="w-12 flex flex-col items-center gap-2 group relative">
              <span className="text-[11px] text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                60%
              </span>
              <div
                className="w-full bg-amber-100 hover:bg-amber-200 rounded-t transition-all duration-500"
                style={{ height: '105px' }}
              />
              <span className="text-xs text-slate-600 font-medium">200L</span>
            </div>

            {/* 300L */}
            <div className="w-12 flex flex-col items-center gap-2 group relative">
              <span className="text-[11px] text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                85%
              </span>
              <div
                className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-t transition-all duration-500"
                style={{ height: '145px' }}
              />
              <span className="text-xs text-emerald-700 font-bold">300L</span>
            </div>

            {/* 400L */}
            <div className="w-12 flex flex-col items-center gap-2 group relative">
              <span className="text-[11px] text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                45%
              </span>
              <div
                className="w-full bg-amber-100 hover:bg-amber-200 rounded-t transition-all duration-500"
                style={{ height: '80px' }}
              />
              <span className="text-xs text-slate-600 font-medium">400L</span>
            </div>

            {/* 500L */}
            <div className="w-12 flex flex-col items-center gap-2 group relative">
              <span className="text-[11px] text-rose-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                20%
              </span>
              <div
                className="w-full bg-rose-100 hover:bg-rose-200 rounded-t transition-all duration-500"
                style={{ height: '40px' }}
              />
              <span className="text-xs text-slate-600 font-medium">500L</span>
            </div>
          </div>
        </div>

        {/* Advising Health (Spans 4 cols) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:col-span-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Advising Health</h3>

          <div className="flex justify-center items-center py-2 relative">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle
                className="stroke-slate-100"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                strokeWidth="8"
              />
              <circle
                className="stroke-emerald-600 transition-all duration-1000 ease-out"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                strokeDasharray="251.2"
                strokeDashoffset="62.8" /* 75% */
                strokeLinecap="round"
                strokeWidth="8"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">75%</span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Coverage
              </span>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-600 font-medium">Unassigned Students</span>
              <span className="text-sm font-bold text-rose-600">124</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-600 font-medium">Active Advisers</span>
              <span className="text-sm font-bold text-emerald-700">12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Matrix & Ranking */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Adviser Assignment Status Matrix (Spans 8 cols) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:col-span-8 flex flex-col shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Adviser Assignment Matrix</h3>
              <p className="text-[11px] text-slate-500 font-medium">Current Student Capacity &amp; Advising Load</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 focus-within:border-emerald-600 transition-colors shadow-2xs">
                <span className="material-symbols-outlined text-slate-400 text-[16px] mr-1.5">
                  search
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mr-2 border border-emerald-200">
                  Level: 300
                </span>
                <input
                  type="text"
                  value={matricSearch}
                  onChange={(e) => setMatricSearch(e.target.value)}
                  placeholder="Search adviser..."
                  className="bg-transparent border-none focus:ring-0 text-xs text-slate-900 w-28 placeholder:text-slate-400 p-0 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest rounded-tl-lg">
                    Adviser Name
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                    Assigned Level
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                    Student Load
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-right rounded-tr-lg">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredAdvisers.map((adviser) => {
                  const percentage = Math.min((adviser.studentLoad / adviser.maxLoad) * 100, 100);
                  return (
                    <tr key={adviser.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
                          {adviser.initials}
                        </div>
                        <span className="font-semibold text-slate-900">{adviser.name}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{adviser.assignedLevel}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-mono text-[11px] font-semibold">
                            {adviser.studentLoad}/{adviser.maxLoad}
                          </span>
                          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                adviser.status === 'Optimal'
                                  ? 'bg-emerald-600'
                                  : adviser.status === 'Overloaded'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            adviser.status === 'Optimal'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : adviser.status === 'Overloaded'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {adviser.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenAssignAdvisorModal(adviser)}
                          className="text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-slate-100 transition-colors"
                          title="Edit Assignment"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Faculty Performance Ranking (Spans 4 cols) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:col-span-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Faculty Performance Ranking</h3>
              <p className="text-[11px] text-slate-500 font-medium">Top Advisee Performance</p>
            </div>
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">groups</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="py-2 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest rounded-tl-lg">
                    Faculty Member
                  </th>
                  <th className="py-2 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-right rounded-tr-lg">
                    Avg. Advisee CGPA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {advisers.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] border border-slate-200">
                        {adv.initials}
                      </div>
                      <span className="font-semibold text-slate-900">{adv.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`font-bold font-mono ${
                          adv.avgAdviseeCgpa >= 4.0
                            ? 'text-emerald-700'
                            : adv.avgAdviseeCgpa >= 3.9
                            ? 'text-blue-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {adv.avgAdviseeCgpa.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Course Success Rates (Spans 12 cols) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Course Success Rates</h3>
            <p className="text-[11px] text-slate-500 font-medium">Pass percentage across foundational and core courses</p>
          </div>
          <span className="material-symbols-outlined text-emerald-600 text-[20px]">bar_chart</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {courseRates.map((c) => (
            <div
              key={c.code}
              className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all hover:bg-slate-50"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-slate-900">{c.code}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                    c.rating === 'High'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : c.rating === 'Avg'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {c.rating}
                </span>
              </div>

              <p className="text-xs text-slate-500 truncate mb-2 font-medium">{c.title}</p>

              <div className="flex items-end gap-2 mb-2">
                <span className="text-2xl font-bold text-slate-900 leading-none">
                  {c.passRate}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Pass Rate</span>
              </div>

              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    c.rating === 'High'
                      ? 'bg-emerald-600'
                      : c.rating === 'Avg'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${c.passRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
